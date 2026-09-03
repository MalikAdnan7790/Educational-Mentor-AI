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
          50: "#f7f8fa",
          100: "#ebeef3",
          200: "#d4d9e2",
          300: "#a8b2c1",
          400: "#7b8a9d",
          500: "#566178",
          600: "#3f4a5e",
          700: "#2e3648",
          800: "#1e2433",
          900: "#0f1320",
        },
        mint: {
          300: "#7ae0a4",
          400: "#58cc02",
          500: "#46a302",
          600: "#368a00",
        },
        sky: {
          400: "#49cae0",
          500: "#1cb0f6",
          600: "#0f8bc0",
        },
        purple: {
          400: "#b07ef5",
          500: "#9b59f5",
          600: "#7c3aed",
        },
        orange: {
          400: "#ffab42",
          500: "#ff9600",
          600: "#e08600",
        },
        amber: {
          400: "#ffc800",
          500: "#f5a623",
          600: "#e09100",
        },
        coral: {
          400: "#ff7676",
          500: "#ff4b4b",
          600: "#e03e3e",
        },
        red: {
          400: "#ff7676",
          500: "#ff4b4b",
          600: "#e03e3e",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-nunito)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
        urdu: ["var(--font-nunito)", "sans-serif"],
      },
      borderRadius: {
        card: "1rem",
        button: "0.75rem",
        input: "0.75rem",
        badge: "9999px",
        pill: "9999px",
      },
      boxShadow: {
        btn: "0 4px 0 0 rgba(0,0,0,0.15)",
        "btn-hover": "0 2px 0 0 rgba(0,0,0,0.15)",
        card: "0 2px 8px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12)",
        elevated: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)",
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
