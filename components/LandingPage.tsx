"use client";

import type { ReactNode } from "react";
import { FolderOpen, GitBranchPlus, MessageSquare } from "lucide-react";
import { useContent, useSettings } from "@/app/providers";
import { SETTINGS_PATH } from "@/lib/settings";
import type { FileNode } from "@/types/editor";

type LandingPageProps = {
  onNavigate?: (filePath: string) => void;
};

type ActionButtonProps = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

function ActionButton({ icon, label, disabled, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={[
        "group inline-flex items-center gap-3.5 rounded-md border border-accent-pink",
        "bg-transparent px-4 py-1.5 text-body font-mono font-medium text-ink",
        "transition-colors duration-150",
        "hover:bg-accent-pink/30 hover:text-accent-pink hover:border-accent-pink",
        "active:bg-accent-pink/40 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink",
      ].join(" ")}
    >
      <span className="text-ink transition-colors group-hover:text-accent-pink">
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
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

function collectFiles(nodes: FileNode[]): string[] {
  const files: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") files.push(node.path);
    if (node.children) files.push(...collectFiles(node.children));
  }
  return files;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { fileTree } = useContent();
  const { setActiveSubsection } = useSettings();
  const allFiles = collectFiles(fileTree);
  const firstFile = allFiles[0];

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
              onClick={() => {
                const mobile =
                  typeof window !== "undefined" &&
                  window.matchMedia("(max-width: 767px)").matches;
                onNavigate?.(
                  mobile ? "portfolio/Resume.md" : "portfolio/Summary.ipynb"
                );
              }}
            />
            <ActionButton
              icon={
                <GitBranchPlus className="h-4 w-4" aria-hidden="true" />
              }
              label="Clone Skills"
              disabled={!firstFile}
              onClick={() => {
                setActiveSubsection("skills");
                onNavigate?.(SETTINGS_PATH);
              }}
            />
            <ActionButton
              icon={
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              }
              label="Connect"
              onClick={() => {
                setActiveSubsection("contact");
                onNavigate?.(SETTINGS_PATH);
              }}
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
