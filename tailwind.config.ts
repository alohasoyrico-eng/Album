import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — swap with [data-theme="dawn"] via globals.css.
        // Using rgb(var(--x) / <alpha-value>) so Tailwind utilities like
        // text-ink/80 still work with opacity.
        void: "rgb(var(--album-bg-rgb) / <alpha-value>)",
        deep: "#0D0D14",
        surface: "#141420",
        raised: "#1C1C2D",
        border: "rgba(255,255,255,0.06)",
        "border-strong": "rgba(255,255,255,0.12)",
        ink:         "rgb(var(--album-ink-actual-rgb) / <alpha-value>)",
        "ink-muted": "rgb(var(--album-ink-muted-rgb) / <alpha-value>)",
        "ink-faint": "rgb(var(--album-ink-faint-rgb) / <alpha-value>)",
        amber:        "rgb(var(--album-amber-rgb) / <alpha-value>)",
        "amber-bright": "#E8A86A",
        resonance: {
          wellbeing: "#D4A054",
          suffering: "#4A6FA5",
          love: "#B5607A",
          hostility: "#C04040",
          fear: "#7A4A9A",
          wonder: "#4A9AA0",
          shame: "#8A6A78",
          desire: "#A87040",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
        "128": "32rem",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      backgroundImage: {
        "radial-void": "radial-gradient(ellipse at center, #0D0D14 0%, #050508 70%)",
        "radial-deep": "radial-gradient(ellipse at 30% 40%, #141428 0%, #050508 60%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "contemplative": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "emergence": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
