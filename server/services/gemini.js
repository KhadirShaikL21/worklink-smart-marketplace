import { GoogleGenAI } from "@google/genai";
import env from '../config/env.js';
import { CUSTOMER_PROMPT, WORKER_PROMPT } from '../config/aiPrompts.js';

// List of models to try in order of preference/stability
// Updated based on available models for the key from check-models.js
const MODELS_TO_TRY = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 
  'gemini-flash-latest',
  'gemini-pro-latest'
];

function getClient() {
  if (!env.geminiApiKey) return null;
  return new GoogleGenAI({ apiKey: env.geminiApiKey });
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

      if (!isNotFound && !isRateLimited) {
          console.error(`Gemini Error (${modelName}):`, msg);
          throw err;
      }
      
      if (isRateLimited) {
        console.warn(`Gemini Model ${modelName} rate limited. Switching to next model...`);
      }

      lastError = err;
      // Continue to next model
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

export async function generateStructuredJobDescription(prompt) {
  try {
    const text = await generateWithFallback(async (ai, model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt, // Simple string content
            config: {
                responseMimeType: 'application/json' 
            }
        });
        return response.text; 
    });
    
    // Clean up if the model returns markdown JSON despite mimeType
    const cleaned = text && text.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleaned || '{}';
  } catch (err) {
    console.error('Gemini Structure Gen failed:', err);
    return JSON.stringify({});
  }
}

export async function generateChatReply(message, context = {}) {
  try {
    const { role } = context; 
    const systemPrompt = role === 'worker' ? WORKER_PROMPT : CUSTOMER_PROMPT;

    const text = await generateWithFallback(async (ai, model) => {
        // We will put the system instruction in the first user message 
        // to be compatible with models that support it and those that don't (via prompt injection)
        const response = await ai.models.generateContent({
             model: model,
             contents: [
                 {
                     role: 'user',
                     parts: [{ text: `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nUser: Hello, who are you?` }]
                 },
                 {
                     role: 'model',
                     parts: [{ text: role === 'worker' 
                        ? "Namaste! I am the WorkLink Partner Support Assistant. I am here to help you get more jobs, understand the app, and earn better. Ask me anything in English, Hindi, or Telugu!" 
                        : "Hello! I am your WorkLink Customer Assistant. I can help you post jobs, track workers, and manage payments. How can I assist you today?" 
                    }]
                 },
                 {
                     role: 'user',
                     parts: [{ text: message }]
                 }
             ]
        });
        return response.text;
    });

    return text ? text.trim() : '';

  } catch (err) {
    console.error('Gemini Chat failed:', err);
     const reason = err?.message || 'unknown error';
    if (reason.includes('429') || reason.includes('quota')) {
      return 'AI temporarily paused: Gemini quota exceeded. Please retry in ~1 minute.';
    }
    return `Sorry, the AI service is unavailable right now. (${reason})`;
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
