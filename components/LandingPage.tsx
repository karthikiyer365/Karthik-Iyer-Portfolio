"use client";

import type { ReactNode } from "react";
import { FolderOpen, PenLine, LayoutDashboard } from "lucide-react";

type LandingPageProps = {
  onNavigate?: (filePath: string) => void;
};

type ActionButtonProps = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  /** External destination. Renders an anchor instead of a button. */
  href?: string;
};

function ActionButton({ icon, label, disabled, onClick, href }: ActionButtonProps) {
  const className = [
        "group inline-flex items-center gap-3.5 rounded-md border border-accent-pink",
        "bg-transparent px-4 py-1.5 text-body font-mono font-medium text-ink",
        "transition-colors duration-150",
        "hover:bg-accent-pink/30 hover:text-accent-pink hover:border-accent-pink",
        "active:bg-accent-pink/40 cursor-pointer",
    "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink",
  ].join(" ");

  const inner = (
    <>
      <span className="text-ink transition-colors group-hover:text-accent-pink">
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {inner}
    </button>
  );
}

const RECENT_EXPERIENCE: { title: string; path: string; file: string }[] = [
  {
    title: "Data Systems Engineer",
    path: "~/restorefast/ai-dev",
    file: "portfolio/experiences/AI & Data Engineer - RestoreFast.ipynb",
  },
  {
    title: "Technical Systems Assistant",
    path: "~/gwu/it",
    file: "portfolio/experiences/Technical Systems Admin - GWU.ipynb",
  },
  {
    title: "M.Sc Data Analytics",
    path: "~/gwu/seas/data-analytics",
    file: "portfolio/education/MSc Data Analytics - GWU.ipynb",
  },
  {
    title: "Data Analyst",
    path: "~/dpsy/financial-data-analysis",
    file: "portfolio/experiences/Financial Analyst - DPSY & Associates.ipynb",
  },
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <div className="w-full max-w-[820px] px-6">
        <div className="flex flex-col items-center text-center">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 w-full max-w-[500px]">
            <img
              src="/img.png"
              alt="Karthik Iyer"
              className="w-12 h-17 object-cover"
            />
            <div className="text-[28px] font-semibold tracking-[.13em] text-ink">
              KARTHIK IYER
            </div>
          </div>

          <div className="text-sm text-[#4ec9b0] pl-12 font-mono text-left w-full max-w-[475px]">
            Developer &bull; Engineer &bull; Data
          </div>

          {/* Action buttons */}
          <div className="mt-8 w-full max-w-[500px] flex flex-wrap justify-between gap-3">
            <ActionButton
              icon={
                <FolderOpen className="h-4 w-4 ml-1" aria-hidden="true" />
              }
              label="Open Portfolio"
              onClick={() => onNavigate?.("portfolio/Resume.md")}
            />
            <ActionButton
              icon={
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              }
              label="Open Live Dashboards"
              href="https://karthikiyer365.github.io/Live/#tickets"
            />
            <ActionButton
              icon={<PenLine className="h-4 w-4" aria-hidden="true" />}
              label="Open Tech Blog"
              href="https://writing.karthikiyer.info"
            />
          </div>

          {/* Recent experience */}
          <div className="mt-10 w-full max-w-[500px] text-left">
            <div className="text-xs font-mono tracking-widest text-[#444444]">
              RECENT EXPERIENCE
            </div>
            <ul className="mt-3 space-y-1 text-[13px] text-[#a3a3a3]">
              {RECENT_EXPERIENCE.map((exp) => (
                <li key={exp.file} className="flex gap-2 justify-between">
                  <button
                    type="button"
                    onClick={() => onNavigate?.(exp.file)}
                    className="text-white font-mono font-semibold text-left hover:text-accent-teal transition-colors cursor-pointer"
                  >
                    {exp.title}
                  </button>
                  <span className="text-[#444444] font-mono text-right">
                    {exp.path}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
