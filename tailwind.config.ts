import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#aab4c3",
          400: "#7a879b",
          500: "#5a6779",
          600: "#45505f",
          700: "#363f4c",
          800: "#252c36",
          900: "#141820",
        },
        mint: {
          400: "#4fd1a8",
          500: "#2fb88c",
          600: "#219a73",
        },
        amber: {
          400: "#f5b642",
          500: "#e79a1c",
        },
        coral: {
          400: "#ff8a7a",
          500: "#f06653",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
        urdu: ["var(--font-urdu)", "var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "avatar-speak": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        "avatar-think": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "sound-wave": {
          "0%, 100%": { transform: "scaleY(0.35)", opacity: "0.5" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
      animation: {
        "avatar-speak": "avatar-speak 1.2s ease-in-out infinite",
        "avatar-think": "avatar-think 2s ease-in-out infinite",
        "sound-wave": "sound-wave 0.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
