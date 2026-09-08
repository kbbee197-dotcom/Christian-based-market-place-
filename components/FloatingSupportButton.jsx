"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

// The feed's top bar is the one clear spot on that page. Dashboard and
// settings pages don't reserve bottom padding for an overlay, so those
// get a real in-header icon instead (see DashboardLayout / SettingsLayout)
// rather than a floating button that can land on top of content.
const HIDDEN_PREFIXES = ["/support/chat", "/admin/assistant", "/dashboard", "/settings"];

export default function FloatingSupportButton() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

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
