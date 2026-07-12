// Fill the Jake template's content section from ResumeData — preamble vendored
// verbatim from resume-autopilot/master-1page/resume.tex (do NOT change spacing or
// commands there). Server-side artifact only: returned by /api/resume/generate for
// backend formatting / autopilot round-trips, no client download UI.
import type { ResumeData } from "@/lib/resume";

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

// Bullets carry **keyword** bold markers from the LLM → \textbf{}. Escape first
// so the marker conversion runs on already-safe text (* is not a LaTeX special).
const escBold = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}");

const PREAMBLE = String.raw`%-------------------------
% Jake's Resume Template
%-------------------------
% Resume for Karthik Iyer. Do NOT change the preamble, packages, spacing, or commands.
% Only edit content between \begin{document} and \end{document}.

\documentclass[letterpaper,11pt]{article}
% Force 10.5pt font size for tighter layout

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}
\usepackage[T1]{fontenc}
\usepackage{helvet}
\renewcommand{\familydefault}{\sfdefault}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-6pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-5pt}
}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\AtBeginDocument{\fontsize{10.5}{15.3}\selectfont}

\begin{document}`;

export function buildTex(d: ResumeData): string {
  const parts: string[] = [PREAMBLE];

  // Heading — contact line arrives "loc · email · phone · link"; render with $|$.
  const contact = d.contact.split("·").map((c) => esc(c.trim())).join(" $|$\n    ");
  parts.push(`
%----------HEADING----------
\\begin{center}
    \\textbf{\\LARGE \\scshape ${esc(d.name)}} \\\\ \\vspace{2pt}
    \\small ${contact}
\\end{center}`);

  if (d.summary) {
    parts.push(`
%-----------SUMMARY-----------
\\section{Summary}
 \\begin{itemize}[leftmargin=0in, label={}]
    \\small{\\item{${esc(d.summary)}}}
 \\end{itemize}`);
  }

  if (d.skills?.length) {
    const lines = d.skills
      .map((g) => `     \\textbf{${esc(g.group)}}{: ${g.items.map(esc).join(", ")}}`)
      .join(" \\\\\n");
    parts.push(`
%-----------SKILLS-----------
\\section{Skills}
 \\begin{itemize}[leftmargin=0in, label={}]
    \\small{\\item{
${lines}
    }}
 \\end{itemize}`);
  }

  if (d.experience?.length) {
    const entries = d.experience
      .map((e) => {
        const bullets = e.bullets.map((b) => `        \\resumeItem{${escBold(b)}}`).join("\n");
        return `    \\resumeSubheading
      {${esc(e.org)}}{${esc(e.location ?? "")}}
      {${esc(e.role)}}{${esc(e.dates)}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
      })
      .join("\n\n");
    parts.push(`
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

${entries}

  \\resumeSubHeadingListEnd`);
  }

  if (d.projects?.length) {
    const entries = d.projects
      .map((p) => {
        const heading = p.stack
          ? `{\\textbf{${esc(p.name)}} $|$ \\emph{${esc(p.stack)}}}{}`
          : `{\\textbf{${esc(p.name)}}}{}`;
        const bullets = p.bullets.map((b) => `            \\resumeItem{${escBold(b)}}`).join("\n");
        return `      \\resumeProjectHeading
          ${heading}
          \\resumeItemListStart
${bullets}
          \\resumeItemListEnd`;
      })
      .join("\n");
    parts.push(`
%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
${entries}
    \\resumeSubHeadingListEnd`);
  }

  if (d.education?.length) {
    const entries = d.education
      .map(
        (ed) => `    \\resumeSubheading
      {${esc(ed.org)}}{${esc(ed.location ?? "")}}
      {${esc(ed.degree)}}{${esc(ed.dates)}}`
      )
      .join("\n");
    parts.push(`
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${entries}
  \\resumeSubHeadingListEnd`);
  }

  if (d.leadership?.length || d.certifications?.length) {
    const lines: string[] = [];
    if (d.leadership?.length)
      lines.push(`     \\textbf{Leadership}{: ${d.leadership.map(esc).join("; ")}}`);
    if (d.certifications?.length)
      lines.push(`     \\textbf{Certifications}{: ${d.certifications.map(esc).join(", ")}}`);
    parts.push(`
%-----------LEADERSHIP (optional)-----------
\\section{Leadership \\& Certifications}
 \\begin{itemize}[leftmargin=0in, label={}]
    \\small{\\item{
${lines.join(" \\\\\n")}
    }}
 \\end{itemize}`);
  }

  parts.push(`
%-------------------------------------------
\\end{document}
`);
  return parts.join("\n");
}
