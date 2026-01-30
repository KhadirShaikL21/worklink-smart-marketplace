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
  const { message, context = {} } = req.body;
  if (!message) return res.status(400).json({ message: 'message required' });
  try {
    const reply = await generateChatReply(message, context);
    return res.json({ reply });
  } catch (err) {
    console.error('Gemini chat error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ message: 'AI chat failed', reason: err.message });
  }
}
