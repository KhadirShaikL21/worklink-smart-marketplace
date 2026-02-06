import { validationResult } from 'express-validator';
import { buildJobPrompt, generateStructuredJobDescription, generateChatReply } from '../services/gemini.js';

export async function jobPostAssistant(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { description, language = 'en', context = {}, audience } = req.body;

  const audienceRole =
    audience === 'worker' || audience === 'customer'
      ? audience
      : 'customer';

  try {
    const prompt = buildJobPrompt({ description, language, context, audience: audienceRole });
    const text = await generateStructuredJobDescription(prompt);

    // Attempt to parse JSON; if fails, return raw text for debugging on client.
    let structured = null;
    try {
      structured = JSON.parse(text);
    } catch (err) {
      // keep structured as null
    }

    return res.json({ structured, raw: text, audience: audienceRole });
  } catch (err) {
    console.error('Gemini job assistant error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ message: 'Gemini generation failed', reason: err.message });
  }
}

export async function aiChat(req, res) {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ message: 'message required' });

  // Determine role from authenticated user
  // This logic prioritizes 'worker' if they have the role, otherwise 'customer'
  // In a real dual-role scenario, you might want to pass the current active Dashboard view from the frontend.
  let role = 'customer';
  // Check if req.user exists (set by auth middleware)
  if (req.user && req.user.roles && req.user.roles.includes('worker')) {
      // If user has 'worker' role, we assume they want worker support
      // To strictly separate, we could check which page they are on via context
      role = 'worker';
  }

  // If the user is specifically a customer (and not a worker), force customer prompt
  if (req.user && req.user.roles && req.user.roles.includes('customer') && !req.user.roles.includes('worker')) {
      role = 'customer';
  }

  try {
    const reply = await generateChatReply(message, { role });
    return res.json({ reply });
  } catch (err) {
    console.error('Gemini chat error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ message: 'AI chat failed', reason: err.message });
  }
}
