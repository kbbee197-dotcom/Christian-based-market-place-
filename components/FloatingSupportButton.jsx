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
      className="fixed z-40 top-20 right-3 bg-wick/90 text-ink rounded-full p-2.5 shadow-lg"
    >
      <Sparkles className="w-4 h-4" />
    </a>
  );
}
