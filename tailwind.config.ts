import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        muted: "#5f6b76",
        line: "#d9e0e7",
        panel: "#f7f9fb",
        accent: "#007a6c",
        warn: "#d97706",
        danger: "#c2410c"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(20, 28, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
