import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "var(--color-navy)",
          600: "var(--color-navy-600)",
        },
        amber: {
          DEFAULT: "var(--color-amber)",
        },
        surface: "var(--color-surface)",
        bg: "var(--color-bg)",
        ink: "var(--color-text)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        card: "var(--radius)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans Devanagari",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        deva: ["Noto Sans Devanagari", "Inter", "system-ui", "sans-serif"],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
} satisfies Config;
