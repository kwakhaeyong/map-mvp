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
        // #116: 슬래시 투명도 클래스 대체용 — design-tokens.css 주석 참고.
        "ink-wash": "var(--color-ink-wash)",
        "ink-wash-border": "var(--color-ink-wash-border)",
        "tag-fill": "var(--color-tag-fill)",
        "primary-overlay": "var(--color-primary-overlay)",
        "primary-foreground-soft": "var(--color-primary-foreground-soft)",
        "primary-foreground-wash": "var(--color-primary-foreground-wash)",
        "error-soft-border": "var(--color-error-soft-border)",
        "primary-border-soft": "var(--color-primary-border-soft)",
        "accent-bronze": "var(--color-accent-bronze)",
        "editorial-clay": "var(--color-editorial-clay)",
        "editorial-moss": "var(--color-editorial-moss)",
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
