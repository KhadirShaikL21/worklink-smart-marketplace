import { useState } from 'react';
import api from '../utils/api';

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('How can I find workers nearby?');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async e => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError('');
    setInput('');
    try {
      const res = await api.post('/api/ai/chat', { message: userMsg.content });
      const reply = res.data?.reply || 'No reply';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Assistant failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-widget">
      <button className="assistant-toggle" onClick={() => setOpen(o => !o)}>
        {open ? 'Close AI' : 'Ask AI'}
      </button>
      {open && (
        <div className="assistant-panel">
          <div className="assistant-messages">
            {messages.length === 0 && <p className="muted">Ask anything about using WorkLink.</p>}
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'msg user' : 'msg bot'}>
                <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
              </div>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <form onSubmit={send} className="assistant-form">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question"
            />
            <button type="submit" disabled={loading}>{loading ? 'Thinking...' : 'Send'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
