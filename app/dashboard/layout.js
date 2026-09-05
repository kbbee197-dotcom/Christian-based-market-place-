"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/store", label: "Store" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/upload", label: "Upload video" },
  { href: "/dashboard/videos", label: "Your videos" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();

      if (profile?.account_type !== "vendor") {
        router.replace("/feed");
        return;
      }

      setChecked(true);
    }
    check();
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Checking your account...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-parchment">
      <header className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Vendor dashboard</h1>
        <a href="/feed" className="font-body text-sm text-wick font-semibold">
          &larr; Feed
        </a>
      </header>

      <nav className="flex overflow-x-auto gap-2 px-5 py-3 border-b border-white/10">
        {TABS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={`font-body text-sm px-4 py-2 rounded-full whitespace-nowrap ${
              pathname === tab.href
                ? "bg-wick text-ink font-semibold"
                : "bg-white/5 text-slate"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <main className="px-5 py-6">{children}</main>
    </div>
  );
}
