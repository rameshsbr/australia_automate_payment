import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0f1623",
        panel: "#172135",
        outline: "#22304d",
        text: "#e6edf6",
        subt: "#a9b4c7",
        accent: "#6c8cff",
        success: "#34d399"
      },
      boxShadow: {
        soft: "0 6px 24px rgba(0,0,0,.25)"
      },
      borderRadius: { xl2: "1rem" }
    }
  },
  darkMode: "class",
  plugins: []
} satisfies Config;
