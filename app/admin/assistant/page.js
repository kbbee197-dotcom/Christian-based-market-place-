"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I can see the current pending vendor applications and flagged posts, comments, and products. Ask me things like \"summarize the pending applications\" or \"is anything in the flagged comments concerning?\" I'll give you my read — the final call is always yours.",
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

      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      }
    } catch (err) {
      setError("Couldn't reach the assistant: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-md flex flex-col h-[75dvh]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] px-4 py-3 rounded-2xl font-body text-sm whitespace-pre-wrap ${
              m.role === "user" ? "ml-auto bg-wick text-ink" : "mr-auto bg-white/5 text-parchment"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-white/5 text-slate px-4 py-3 rounded-2xl font-body text-sm">
            Reviewing the queue...
          </div>
        )}
        {error && <p className="font-body text-sm text-clay">{error}</p>}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pending or flagged items..."
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
    </div>
  );
}
