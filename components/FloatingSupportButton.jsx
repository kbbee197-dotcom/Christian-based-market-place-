"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

// Hide on pages that already have a chat interface, so it's not
// floating on top of itself.
const HIDDEN_ON = ["/support/chat", "/admin/assistant"];

export default function FloatingSupportButton() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  // The feed's top bar is the one clear spot on that page (everything else
  // is claimed by action icons, the product bar, and the bottom nav). Every
  // other page has a header up top instead, so a bottom-right FAB is the
  // safer default there.
  const isFeed = pathname === "/feed";

  return (
    <a
      href="/support/chat"
      aria-label="Chat with AI support"
      className={`fixed z-40 bg-wick/90 text-ink rounded-full p-2.5 shadow-lg ${
        isFeed ? "top-20 right-3" : "right-4"
      }`}
      style={!isFeed ? { bottom: "calc(env(safe-area-inset-bottom) + 84px)" } : undefined}
    >
      <Sparkles className="w-4 h-4" />
    </a>
  );
}
