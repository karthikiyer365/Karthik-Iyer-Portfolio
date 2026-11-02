// Render the tailored resume as LaTeX. Content + page breaks come from
// lib/resumePacker.ts (toBlocks + a Selection), the same blocks ResumeDocument
// renders: each block is a minipage, so a role or project never splits across
// pages and a section heading always sits with its first entry. Layout mirrors
// components/ResumeDocument.tsx — keep the two in sync. Server-side artifact only:
// returned by the resume generate job (server/ai/resumeJobs.ts) for offline
// formatting. Compiles with tectonic/pdflatex.
import type { ResumeData } from "@/lib/resume";
import { toBlocks, type Item, type Selection } from "@/lib/resumePacker";

// String() first: a model reply can put a non-string where text belongs, and one
// bad field must not blank the whole document.
const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

// Bullets are plain text; strip any stray **bold** markers the model still emits.
const escPlain = (s: unknown) => esc(s).replace(/\*\*/g, "");

// Bare domains in the contact line (github.com/…, linkedin.com/in/…, karthikiyer.info)
// become underlined links. Emails/phones/locations stay plain text.
const contactItem = (c: string) =>
  /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(c) ? `\\href{https://${c}}{\\underline{${esc(c)}}}` : esc(c);

const SEP = " \\ $|$ \\ ";

const PREAMBLE = String.raw`%-------------------------
% Karthik Iyer — resume template, Times (mirrors components/ResumeDocument.tsx)
%-------------------------
\documentclass[letterpaper,10pt]{article}

\usepackage[T1]{fontenc}
\usepackage{newtxtext} % Times
\usepackage[margin=0.5in]{geometry}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{iftex}
\ifPDFTeX\input{glyphtounicode}\pdfgentounicode=1\fi % ATS-readable text; pdfTeX-only

\pagestyle{empty}
\setlength{\parindent}{0pt}
\raggedbottom

\setlist[itemize]{leftmargin=0.32in, label=\textbullet, itemsep=0pt, parsep=0pt, topsep=1pt, partopsep=0pt}

% \heading{title}: bold uppercase over a full-width rule.
\newcommand{\heading}[1]{\vspace{3pt}{\fontsize{11}{13.5}\selectfont\bfseries\MakeUppercase{#1}}\par\vspace{-5pt}\rule{\linewidth}{0.6pt}\par\vspace{1pt}}
% \titlefont: 10.5pt for org, role and project lines.
\newcommand{\titlefont}{\fontsize{10.5}{12.75}\selectfont}
% \lr{left}{right}: a line with right-aligned dates/location.
\newcommand{\lr}[2]{#1\hfill #2\par}

\begin{document}
\fontsize{9.5}{11.25}\selectfont
`;

function renderItem(it: Item): string {
  switch (it.kind) {
    case "header": {
      const contact = it.contact.split("·").map((c) => contactItem(c.trim())).join(SEP);
      return `\\begin{center}{\\fontsize{20}{23}\\selectfont\\bfseries ${esc(it.name)}}\\\\[3pt]{\\footnotesize ${contact}}\\end{center}\\vspace{-6pt}`;
    }
    case "heading":
      return `\\heading{${esc(it.text)}}`;
    case "summary":
      return `${esc(it.text)}\\par`;
    case "edu":
      return `\\textbf{${esc(it.org)}}${SEP}${esc(it.degree)}${SEP}${esc(it.gpa)}${SEP}${esc(it.dates)}\\par`;
    case "skill":
      return `\\textbf{${esc(it.group)}:} ${esc(it.items)}\\par`;
    case "org":
      return `\\vspace{2pt}{\\titlefont\\lr{\\textbf{${esc(it.org)}}}{${esc(it.location)}}}`;
    case "role":
      return `{\\titlefont\\lr{\\hspace*{0.15in}\\textbf{${esc(it.role)}}${it.subtitle ? `${SEP}${esc(it.subtitle)}` : ""}}{${esc(it.dates)}}}`;
    case "proj":
      return `\\vspace{2pt}{\\titlefont\\textbf{${esc(it.name)}${it.subtitle ? ` -- ${esc(it.subtitle)}` : ""}}${it.stack ? `${SEP}\\textit{${esc(it.stack)}}` : ""}\\par}`;
    case "vol":
      return `\\lr{\\textbf{${esc(it.org)}}${SEP}${esc(it.role)}}{${esc(it.dates)}}`;
    case "cert":
      return `\\textbf{${esc(it.label)}:} ${esc(it.text)}\\par`;
    case "bullet":
      return `\\item ${escPlain(it.text)}`;
  }
}

export function buildTex(d: ResumeData, sel: Selection): string {
  const blocks = toBlocks(d, sel).map((b) => {
    // Consecutive bullets share one itemize.
    const lines: string[] = [];
    let inList = false;
    for (const it of b.items) {
      const isBullet = it.kind === "bullet";
      if (isBullet && !inList) lines.push("\\begin{itemize}");
      if (!isBullet && inList) lines.push("\\end{itemize}");
      inList = isBullet;
      lines.push(renderItem(it));
    }
    if (inList) lines.push("\\end{itemize}");
    // A minipage can't break across pages — the whole block moves instead. Space
    // at the top of a minipage is discarded, so the gap above goes outside it.
    const gap = { heading: "\\vspace{4pt}", org: "\\vspace{2pt}", proj: "\\vspace{2pt}" }[b.items[0].kind as string] ?? "";
    return `% ${b.id}\n${gap}\\noindent\\begin{minipage}{\\textwidth}\n${lines.join("\n")}\n\\end{minipage}\\par`;
  });
  return `${PREAMBLE}\n${blocks.join("\n\n")}\n\n\\end{document}\n`;
}
