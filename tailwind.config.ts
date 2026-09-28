import type { Config } from "tailwindcss";

/**
 * Design tokens live in app/globals.css (:root CSS variables). This file maps
 * them to Tailwind classes so components stay token-first:
 *   surfaces -> bg-bg, bg-surface-1/2/3, bg-surface-raised, bg-titlebar
 *   borders  -> border-line, border-line-subtle, border-line-strong
 *   text     -> text-ink, text-ink-body/secondary/muted/faint
 *   state    -> bg-selection
 *   accents  -> text-/border- accent-pink | accent-teal | accent-blue
 *   fills    -> bg-fill-teal | bg-fill-blue | bg-fill-green (bright backgrounds)
 *   syntax   -> text-syn-var/string/fn/control/comment/keyword/type/regex
 * Light is the default (:root); dark overrides live under :root[data-theme="dark"].
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Mobile shell (drawers) reverts to desktop 3-panel layout at this width.
      screens: {
        md: "900px",
      },
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
          green: "var(--accent-green)",
        },
        fill: {
          teal: "var(--fill-teal)",
          blue: "var(--fill-blue)",
          green: "var(--fill-green)",
        },
        hover: "var(--hover)",
        "tree-active": "var(--tree-active)",
        "chat-input": "var(--chat-input)",
        "chat-send": {
          DEFAULT: "var(--chat-send)",
          hover: "var(--chat-send-hover)",
        },
        danger: "var(--danger)",
        backdrop: "var(--backdrop)",
        syn: {
          var: "var(--syn-var)",
          string: "var(--syn-string)",
          fn: "var(--syn-fn)",
          control: "var(--syn-control)",
          comment: "var(--syn-comment)",
          keyword: "var(--syn-keyword)",
          type: "var(--syn-type)",
          regex: "var(--syn-regex)",
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
