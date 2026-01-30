    "use client";

    import type { ReactNode } from "react";
    import { FolderOpen, GitBranchPlus, MessageSquare } from "lucide-react";

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
            "bg-[#e7e7e7] px-4 py-2 text-[13px] font-medium text-[#111111]",
            "shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] transition",
            "hover:bg-[#f1f1f1] active:bg-[#dddddd]",
            "disabled:cursor-not-allowed disabled:opacity-70",
          ].join(" ")}
        >
          <span className="text-[#111111]">{icon}</span>
          <span className="whitespace-nowrap">{label}</span>
        </button>
      );
    }

    export default function LandingPage({ onNavigate }: LandingPageProps) {
      return (
        <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
          <div className="w-full max-w-[820px] px-6">
            <div className="flex flex-col items-center text-center">
              {/* Logo + Title */}
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#141414] ring-1 ring-[#1f1f1f]">
                  <div className="h-5 w-5 rotate-45 rounded-[4px] bg-[#e5e5e5]" />
                </div>
                <div className="text-[28px] font-semibold tracking-[0.22em] text-[#e5e5e5]">
                  KARTHIK
                </div>
              </div>

              <div className="mt-2 text-sm text-[#a3a3a3]">Developer • Engineer</div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ActionButton
                  icon={<FolderOpen className="h-4 w-4" aria-hidden="true" />}
                  label="Open portfolio"
                  onClick={() => onNavigate?.("portfolio/README.md")}
                />
                <ActionButton
                  icon={<GitBranchPlus className="h-4 w-4" aria-hidden="true" />}
                  label="Clone skills"
                  onClick={() => onNavigate?.("portfolio/tools.css")}
                />
                <ActionButton
                  icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
                  label="Connect via SMS"
                />
              </div>

              {/* Recent experience */}
              <div className="mt-10 w-full max-w-[560px] text-left ">
                <div className="text-xs font-mono tracking-widest text-[#444444]">
                  RECENT EXPERIENCE
                </div>
                <ul className="mt-3 space-y-1 text-[13px] text-[#a3a3a3]">
                  <li className="flex gap-2 justify-between">
                    <span className="text-[#a3a3a3] font-mono text-left">Data Systems Engineer</span>
                    <span className="text-[#444444] font-mono text-right">~/restorefast/ai-dev</span>
                  </li>
                  <li className="flex gap-2 justify-between">
                    <span className="text-[#a3a3a3] font-mono text-left">Technical Systems Assistant</span>
                    <span className="text-[#444444] font-mono text-right">~/gwu/it</span>
                  </li>
                  <li className="flex gap-2 justify-between">
                    <span className="text-[#a3a3a3] font-mono text-left">M.Sc Data Analytics</span>
                    <span className="text-[#444444] font-mono text-right">~/gwu/seas/data-analytics</span>
                  </li>
                  <li className="flex gap-2 justify-between">
                    <span className="text-[#a3a3a3] font-mono text-left">Data Analyst</span>
                    <span className="text-[#444444] font-mono text-right">~/dpsy/financial-data-analysis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

