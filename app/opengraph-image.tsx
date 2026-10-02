import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Karthik Iyer – AI Engineer & Data Analyst";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors mirror the light tokens in app/globals.css (--bg, --text, --accent-teal).
export default function OpengraphImage() {
  const logo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/img.png"),
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: "#ffffff",
        }}
      >
        <img src={logo} width={176} height={200} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: "0.13em",
              color: "#1a1a1a",
            }}
          >
            KARTHIK IYER
          </div>
          <div style={{ fontSize: 40, fontFamily: "monospace", color: "#0b7c66" }}>
            AI Engineer • Data Analyst
          </div>
        </div>
      </div>
    ),
    size,
  );
}
