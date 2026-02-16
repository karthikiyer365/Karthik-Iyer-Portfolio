"use client";

import type { ReactNode } from "react";
import { FolderOpen, GitBranchPlus, MessageSquare } from "lucide-react";
import { useContent } from "@/app/providers";
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
        "group flex items-center gap-2 rounded-lg border border-[#2a2a2a]",
        "bg-[#dddddd] px-5 py-3 text-[13px] font-medium text-[#111111]",
        "shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] transition",
        "hover:bg-[#ffffff] active:bg-[#888888] cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-30",
      ].join(" ")}
    >
      <span className="text-[#111111]">{icon}</span>
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
              className="h-5 w-5 rounded-[4px] bg-[#e5e5e5]"
            />
            <div className="text-[28px] font-semibold tracking-[0.22em] text-[#e5e5e5]">
              KARTHIK
            </div>
          </div>

          <div className="text-sm text-[#a3a3a3] font-mono text-left mt-2 w-full max-w-[395px]">
            Developer &bull; Engineer
          </div>

          {/* Action buttons */}
          <div className="mt-8 w-full max-w-[500px] flex flex-wrap justify-between gap-1">
            <ActionButton
              icon={
                <FolderOpen className="h-4 w-4 ml-1" aria-hidden="true" />
              }
              label="Open portfolio"
              disabled={!firstFile}
              onClick={() => firstFile && onNavigate?.(firstFile)}
            />
            <ActionButton
              icon={
                <GitBranchPlus className="h-4 w-4" aria-hidden="true" />
              }
              label="Clone skills"
              disabled={!firstFile}
              onClick={() => firstFile && onNavigate?.(firstFile)}
            />
            <ActionButton
              icon={
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              }
              label="Connect via SMS"
              disabled={!firstFile}
              onClick={() => firstFile && onNavigate?.(firstFile)}
            />
          </div>

          {/* Recent experience */}
          <div className="mt-10 w-full max-w-[500px] text-left">
            <div className="text-xs font-mono tracking-widest text-[#444444]">
              RECENT EXPERIENCE
            </div>
            <ul className="mt-3 space-y-1 text-[13px] text-[#a3a3a3]">
              <li className="flex gap-2 justify-between">
                <span className="text-[#a3a3a3] font-mono text-left">
                  Data Systems Engineer
                </span>
                <span className="text-[#444444] font-mono text-right">
                  ~/restorefast/ai-dev
                </span>
              </li>
              <li className="flex gap-2 justify-between">
                <span className="text-[#a3a3a3] font-mono text-left">
                  Technical Systems Assistant
                </span>
                <span className="text-[#444444] font-mono text-right">
                  ~/gwu/it
                </span>
              </li>
              <li className="flex gap-2 justify-between">
                <span className="text-[#a3a3a3] font-mono text-left">
                  M.Sc Data Analytics
                </span>
                <span className="text-[#444444] font-mono text-right">
                  ~/gwu/seas/data-analytics
                </span>
              </li>
              <li className="flex gap-2 justify-between">
                <span className="text-[#a3a3a3] font-mono text-left">
                  Data Analyst
                </span>
                <span className="text-[#444444] font-mono text-right">
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
