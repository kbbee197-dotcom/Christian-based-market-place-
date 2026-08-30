"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, PlusCircle, ShoppingCart, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    async function checkVendor() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      setIsVendor(profile?.account_type === "vendor");
    }
    checkVendor();
  }, []);

  function handleCreate() {
    router.push(isVendor ? "/dashboard/upload" : "/apply-to-sell");
  }

  const tabs = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/following", icon: Users, label: "Following" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-ink/95 backdrop-blur-md border-t border-white/10 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  active
                    ? "bg-wick shadow-[0_4px_0_0_rgba(180,120,40,0.6),0_6px_12px_rgba(232,163,61,0.35)] -translate-y-0.5"
                    : "bg-white/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-ink" : "text-slate"}`}
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 1.5 : 2}
                />
              </div>
              <span className={`font-body text-[10px] ${active ? "text-wick font-semibold" : "text-slate"}`}>
                {tab.label}
              </span>
            </a>
          );
        })}

        <button onClick={handleCreate} className="flex flex-col items-center gap-1 px-3 py-1 -mt-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-b from-wick to-clay flex items-center justify-center shadow-[0_5px_0_0_rgba(150,95,25,0.7),0_8px_16px_rgba(232,163,61,0.4)] border-2 border-ink">
            <PlusCircle className="w-7 h-7 text-ink" strokeWidth={2} />
          </div>
        </button>

        <a href="/cart" className="flex flex-col items-center gap-1 px-3 py-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              pathname === "/cart"
                ? "bg-wick shadow-[0_4px_0_0_rgba(180,120,40,0.6),0_6px_12px_rgba(232,163,61,0.35)] -translate-y-0.5"
                : "bg-white/5"
            }`}
          >
            <ShoppingCart
              className={`w-5 h-5 ${pathname === "/cart" ? "text-ink" : "text-slate"}`}
              fill={pathname === "/cart" ? "currentColor" : "none"}
              strokeWidth={pathname === "/cart" ? 1.5 : 2}
            />
          </div>
          <span className={`font-body text-[10px] ${pathname === "/cart" ? "text-wick font-semibold" : "text-slate"}`}>
            Cart
          </span>
        </a>

        <a href="/settings" className="flex flex-col items-center gap-1 px-3 py-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              pathname === "/settings"
                ? "bg-wick shadow-[0_4px_0_0_rgba(180,120,40,0.6),0_6px_12px_rgba(232,163,61,0.35)] -translate-y-0.5"
                : "bg-white/5"
            }`}
          >
            <User
              className={`w-5 h-5 ${pathname === "/settings" ? "text-ink" : "text-slate"}`}
              fill={pathname === "/settings" ? "currentColor" : "none"}
              strokeWidth={pathname === "/settings" ? 1.5 : 2}
            />
          </div>
          <span className={`font-body text-[10px] ${pathname === "/settings" ? "text-wick font-semibold" : "text-slate"}`}>
            Profile
          </span>
        </a>
      </div>
    </nav>
  );
}
