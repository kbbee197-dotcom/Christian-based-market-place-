"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ConversationPage({ params }) {
  const router = useRouter();
  const conversationId = params.id;
  const [userId, setUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [otherId, setOtherId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }
      setUserId(uid);

      const { data: convo } = await supabase
        .from("conversations")
        .select(
          `
          id, shopper_id, vendor_id,
          shopper:profiles!conversations_shopper_id_fkey(id, username, display_name, avatar_url),
          vendor:profiles!conversations_vendor_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .eq("id", conversationId)
        .single();

      if (!convo) {
        setLoading(false);
        return;
      }

      const isShopper = convo.shopper_id === uid;
      setOtherUser(isShopper ? convo.vendor : convo.shopper);
      setOtherId(isShopper ? convo.vendor_id : convo.shopper_id);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", uid)
        .eq("read", false);
    }
    load();
  }, [conversationId, router]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !userId) return;
    setInput("");

    const { data: sent, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        body,
      })
      .select()
      .single();

    if (error) return;

    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));

    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);

    if (otherId) {
      await supabase.from("notifications").insert({
        recipient_id: otherId,
        actor_id: userId,
        type: "message",
        conversation_id: conversationId,
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <a href="/messages" aria-label="Back to messages">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">
          {otherUser?.display_name || otherUser?.username || "Conversation"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-4 py-3 rounded-2xl font-body text-sm whitespace-pre-wrap ${
              m.sender_id === userId ? "ml-auto bg-wick text-ink" : "mr-auto bg-white/5 text-parchment"
            }`}
          >
            {m.body}
          </div>
        ))}
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
          placeholder="Message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 font-body text-sm"
        />
        <button
          disabled={!input.trim()}
          className="bg-wick text-ink p-3 rounded-full disabled:opacity-40 shrink-0"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
}
