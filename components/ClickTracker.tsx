"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// One delegated listener: every button/link click -> GA4 `click_through`.
// Tag icon-only controls with data-track="name" for a readable label.
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(
        "a, button, [role=button], [data-track]"
      );
      if (!el) return;
      const href = el instanceof HTMLAnchorElement ? el.href : undefined;
      window.gtag?.("event", "click_through", {
        label:
          el.dataset.track ||
          el.getAttribute("aria-label") ||
          el.textContent?.trim().slice(0, 60) ||
          "(unlabeled)",
        element: el.tagName.toLowerCase(),
        href,
        dest_host: href ? new URL(href).hostname : undefined,
        page_path: location.pathname,
        page_host: location.hostname,
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
