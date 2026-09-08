"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

// Hide on pages that already have a chat interface, so it's not
// floating on top of itself.
const HIDDEN_ON = ["/support/chat", "/admin/assistant"];

export default function FloatingSupportButton() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <a
      href="/support/chat"
      aria-label="Chat with AI support"
      className="fixed z-40 bottom-24 right-4 bg-wick text-ink rounded-full p-3.5 shadow-lg"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      <Sparkles className="w-5 h-5" />
    </a>
  );
}
