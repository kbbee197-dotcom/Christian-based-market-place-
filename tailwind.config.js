/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141C",
        wick: "#E8A33D",
        parchment: "#F7F0E3",
        moss: "#4C6B4F",
        clay: "#B5651D",
        slate: "#C9CDD6",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        wick: "0 0 40px rgba(232, 163, 61, 0.25)",
      },
    },
  },
  plugins: [],
};
