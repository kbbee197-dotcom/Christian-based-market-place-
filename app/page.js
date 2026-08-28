import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-wick uppercase mb-4">
        Make. Share. Sell.
      </p>
      <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight max-w-2xl">
        A marketplace lit by community, not algorithms.
      </h1>
      <p className="font-body text-slate mt-6 max-w-md">
        Discover handmade goods, small businesses, and faith-rooted creators —
        one video at a time.
      </p>
      <Link
        href="/feed"
        className="mt-10 inline-block bg-wick text-ink font-semibold px-8 py-3 rounded-full shadow-wick hover:brightness-110 transition"
      >
        Enter the feed
      </Link>
    </main>
  );
}
