"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ConversationPage({ params }) {
  const router = useRouter();
  const conversationId = params.id;
  const [userId, setUserId] = useState(null);
  const [kind, setKind] = useState(null); // "vendor" or "admin"
  const [otherUser, setOtherUser] = useState(null);
  const [otherId, setOtherId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const scrollRef = useRef(null);

  const conversationsTable = kind === "admin" ? "admin_conversations" : "conversations";
  const messagesTable = kind === "admin" ? "admin_messages" : "messages";

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }
      setUserId(uid);

      const { data: vendorConvo } = await supabase
        .from("conversations")
        .select(
          `
          id, shopper_id, vendor_id,
          shopper:profiles!conversations_shopper_id_fkey(id, username, display_name, avatar_url),
          vendor:profiles!conversations_vendor_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .eq("id", conversationId)
        .maybeSingle();

      let resolvedKind = null;
      let resolvedOther = null;
      let resolvedOtherId = null;

      if (vendorConvo) {
        resolvedKind = "vendor";
        const isShopper = vendorConvo.shopper_id === uid;
        resolvedOther = isShopper ? vendorConvo.vendor : vendorConvo.shopper;
        resolvedOtherId = isShopper ? vendorConvo.vendor_id : vendorConvo.shopper_id;
      } else {
        const { data: adminConvo } = await supabase
          .from("admin_conversations")
          .select(
            `
            id, admin_id, user_id,
            admin:profiles!admin_conversations_admin_id_fkey(id, username, display_name, avatar_url),
            user:profiles!admin_conversations_user_id_fkey(id, username, display_name, avatar_url)
          `
          )
          .eq("id", conversationId)
          .maybeSingle();

        if (adminConvo) {
          resolvedKind = "admin";
          const isAdmin = adminConvo.admin_id === uid;
          resolvedOther = isAdmin ? adminConvo.user : adminConvo.admin;
          resolvedOtherId = isAdmin ? adminConvo.user_id : adminConvo.admin_id;
        }
      }

      if (!resolvedKind) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setKind(resolvedKind);
      setOtherUser(resolvedOther);
      setOtherId(resolvedOtherId);

      const table = resolvedKind === "admin" ? "admin_messages" : "messages";
      const { data: msgs } = await supabase
        .from(table)
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      await supabase
        .from(table)
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", uid)
        .eq("read", false);
    }
    load();
  }, [conversationId, router]);

  useEffect(() => {
    if (!kind) return;
    const channel = supabase
      .channel(`${messagesTable}-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: messagesTable, filter: `conversation_id=eq.${conversationId}` },
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
  }, [conversationId, kind, messagesTable]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !userId || !kind) return;
    setInput("");

    const { data: sent, error } = await supabase
      .from(messagesTable)
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        body,
      })
      .select()
      .single();

    if (error) return;

    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));

    await supabase
      .from(conversationsTable)
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (otherId) {
      const notifPayload = {
        recipient_id: otherId,
        actor_id: userId,
        type: "message",
      };
      if (kind === "admin") {
        notifPayload.admin_conversation_id = conversationId;
      } else {
        notifPayload.conversation_id = conversationId;
      }
      await supabase.from("notifications").insert(notifPayload);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body px-6 text-center">
        Conversation not found.
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
          {kind === "admin" && (
            <span className="ml-2 font-mono text-[10px] text-wick uppercase align-middle">Admin</span>
          )}
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
