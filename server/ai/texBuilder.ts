// Fill the resume template from ResumeData. Layout mirrors the current resume PDF
// (public/Karthik-Iyer-Resume.pdf) and components/ResumeDocument.tsx — keep the
// three in sync. Server-side artifact only: returned by the resume generate job (server/ai/resumeJobs.ts) for
// backend formatting, no client download UI. Compiles with tectonic/pdflatex.
import { groupByOrg, type ResumeData } from "@/lib/resume";

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

// Bullets carry **keyword** bold markers from the LLM → \textbf{}. Escape first
// so the marker conversion runs on already-safe text (* is not a LaTeX special).
const escBold = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}");

// Bare domains in the contact line (linkedin.com/in/…, karthikiyer.info) become
// underlined links, as on the PDF. Emails/phones/locations stay plain text.
const contactItem = (c: string) =>
  /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(c)
    ? `\\href{https://${c}}{\\underline{${esc(c)}}}`
    : esc(c);

const PREAMBLE = String.raw`%-------------------------
% Karthik Iyer — resume template (matches public/Karthik-Iyer-Resume.pdf)
%-------------------------
\documentclass[letterpaper,10pt]{article}

\usepackage[T1]{fontenc}
\usepackage[default]{lato}
\usepackage[margin=0.5in]{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{tabularx}
\usepackage[hidelinks]{hyperref}
\usepackage{iftex}
\ifPDFTeX\input{glyphtounicode}\pdfgentounicode=1\fi % ATS-readable text; pdfTeX-only

\pagestyle{empty}
\setlength{\parindent}{0pt}
\raggedbottom

% Bold uppercase section title over a full-width rule.
\titleformat{\section}{\bfseries}{}{0em}{\MakeUppercase}[\vspace{-4pt}\rule{\textwidth}{0.6pt}]
\titlespacing*{\section}{0pt}{8pt}{3pt}

\setlist[itemize]{leftmargin=0.38in, label=\textbullet, itemsep=0pt, parsep=0pt, topsep=0pt, partopsep=0pt}

% \orgline{org}{location} · \roleline{role}{dates} (indented) · \eduline{org}{degree}{location}{date}
\newcommand{\orgline}[2]{\textbf{#1}\hfill #2\par}
\newcommand{\roleline}[2]{\hspace*{0.2in}\textbf{#1}\hfill #2\par}
\newcommand{\eduline}[4]{\textbf{#1 \ $|$ \ #2}\hfill #3 \ $|$ \ #4\par}
\newcommand{\projline}[1]{\textbf{#1}\par}

\begin{document}`;

export function buildTex(d: ResumeData): string {
  const parts: string[] = [PREAMBLE];

  // Heading — contact line arrives "loc · email · phone · link"; render with $|$.
  const contact = d.contact.split("·").map((c) => contactItem(c.trim())).join(" \\ $|$ \\ ");
  parts.push(`
\\begin{center}
  {\\LARGE\\bfseries ${esc(d.name.toUpperCase())}}\\\\[2pt]
  \\small ${contact}
\\end{center}
\\vspace{-8pt}`);

  if (d.summary) {
    parts.push(`
\\section{Professional Summary}
${esc(d.summary)}`);
  }

  if (d.skills?.length) {
    const rows = d.skills.map((g) => `  \\textbf{${esc(g.group)}} & ${g.items.map(esc).join(", ")} \\\\`).join("\n");
    parts.push(`
\\section{Skills}
\\begin{tabularx}{\\textwidth}{@{}p{1.45in}X@{}}
${rows}
\\end{tabularx}`);
  }

  if (d.education?.length) {
    const rows = d.education
      .map((ed) => `\\eduline{${esc(ed.org)}}{${esc(ed.degree)}}{${esc(ed.location ?? "")}}{${esc(ed.dates)}}`)
      .join("\n");
    parts.push(`
\\section{Education}
${rows}`);
  }

  if (d.experience?.length) {
    const entries = groupByOrg(d.experience)
      .map((g) => {
        const roles = g.roles
          .map((e) => {
            const bullets = e.bullets.map((b) => `  \\item ${escBold(b)}`).join("\n");
            return `\\roleline{${esc(e.role)}}{${esc(e.dates)}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
          })
          .join("\n");
        return `\\orgline{${esc(g.org)}}{${esc(g.location ?? "")}}\n${roles}`;
      })
      .join("\n\n");
    parts.push(`
\\section{Work Experience}
${entries}`);
  }

  if (d.projects?.length) {
    const entries = d.projects
      .map((p) => {
        const head = p.stack ? `${esc(p.name)} \\ $|$ \\ ${esc(p.stack)}` : esc(p.name);
        const bullets = p.bullets.map((b) => `  \\item ${escBold(b)}`).join("\n");
        return `\\projline{${head}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
      })
      .join("\n");
    parts.push(`
\\section{Projects}
${entries}`);
  }

  if (d.leadership?.length || d.certifications?.length) {
    const blocks: string[] = [];
    if (d.certifications?.length)
      blocks.push(`\\textbf{Certifications}\\par\n${d.certifications.map(esc).join(" \\ $|$ \\ ")}\\par`);
    if (d.leadership?.length)
      blocks.push(`\\textbf{Volunteer \\& Leadership}\n\\begin{itemize}\n${d.leadership.map((l) => `  \\item ${esc(l)}`).join("\n")}\n\\end{itemize}`);
    parts.push(`
\\section{Certifications, Publications \\& Volunteer Experience}
${blocks.join("\n")}`);
  }

  parts.push(`
\\end{document}
`);
  return parts.join("\n");
}
