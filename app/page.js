import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center px-6 pb-16">
      <section className="flex flex-col items-center justify-center text-center pt-24 pb-16">
        <p className="font-mono text-xs tracking-[0.2em] text-wick uppercase mb-4">
          Make. Share. Sell.
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight max-w-2xl">
          AB<span className="text-wick">(SOUL)</span>UTE
        </h1>
        <p className="font-mono text-sm md:text-base tracking-[0.15em] text-slate uppercase mt-3">
          Where Purpose Meets Marketplace
        </p>
        <p className="font-body text-slate mt-6 max-w-md">
          Discover Christian creators, businesses and products through the
          stories and people behind them.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/feed"
            className="inline-block bg-wick text-ink font-semibold px-8 py-3 rounded-full shadow-wick hover:brightness-110 transition"
          >
            Explore Marketplace
          </Link>
          <Link
            href="/apply-to-sell"
            className="inline-block border border-wick text-wick font-semibold px-8 py-3 rounded-full hover:bg-wick hover:text-ink transition"
          >
            Start Selling
          </Link>
        </div>
      </section>

      <section className="w-full max-w-2xl text-center py-12 border-t border-white/10">
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
          Watch. Discover. Shop.
        </h2>
        <p className="font-body text-slate max-w-lg mx-auto">
          Discover the people behind the products. Watch their stories.
          Follow businesses you love. Shop directly from their content.
        </p>
      </section>

      <section className="w-full max-w-4xl py-12 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-display text-lg font-semibold mb-1">Shop</p>
            <p className="font-body text-sm text-slate">
              Products from Christian businesses and creators
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold mb-1">Creators</p>
            <p className="font-body text-sm text-slate">
              Discover and follow Christian creators
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold mb-1">Services</p>
            <p className="font-body text-sm text-slate">
              Connect with Christian professionals and businesses
            </p>
            <p className="font-mono text-[11px] text-wick uppercase tracking-wide mt-1">
              Coming Soon
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold mb-1">Events</p>
            <p className="font-body text-sm text-slate">
              Discover Christian events and experiences
            </p>
            <p className="font-mono text-[11px] text-wick uppercase tracking-wide mt-1">
              Coming Soon
            </p>
          </div>
        </div>
      </section>

      <p className="font-body text-xs text-slate/60 mt-4">
        A marketplace lit by community, not algorithms.
      </p>
    </main>
  );
}
