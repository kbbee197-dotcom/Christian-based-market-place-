"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SupportChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help with questions about orders, selling, or how the app works. What's going on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      }
    } catch (err) {
      setError("Couldn't reach support right now: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <a href="/settings/account/help" aria-label="Back to help center">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Chat with support</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-3 rounded-2xl font-body text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-wick text-ink"
                : "mr-auto bg-white/5 text-parchment"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-white/5 text-slate px-4 py-3 rounded-2xl font-body text-sm">
            Thinking...
          </div>
        )}
        {error && <p className="font-body text-sm text-clay">{error}</p>}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-5 py-4 border-t border-white/10 shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 font-body text-sm"
        />
        <button
          disabled={sending || !input.trim()}
          className="bg-wick text-ink p-3 rounded-full disabled:opacity-40 shrink-0"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
}
