import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        "background-subtle": "var(--color-background-subtle)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-foreground": "var(--color-primary-foreground)",
        focus: "var(--color-focus)",
        fact: "var(--color-fact)",
        feeling: "var(--color-feeling)",
        value: "var(--color-value)",
        option: "var(--color-option)",
        uncertainty: "var(--color-uncertainty)",
        risk: "var(--color-risk)",
        action: "var(--color-action)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        // 이상형 퀴즈 실루엣(IdealTypeVisualParts.tsx) 전용 — 실루엣을
        // 통째로 뺄 때 design-tokens.css의 --color-hair-* 5줄과 함께
        // 지우면 된다.
        "hair-black": "var(--color-hair-black)",
        "hair-darkbrown": "var(--color-hair-darkbrown)",
        "hair-lightbrown": "var(--color-hair-lightbrown)",
        "hair-blonde": "var(--color-hair-blonde)",
        "hair-dyed": "var(--color-hair-dyed)",
        "figure-skin": "var(--color-figure-skin)",
        "figure-garment": "var(--color-figure-garment)",
      },
      borderRadius: {
        small: "var(--radius-small)",
        medium: "var(--radius-medium)",
        large: "var(--radius-large)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        floating: "var(--shadow-floating)",
        modal: "var(--shadow-modal)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--easing-standard)",
        emphasized: "var(--easing-emphasized)",
      },
    },
  },
  plugins: [],
};

export default config;
