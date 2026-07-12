// TS port of resume-autopilot/scripts/quality_check.py gates, applied to the
// structured ResumeData instead of a .tex file. Word-count check dropped: the
// one-page fit is enforced by ResumeDocument's auto-scale (and it was warn-only
// upstream anyway).
import type { ResumeData } from "@/lib/resume";

const BUZZWORDS = ["spearheaded", "passionate", "results-driven", "detail-oriented", "synergy", "leverage"];

const SOFT_SIGNALS = [
  "led", "collaborated", "mentored", "partnered", "coordinated",
  "drove", "communicated", "cross-functional", "stakeholder",
  "ownership", "initiative",
];

const METRIC_PATTERNS = [
  /\d+\.?\d*\s*%/g,                                   // percentages: 80%, 4.2%
  /\$\s*\d[\d,.]*[MKB]?/g,                            // dollars: $1.2M, $500K
  /\d+\.?\d*\s*[MKB]\b/g,                             // scale: 4.2B, 10M
  /\d+\.?\d*x\b/g,                                    // multipliers: 5x
  /\d+\+?\s*(?:hours?|days?|weeks?|months?|years?)/gi, // time spans
  /(?<![,\d])\b\d{2,}\b(?![,\d])/g,                   // standalone integers 10+
];

export interface QualityResult {
  pass: boolean;
  failures: string[];
  metricCount: number;
  softSignals: string[];
  buzzwords: string[];
}

export function checkResume(d: ResumeData): QualityResult {
  const bullets = [
    ...(d.experience ?? []).flatMap((e) => e.bullets ?? []),
    ...(d.projects ?? []).flatMap((p) => p.bullets ?? []),
  ];
  const text = [d.summary ?? "", ...bullets].join(" ");
  const lower = text.toLowerCase();

  const metrics = new Set<string>();
  for (const pattern of METRIC_PATTERNS) {
    for (const m of text.match(pattern) ?? []) {
      const val = m.trim();
      if (/^\d{4}$/.test(val)) continue; // skip year-looking numbers
      metrics.add(val);
    }
  }

  const buzzwords = BUZZWORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower)).filter(
    // upstream exception: "leverage" allowed in technical context (quality_check.py:115-118)
    (w) => w !== "leverage" || !["technical", "infrastructure", "aws", "cloud", "api"].some((t) => lower.includes(t))
  );

  const softSignals = SOFT_SIGNALS.filter((s) => new RegExp(`\\b${s}\\b`).test(lower));

  // Case-sensitive like upstream: \bI\b, \bmy\b, \bme\b.
  const firstPerson = /\bI\b/.test(text) || /\b(?:my|me)\b/.test(text);

  const failures: string[] = [];
  if (metrics.size < 5) failures.push(`only ${metrics.size} unique metrics — need 5+; carry exact numbers from the evidence`);
  if (buzzwords.length) failures.push(`banned buzzwords present: ${buzzwords.join(", ")} — replace with plain verb + result`);
  if (softSignals.length < 2)
    failures.push(`only ${softSignals.length} soft-skill signals — need 2+ woven into bullets (led, partnered, cross-functional, stakeholder, ...)`);
  if (firstPerson) failures.push("first-person pronouns (I/my/me) present — remove");

  return { pass: failures.length === 0, failures, metricCount: metrics.size, softSignals, buzzwords };
}
