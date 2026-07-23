import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Sparkles, Send, Bot, Brain, TrendingUp, BarChart3, MessageSquare } from 'lucide-react';

const suggestions = [
  { icon: Brain, label: 'Analyze Structure', prompt: 'Analyze the current market structure with ICT concepts' },
  { icon: TrendingUp, label: 'Market Summary', prompt: 'Give me a concise market summary for this session' },
  { icon: BarChart3, label: 'Review Setup', prompt: 'Review my current trading setup and suggest improvements' },
  { icon: MessageSquare, label: 'Explain Context', prompt: 'Explain the broader market context and key levels' },
];

export function AIPanel() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: `Analyzing: "${input}". I can see the market structure shows...` }]);
    }, 1000);
    setInput('');
  };

  const handleSuggestion = (prompt: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: prompt }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: `Here's my analysis based on current market data...` }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      <div className="flex items-center gap-1 mb-2">
        <Bot className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-[100px] max-h-[300px]">
        {messages.length === 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground mb-2">Ask me anything about the market:</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s.prompt)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left"
              >
                <s.icon className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[11px]">{s.label}</span>
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'ai' && <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
            <div className={`px-2 py-1.5 rounded-lg text-xs max-w-[85%] ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI..."
          className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50"
        />
        <Button size="sm" className="h-7 px-2" onClick={handleSend}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
