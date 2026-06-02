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
        "transition",
        "hover:bg-accent-pink/30 active:bg-accent-pink/40 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-30",
      ].join(" ")}
    >
      <span className="text-ink">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

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
              className="h-5 w-5 rounded-[4px] bg-ink"
            />
            <div className="text-[28px] font-semibold tracking-[0.22em] text-ink">
              KARTHIK S IYER
            </div>
          </div>

          <div className="text-body text-accent-teal font-mono text-left mt-2 w-full max-w-[500px]">
            Developer &bull; Engineer &bull; Data
          </div>

          {/* Action buttons */}
          <div className="mt-8 w-full max-w-[500px] flex flex-wrap justify-between gap-3">
            <ActionButton
              icon={
                <FolderOpen className="h-4 w-4 ml-1" aria-hidden="true" />
              }
              label="Open Portfolio"
              onClick={() => onNavigate?.("portfolio/resume.md")}
            />
            <ActionButton
              icon={
                <GitBranchPlus className="h-4 w-4" aria-hidden="true" />
              }
              label="Clone Skills"
              disabled={!firstFile}
              onClick={() => firstFile && onNavigate?.(firstFile)}
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
            <div className="text-meta font-mono tracking-widest text-ink-faint">
              RECENT EXPERIENCE
            </div>
            <ul className="mt-3 space-y-1 text-body text-ink-secondary">
              <li className="flex gap-2 justify-between">
                <span className="text-ink font-mono font-semibold text-left">
                  Data Systems Engineer
                </span>
                <span className="text-ink-faint font-mono text-right">
                  ~/restorefast/ai-dev
                </span>
              </li>
              <li className="flex gap-2 justify-between">
                <span className="text-ink font-mono font-semibold text-left">
                  Technical Systems Assistant
                </span>
                <span className="text-ink-faint font-mono text-right">
                  ~/gwu/it
                </span>
              </li>
              <li className="flex gap-2 justify-between">
                <span className="text-ink font-mono font-semibold text-left">
                  M.Sc Data Analytics
                </span>
                <span className="text-ink-faint font-mono text-right">
                  ~/gwu/seas/data-analytics
                </span>
              </li>
              <li className="flex gap-2 justify-between">
              <span className="text-white font-mono font-semibold text-left">
                  Data Analyst
                </span>
                <span className="text-ink-faint font-mono text-right">
                  ~/dpsy/financial-data-analysis
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
