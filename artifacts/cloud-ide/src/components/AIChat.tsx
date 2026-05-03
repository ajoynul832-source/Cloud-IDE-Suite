import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, X, Loader2, Copy, Check, Sparkles, WrapText } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface AIChatProps {
  onClose: () => void;
  currentFile?: string;
  currentCode?: string;
  currentContent?: string;
  onInsertCode?: (code: string) => void;
}

function CodeBlock({ code, onInsert }: { code: string; onInsert?: (c: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="relative mt-1 mb-1 group">
      <pre className="bg-[#0d1117] border border-white/10 rounded p-2 text-[10px] text-white/75 overflow-x-auto whitespace-pre-wrap break-words">
        {code}
      </pre>
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        {onInsert && (
          <button
            onClick={() => onInsert(code)}
            title="Insert into editor"
            className="p-1 rounded bg-[#4ade80]/15 hover:bg-[#4ade80]/30 text-[#4ade80]/70 hover:text-[#4ade80]"
          >
            <WrapText size={9} />
          </button>
        )}
        <button
          onClick={copy}
          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/50"
        >
          {copied ? <Check size={9} className="text-[#4ade80]" /> : <Copy size={9} />}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onInsert }: { msg: Message; onInsert?: (c: string) => void }) {
  const isUser = msg.role === "user";

  const parts = msg.content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} mb-3`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUser ? "bg-white/10" : "bg-[#4ade80]/20"}`}>
        {isUser
          ? <span className="text-[8px] text-white/50">U</span>
          : <Bot size={10} className="text-[#4ade80]" />
        }
      </div>
      <div className={`max-w-[85%] rounded-lg px-2.5 py-2 text-[11px] leading-relaxed ${
        isUser ? "bg-white/8 text-white/70" : "bg-[#4ade80]/5 border border-[#4ade80]/15 text-white/75"
      }`}>
        {parts.map((part, i) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const code = part.slice(part.indexOf("\n") + 1, -3);
            return <CodeBlock key={i} code={code} onInsert={onInsert} />;
          }
          return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
        })}
      </div>
    </div>
  );
}

const SYSTEM_PROMPT = `You are an expert coding assistant embedded in CloudIDE, a browser-based code editor. 
You help users write, debug, and improve code. Be concise and practical. 
When providing code, use code blocks. 
Focus on: JavaScript, TypeScript, Python, HTML, CSS, and general programming concepts.`;

export function AIChat({ onClose, currentFile, currentCode, currentContent, onInsertCode }: AIChatProps) {
  const effectiveCode = currentCode ?? currentContent ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const contextInfo = effectiveCode
      ? `\n\nContext: ${currentFile ? `User is editing "${currentFile}".` : "User has code open."}\nCurrent code:\n\`\`\`\n${effectiveCode.slice(0, 2000)}\n\`\`\``
      : "";

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT + contextInfo },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { reply?: string; error?: string };
      if (data.error) throw new Error(data.error);

      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply ?? "Sorry, I couldn't generate a response.",
        id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to connect to AI service"}`,
          id: (Date.now() + 1).toString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, currentFile, effectiveCode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const SUGGESTIONS = [
    "Explain this code",
    "Find bugs in my code",
    "Optimize for performance",
    "Add error handling",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white/70 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[#4ade80]" />
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
          <X size={12} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center mx-auto">
              <Bot size={18} className="text-[#4ade80]" />
            </div>
            <div>
              <p className="text-white/50 text-[11px] font-semibold">Ask me anything about your code</p>
              <p className="text-white/25 text-[10px] mt-1">I can explain, debug, and improve code</p>
            </div>
            <div className="space-y-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="w-full text-left px-2.5 py-1.5 rounded border border-white/8 text-[10px] text-white/40 hover:border-[#4ade80]/30 hover:text-white/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onInsert={onInsertCode} />)}
        {loading && (
          <div className="flex gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-[#4ade80]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={10} className="text-[#4ade80]" />
            </div>
            <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-lg px-2.5 py-2">
              <Loader2 size={12} className="animate-spin text-[#4ade80]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-2 py-2 border-t border-white/8 shrink-0">
        <div className="flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code… (Enter to send)"
            rows={2}
            className="flex-1 bg-[#1c2128] border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white/80 placeholder-white/25 focus:outline-none focus:border-[#4ade80]/40 resize-none leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-7 h-7 flex items-center justify-center rounded bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
        <p className="text-[9px] text-white/15 mt-1 text-center">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}
