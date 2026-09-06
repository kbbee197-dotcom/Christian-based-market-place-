import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const FAQS = [
  {
    q: "How do I become a vendor?",
    a: "Go to Settings and tap \"Apply to sell.\" An admin will review your application, and you'll be notified once approved.",
  },
  {
    q: "How do I message a seller?",
    a: "Comment on their post or follow them to stay updated. Direct messaging isn't available yet.",
  },
  {
    q: "How do payouts work?",
    a: "Vendors connect a Stripe account from their dashboard. Once connected, buyer payments are routed directly to that account.",
  },
  {
    q: "How do I delete a video I posted?",
    a: "Go to your vendor dashboard, tap \"Your videos,\" and use the trash icon next to the video you want to remove.",
  },
  {
    q: "Can I control who sees my videos?",
    a: "Yes. From \"Your videos\" in your dashboard, tap the visibility badge on any post to cycle between Public, Followers, and Private.",
  },
  {
    q: "How do I report a problem with an order?",
    a: "Go to Orders from the top bar. If something's wrong, reach out to the seller directly through a comment on their post.",
  },
];

export default function HelpCenterPage() {
  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Help Center</h1>
      </div>

      <div className="space-y-4">
        {FAQS.map((item, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-5">
            <p className="font-body font-semibold text-sm mb-2">{item.q}</p>
            <p className="font-body text-sm text-slate">{item.a}</p>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
