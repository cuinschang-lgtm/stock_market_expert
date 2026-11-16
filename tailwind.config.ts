import type { Config } from "tailwindcss";

/**
 * 暗色投研终端 · hallmark console (graphite) 骨架 + 品牌 teal 色相
 * 层级：paper(页面底) < panel(卡片) < hover；sunken(凹陷) 比 paper 深
 * 纪律：暗色无阴影（亮度分层 + hairline）；涨红跌绿为 A 股习惯语义色
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#14181d",
        panel: "#1b222b",
        sunken: "#0f1319",
        hover: "#232c36",
        ink: "#e8edf3",
        ink2: "#b6c2cd",
        muted: "#93a1b0",
        line: "#323d49",
        field: "#5c6b78",
        accent: "#2db5a3",
        "accent-hover": "#3ac4b2",
        "accent-ink": "#0d1517",
        "accent-soft": "#14332e",
        warn: "#e0a34e",
        "warn-soft": "#3b2c10",
        danger: "#e2685f",
        "danger-soft": "#3f201c",
        ok: "#46c08a",
        "ok-soft": "#143024"
      },
      boxShadow: {
        soft: "none"
      }
    }
  },
  plugins: []
};

export default config;
