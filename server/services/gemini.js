import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

const DEFAULT_MODEL = env.geminiModel || 'gemini-2.0-flash';

function getModel() {
  if (!env.geminiApiKey) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  return genAI.getGenerativeModel({ model: DEFAULT_MODEL });
}

export async function generateStructuredJobDescription(prompt) {
  try {
    const model = getModel();
    if (!model) throw new Error('Gemini API key missing');
    const response = await model.generateContent(prompt);
    const text = response.response?.text?.() || response.response?.text || '';
    return text;
  } catch (err) {
    console.error('Gemini structured generation failed, falling back:', err?.response?.data || err?.message || err);
    const reason = err?.response?.data?.error?.message || err?.message || 'unknown error';
    const quota = err?.response?.data?.error?.code === 429;
    return JSON.stringify({
      title: '',
      category: 'General',
      skills_required: [],
      tasks: [],
      hours_estimate: 1,
      budget: { currency: 'INR', min: 0, max: 0 },
      tools_required: [],
      urgency: 'medium',
      location_hint: '',
      missing_fields: [],
      clarifying_questions: quota ? ['Gemini quota exceeded; please retry later'] : ['AI service unavailable; please fill details manually'],
      guidance: {
        audience: 'customer',
        posting_tips: ['Be specific about the task', 'Mention any tools provided'],
        worker_notes: []
      },
      language: 'en',
      debug_reason: `gemini-error: ${reason}`
    });
  }
}

export async function generateChatReply(message, context = {}) {
  try {
    const model = getModel();
    if (!model) throw new Error('Gemini API key missing');
    const system = context.system || 'You are a helpful assistant for WorkLink users.';
    const prompt = `${system}\nUser: ${message}\nAssistant:`;
    const response = await model.generateContent(prompt);
    const text = response.response?.text?.() || response.response?.text || '';
    return text.trim();
  } catch (err) {
    console.error('Gemini chat failed, falling back:', err?.response?.data || err?.message || err);
    const reason = err?.response?.data?.error?.message || err?.message || 'unknown error';
    const quota = err?.response?.data?.error?.code === 429;
    if (quota) {
      return 'AI temporarily paused: Gemini quota exceeded. Please retry in ~1 minute or switch to a paid key.';
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
