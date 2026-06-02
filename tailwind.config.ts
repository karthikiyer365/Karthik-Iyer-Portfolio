import type { Config } from "tailwindcss";

/**
 * Design tokens live in app/globals.css (:root CSS variables). This file maps
 * them to Tailwind classes so components stay token-first:
 *   surfaces -> bg-bg, bg-surface-1/2/3, bg-surface-raised, bg-titlebar
 *   borders  -> border-line, border-line-subtle, border-line-strong
 *   text     -> text-ink, text-ink-body/secondary/muted/faint
 *   state    -> bg-selection
 *   accents  -> text-/bg-/border- accent-pink | accent-teal | accent-blue
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          raised: "var(--surface-raised)",
        },
        titlebar: "var(--titlebar)",
        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          body: "var(--text-body)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        selection: "var(--selection)",
        accent: {
          pink: "var(--accent-pink)",
          teal: "var(--accent-teal)",
          blue: "var(--accent-blue)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      // Semantic type scale (Cursor-like). Defaults remain available.
      fontSize: {
        title: ["15px", { lineHeight: "1.3" }],
        body: ["13px", { lineHeight: "1.5" }],
        desc: ["12px", { lineHeight: "1.5" }],
        meta: ["11px", { lineHeight: "1.4" }],
        code: ["12px", { lineHeight: "1.5" }],
      },
    },
  },
  plugins: [],
};

export default config;
