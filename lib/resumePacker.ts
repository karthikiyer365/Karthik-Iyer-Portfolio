// Decides how much of the resume pool to show so it is exactly 2 pages with page 2
// at least 70% full, and lays it out in unbreakable blocks: a role or project never
// splits across pages, and a section heading always travels with its first entry.
// Pure: the browser packs with measured DOM heights (ResumeDocument), the server
// with estimateHeight (texBuilder). Heights are CSS px on a US Letter page at 96dpi.
import { groupByOrg, type ResumeData } from "./resume";

export const PAGE_WIDTH = 816;
export const PAGE_HEIGHT = 1056;
export const PAGE_MARGIN = 48; // 0.5in
export const CONTENT_HEIGHT = PAGE_HEIGHT - 2 * PAGE_MARGIN;
export const MIN_PAGE2_FILL = 0.7;
const MIN_BULLETS = 2; // a shown role/project keeps at least this many bullets

export type Item =
  | { id: string; kind: "header"; name: string; contact: string }
  | { id: string; kind: "heading"; text: string }
  | { id: string; kind: "summary"; text: string }
  | { id: string; kind: "edu"; org: string; degree: string; gpa: string; dates: string }
  | { id: string; kind: "skill"; group: string; items: string }
  | { id: string; kind: "org"; org: string; location: string }
  | { id: string; kind: "role"; role: string; subtitle?: string; dates: string }
  | { id: string; kind: "proj"; name: string; subtitle?: string; stack?: string }
  | { id: string; kind: "bullet"; text: string }
  | { id: string; kind: "vol"; org: string; role: string; dates: string }
  | { id: string; kind: "cert"; label: string; text: string };

export type Block = { id: string; items: Item[] };
export type Measure = (item: Item) => number;

// Bullets shown per entry; -1 hides the entry. Indexes match the pool's arrays.
export interface Selection {
  exp: number[];
  proj: number[];
  vol: number[];
}

export function toBlocks(d: ResumeData, sel: Selection): Block[] {
  const blocks: Block[] = [
    {
      id: "top",
      items: [
        { id: "header", kind: "header", name: d.name, contact: d.contact },
        { id: "h-summary", kind: "heading", text: "Summary" },
        { id: "summary", kind: "summary", text: d.summary },
      ],
    },
    {
      id: "education",
      items: [
        { id: "h-edu", kind: "heading", text: "Education" },
        ...d.education.map((e, i): Item => ({ id: `edu${i}`, kind: "edu", ...e })),
      ],
    },
    {
      id: "skills",
      items: [
        { id: "h-skills", kind: "heading", text: "Skills" },
        ...d.skills.map((s, i): Item => ({ id: `skill${i}`, kind: "skill", group: s.group, items: s.items.join(", ") })),
      ],
    },
  ];

  // Section heading rides in the section's first block.
  const section = (heading: Item, parts: Item[][]) =>
    parts.forEach((items, i) => blocks.push({ id: `${heading.id}-${i}`, items: i === 0 ? [heading, ...items] : items }));
  const bullets = (prefix: string, list: string[], n: number): Item[] =>
    list.slice(0, n).map((text, j) => ({ id: `${prefix}.b${j}`, kind: "bullet", text }));

  const exps = d.experience.map((e, i) => ({ ...e, i })).filter((e) => sel.exp[e.i] >= 0);
  const expParts: Item[][] = [];
  for (const g of groupByOrg(exps)) {
    g.roles.forEach((e, k) => {
      const role: Item[] = [
        { id: `exp${e.i}`, kind: "role", role: e.role, subtitle: e.subtitle, dates: e.dates },
        ...bullets(`exp${e.i}`, e.bullets, sel.exp[e.i]),
      ];
      // An org header travels with its first role.
      expParts.push(k === 0 ? [{ id: `org${e.i}`, kind: "org", org: g.org, location: g.location ?? "" }, ...role] : role);
    });
  }
  if (expParts.length) section({ id: "h-exp", kind: "heading", text: "Work Experience" }, expParts);

  const projParts = d.projects
    .map((p, i): Item[] | null =>
      sel.proj[i] < 0
        ? null
        : [{ id: `proj${i}`, kind: "proj", name: p.name, subtitle: p.subtitle, stack: p.stack }, ...bullets(`proj${i}`, p.bullets, sel.proj[i])]
    )
    .filter((p): p is Item[] => p !== null);
  if (projParts.length) section({ id: "h-proj", kind: "heading", text: "Projects" }, projParts);

  const volParts = d.volunteer.map((v, i): Item[] => [
    { id: `vol${i}`, kind: "vol", org: v.org, role: v.role, dates: v.dates },
    ...bullets(`vol${i}`, v.bullets, sel.vol[i]),
  ]);
  if (volParts.length) section({ id: "h-vol", kind: "heading", text: "Volunteer" }, volParts);

  const pubCert: Item[] = [{ id: "h-pubs", kind: "heading", text: "Publications & Certifications" }];
  if (d.publication) pubCert.push({ id: "pub", kind: "cert", label: "Publication", text: d.publication });
  if (d.certifications.length) pubCert.push({ id: "certs", kind: "cert", label: "Certifications", text: d.certifications.join(" | ") });
  if (pubCert.length > 1) blocks.push({ id: "pubs", items: pubCert });
  return blocks;
}

// Greedy: a block that doesn't fit the rest of the page starts the next one.
export function paginate(blocks: Block[], measure: Measure, contentHeight = CONTENT_HEIGHT) {
  const pages: Block[][] = [[]];
  const used = [0];
  for (const b of blocks) {
    const h = b.items.reduce((s, it) => s + measure(it), 0);
    const p = pages.length - 1;
    if (used[p] + h > contentHeight && pages[p].length) {
      pages.push([b]);
      used.push(h);
    } else {
      pages[p].push(b);
      used[p] += h;
    }
  }
  return { pages, used };
}

export function packResume(d: ResumeData, measure: Measure, contentHeight = CONTENT_HEIGHT): Selection {
  const sel: Selection = {
    exp: d.experience.map((e) => (e.fill === undefined ? e.bullets.length : -1)),
    proj: d.projects.map((p) => (p.fill === undefined ? p.bullets.length : -1)),
    vol: d.volunteer.map((v) => v.bullets.length),
  };
  const layout = () => paginate(toBlocks(d, sel), measure, contentHeight);
  const fits = () => layout().pages.length <= 2;
  const page2Fill = () => {
    const l = layout();
    return l.pages.length < 2 ? 0 : l.used[1] / contentHeight;
  };

  // Trim one bullet: volunteer bullets go first, then the shown role/project with
  // the most bullets (ties: the later one). The most recent role counts double, so
  // it keeps ~2x the bullets of the rest. Last resort: hide the last project.
  const lead = sel.exp.findIndex((n) => n >= 0);
  const trimOne = (): boolean => {
    for (let i = sel.vol.length - 1; i >= 0; i--) if (sel.vol[i] > 0) return sel.vol[i]--, true;
    let bestK: "exp" | "proj" | null = null;
    let bestI = -1;
    let most = 0;
    for (const k of ["exp", "proj"] as const)
      for (let i = 0; i < sel[k].length; i++) {
        const score = sel[k][i] / (k === "exp" && i === lead ? 2 : 1);
        if (sel[k][i] > MIN_BULLETS && score >= most) [bestK, bestI, most] = [k, i, score];
      }
    if (bestK) {
      sel[bestK][bestI]--;
      return true;
    }
    const lastProj = sel.proj.map((n, i) => (n >= 0 ? i : -1)).filter((i) => i >= 0).pop();
    if (lastProj !== undefined && sel.proj.filter((n) => n >= 0).length > 1) return (sel.proj[lastProj] = -1), true;
    return false;
  };
  while (!fits() && trimOne());

  // Page 2 under 70%: add filler entries in priority order, trimming only the
  // filler itself to make it fit — never core content — and skipping it if it can't.
  const fillers = [
    ...d.experience.map((e, i) => ({ k: "exp" as const, i, fill: e.fill, n: e.bullets.length })),
    ...d.projects.map((p, i) => ({ k: "proj" as const, i, fill: p.fill, n: p.bullets.length })),
  ]
    .filter((f) => f.fill !== undefined)
    .sort((a, b) => (a.fill ?? 0) - (b.fill ?? 0));
  for (const f of fillers) {
    if (page2Fill() >= MIN_PAGE2_FILL) break;
    sel[f.k][f.i] = f.n;
    while (!fits() && sel[f.k][f.i] > MIN_BULLETS) sel[f.k][f.i]--;
    if (!fits()) sel[f.k][f.i] = -1;
  }
  return sel;
}

// Server-side height estimate (no DOM): character counts → wrapped lines, using the
// same typography ResumeDocument renders (Times New Roman 9.5pt body on 15px lines,
// 10.5pt titles on 17px lines, 11pt headings; 720px content width). Calibrated
// against measured DOM heights; capacities err slightly low so the server never
// under-counts a page.
const LINE = 15;
const TITLE_LINE = 17;
const CHARS_PER_LINE = 130; // full content width (measured ~135)
const CHARS_PER_BULLET_LINE = 122; // bullets are indented (measured ~126)
const CHARS_PER_TITLE_LINE = 108; // 10.5pt project titles (measured ~112)
const lines = (text: string, cpl: number) => Math.max(1, Math.ceil(text.replace(/\*\*/g, "").length / cpl));

export const estimateHeight: Measure = (it) => {
  switch (it.kind) {
    case "header":
      return 47;
    case "heading":
      return 27;
    case "summary":
      return lines(it.text, CHARS_PER_LINE) * LINE;
    case "edu":
    case "vol":
      return LINE;
    case "skill":
      return lines(`${it.group}: ${it.items}`, CHARS_PER_LINE) * LINE;
    case "org":
      return TITLE_LINE + 2;
    case "role":
      return TITLE_LINE;
    case "proj":
      return lines(`${it.name} – ${it.subtitle ?? ""} | ${it.stack ?? ""}`, CHARS_PER_TITLE_LINE) * TITLE_LINE + 2;
    case "bullet":
      return lines(it.text, CHARS_PER_BULLET_LINE) * LINE;
    case "cert":
      return lines(`${it.label}: ${it.text}`, CHARS_PER_LINE) * LINE;
  }
};
