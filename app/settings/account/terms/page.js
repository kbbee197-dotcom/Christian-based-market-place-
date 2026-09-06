import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Terms and Policies</h1>
      </div>

      <div className="space-y-6 font-body text-sm text-slate">
        <section>
          <h2 className="font-display text-base text-parchment font-semibold mb-2">
            Overview
          </h2>
          <p>
            This app is a marketplace connecting shoppers and independent
            sellers. By using it, you agree to treat other users respectfully
            and to follow all applicable laws when buying, selling, or
            posting content.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-parchment font-semibold mb-2">
            Accounts
          </h2>
          <p>
            You're responsible for keeping your account secure. Vendor
            accounts require admin approval before products and videos can
            be posted publicly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-parchment font-semibold mb-2">
            Content
          </h2>
          <p>
            You retain ownership of anything you post, but grant this
            platform permission to display it to other users. Content that
            violates community standards may be removed by an admin.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-parchment font-semibold mb-2">
            Payments
          </h2>
          <p>
            Payments between buyers and sellers are processed through
            Stripe. This platform does not directly hold or custody funds
            beyond what's required to facilitate a transaction.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-parchment font-semibold mb-2">
            Changes
          </h2>
          <p>
            These terms may be updated as the platform grows. Continued use
            of the app after changes means you accept the updated terms.
          </p>
        </section>

        <p className="text-xs text-slate/60 pt-2">
          This is a placeholder policy and has not been reviewed by a
          lawyer. Consider having formal terms drafted before wide public
          launch.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
