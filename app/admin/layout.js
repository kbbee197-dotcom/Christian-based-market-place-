"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TABS = [
  { href: "/admin", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
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
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-parchment">
      <header className="border-b border-white/10 px-5 py-4">
        <h1 className="font-display text-lg font-semibold">Admin</h1>
      </header>

      <nav className="flex gap-2 px-5 py-3 border-b border-white/10">
        {TABS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={`font-body text-sm px-4 py-2 rounded-full ${
              pathname === tab.href ? "bg-wick text-ink font-semibold" : "bg-white/5 text-slate"
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
