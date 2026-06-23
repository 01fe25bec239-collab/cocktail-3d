import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "theme-bg": "var(--bg-primary)",
        "theme-bg-secondary": "var(--bg-secondary)",
        "theme-accent": "var(--accent)",
        "theme-text": "var(--text-color)",
        "theme-text-secondary": "var(--text-secondary)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
