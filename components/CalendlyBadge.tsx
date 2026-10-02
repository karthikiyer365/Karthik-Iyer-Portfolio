"use client";

import Script from "next/script";

declare global {
  interface Window {
    Calendly?: {
      initBadgeWidget: (options: {
        url: string;
        text: string;
        color: string;
        textColor: string;
        branding: boolean;
      }) => void;
    };
  }
}

export default function CalendlyBadge() {
  return (
    <Script
      src="https://assets.calendly.com/assets/external/widget.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.Calendly?.initBadgeWidget({
          url: "https://calendly.com/karthikiyer365/30min",
          text: "IceBreaker",
          color: "#dd0077",
          textColor: "#ffffff",
          branding: true,
        });
      }}
    />
  );
}
