import { GoogleGenerativeAI } from "@google/generative-ai";
import env from '../config/env.js';
import { CUSTOMER_PROMPT, WORKER_PROMPT } from '../config/aiPrompts.js';

// List of models to try in order of preference/stability
// Updated based on available models for the key from check-models.js
const MODELS_TO_TRY = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

function getClient() {
  if (!env.geminiApiKey) return null;
  return new GoogleGenerativeAI(env.geminiApiKey);
}

// Helper to confirm model availability with the new SDK
async function generateWithFallback(operation) {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API key missing');

  let lastError = null;
  // Filter out undefined models
  const models = MODELS_TO_TRY.filter(Boolean);

  for (const modelName of models) {
    try {
      // Pass the client and modelName to the operation
      return await operation(ai, modelName);
    } catch (err) {
      const msg = err.message || '';
      const status = err.status || err.statusCode;
      
      const isNotFound = msg.includes('404') || status === 404 || msg.includes('not found');
      const isRateLimited = msg.includes('429') || status === 429 || msg.includes('quota') || msg.includes('Too Many Requests');
      const isImageError = msg.includes('image') || msg.includes('vision');

      console.warn(`Gemini Warning (${modelName}):`, msg);

      // If text model fails on image, just continue to next model
      if (isImageError && modelName === 'gemini-pro') {
         // ignore
      } else if (!isNotFound && !isRateLimited && !isImageError) {
          // Unexpected error, maybe auth? Throw it unless we want to keep trying
          // let's try others just in case
      }
      
      lastError = err;
      // Continue to next model
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

// Helper to clean Markdown JSON
function cleanJsonMarkdown(text) {
  if (!text) return '{}';
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function generateStructuredJobDescription(prompt) {
  try {
    const text = await generateWithFallback(async (ai, model) => {
        // Skip vision models for text-only tasks if strict, but 1.5 handles both
        const genModel = ai.getGenerativeModel({ model: model });
        
        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    });
    
    return cleanJsonMarkdown(text);
  } catch (err) {
    console.error('Gemini Structure Gen failed:', err);
    return '{}';
  }
}

export async function analyzeDefectImage(imageBuffer, mimeType) {
  try {
    const prompt = `
      Analyze this image of a maintenance issue. 
      Identify the defect, suggested job title, category (Plumbing, Electrical, Carpenter, Appliance, Cleaning, or Other), urgency (low, medium, high, emergency), and a short professional description.
      Also estimate the required skills, budget range (in INR), estimated work hours, and number of workers needed.
      Return ONLY a JSON object with keys: 
      title, 
      category, 
      urgency, 
      description,
      skills_required (array of strings),
      budget_min (number),
      budget_max (number),
      hours_estimate (number),
      workers_needed (number).
    `;
    
    // Create the image part for Gemini
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const text = await generateWithFallback(async (ai, model) => {
      // Legacy gemini-pro does not support images
      if (model === 'gemini-pro') throw new Error('Model gemini-pro does not support images');

      const genModel = ai.getGenerativeModel({ model: model });
      
      const result = await genModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    });

    return cleanJsonMarkdown(text);
  } catch (err) {
    console.error('Gemini Image Analysis failed:', err);
    throw err;
  }
}

export async function generateChatReply(message, context = {}) {
  try {
    const { role } = context; 
    const systemPrompt = role === 'worker' ? WORKER_PROMPT : CUSTOMER_PROMPT;

    const text = await generateWithFallback(async (ai, model) => {
        const generationConfig = {
           temperature: 0.7,
        };
        
        // Use systemInstruction if available (Gemini 1.5+)
        const modelParams = { 
           model: model, 
           generationConfig
        };
        
        // Add system instruction for supported models
        if (model.includes('1.5') || model.includes('flash')) {
           modelParams.systemInstruction = systemPrompt;
        }

        const genModel = ai.getGenerativeModel(modelParams);
        
        // If model doesn't support systemInstruction (legacy), prompt injection
        let finalMessage = message;
        if (!model.includes('1.5') && !model.includes('flash')) {
           finalMessage = `SYSTEM: ${systemPrompt}\n\nUSER: ${message}`;
        }
        
        const result = await genModel.generateContent(finalMessage);
        const response = await result.response;
        return response.text();
    });
    
    return text;
  } catch (err) {
    console.error('Gemini Chat failed:', err);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}

export function buildJobPrompt({ description, language = 'en', context = {}, audience = 'customer' }) {
  const { locationHint = '', budgetHint = '', urgencyHint = '' } = context;

  const baseFields = `"title": string,
  "category": string,
  "skills_required": [string],
  "tasks": [string],
  "hours_estimate": number,
  "budget": { "currency": "INR", "min": number, "max": number },
  "tools_required": [string],
  "urgency": "low"|"medium"|"high"|"emergency",
  "location_hint": string,
  "missing_fields": [string],
  "clarifying_questions": [string],
  "language": string`;

  const customerFields = `"guidance": {
    "audience": "customer",
    "posting_tips": [string],
    "worker_suggestions": [string],
    "improvements": [string]
  }`;

  const workerFields = `"worker_brief": {
    "audience": "worker",
    "job_summary": string,
    "key_tasks": [string],
    "tools_needed": [string],
    "safety_notes": [string],
    "questions_for_customer": [string]
  }`;

  const audienceFields = audience === 'worker' ? workerFields : customerFields;
  const audienceInstruction =
    audience === 'worker'
      ? 'Explain the job clearly to a worker: summarize the work, list concrete tasks, tools, any safety cautions, and clarifying questions.'
      : 'Guide a customer: suggest improvements to the job post, how to phrase it, and what worker skills/tools to look for.';

  return `You are a job assistant for a blue-collar marketplace.
Return ONLY minified JSON.
Fields: {
  ${baseFields},
  ${audienceFields}
}
Audience: ${audience}.
${audienceInstruction}
Constraints: JSON only; no comments; no extra text.
Consider description: ${description}
Hints: location=${locationHint}; budget=${budgetHint}; urgency=${urgencyHint}.
Language for questions: ${language}.
`;
}
