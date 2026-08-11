// Improve the EXISTING index in place: replace the 23 messy PDF-scraped blobs with
// clean, granular, metadata-tagged chunks from the gold JSON source.
// ponytail: no new index, no chunking algorithm (JSON structure = chunks), no embedding
// code (the index's integrated sparse model embeds `text`). Stays sparse on purpose.
// Run: node --env-file=.env scripts/ingest.mjs
//      node scripts/ingest.mjs --dry     (build + print chunks, touch nothing, no env needed)
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry");
const NAME = process.env.PINECONE_INDEX;
const HOST = process.env.PINECONE_HOST;
const NS = process.env.PINECONE_NAMESPACE || "__default__";
if (!NAME && !DRY) throw new Error("PINECONE_INDEX not set");

const index = DRY
  ? null
  : (HOST
      ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }).index(NAME, HOST)
      : new Pinecone({ apiKey: process.env.PINECONE_API_KEY }).index(NAME));

// 1. Build records straight from the JSON structure.
const stripMd = (s) =>
  String(s).replace(/[#*`>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);

function recordsFromFile(file, type) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const m = j.meta ?? {};
  const base = {
    type,
    company: m.company ?? "",
    role: m.role ?? "",
    dates: m.duration ?? "",
    location: m.location ?? "",
  };
  const id = path.basename(file, ".json");
  const recs = [];
  if (j.hero) {
    recs.push({
      _id: `${id}#overview`,
      text: `${base.role} at ${base.company}. ${stripMd(j.hero)}`,
      ...base,
      system: "Overview",
    });
  }
  for (const [i, p] of (j.bubble_chart?.points ?? []).entries()) {
    if (!p?.evidence) continue;
    recs.push({
      _id: `${id}#${i}`,
      text: `${base.role} at ${base.company} — ${p.system}: ${p.evidence}`,
      ...base,
      system: p.system ?? "",
    });
  }
  // Outcomes get their own chunk so measurable results stay retrievable on their
  // own instead of riding a hero blob that stripMd truncates at 600 chars.
  const outcomes = Object.entries(j.outcomes ?? {}).map(([k, v]) => `${k}: ${v}`);
  if (outcomes.length) {
    recs.push({
      _id: `${id}#outcomes`,
      text: `${base.role} at ${base.company} — Measurable outcomes: ${outcomes.join(" · ")}`,
      ...base,
      system: "Outcomes",
    });
  }
  // Storyline splits on its `## ` headers (Context / Workflow / Technical
  // Implementation / Outcomes) — the only narrative prose in the spec.
  for (const block of String(j.storyline ?? "").split(/\n(?=##\s)/)) {
    const section = block.match(/^##\s*(.+)/)?.[1]?.trim();
    const body = stripMd(block.replace(/^##\s*.+/, ""));
    if (!section || !body) continue;
    recs.push({
      _id: `${id}#story-${section.toLowerCase().replace(/\W+/g, "-")}`,
      text: `${base.role} at ${base.company} — ${section}: ${body}`,
      ...base,
      system: section,
    });
  }
  // One stack chunk per file: tool + concept node labels, so a JD naming a
  // concrete technology matches even when no prose sentence mentions it.
  const nodes = j.network_graph?.nodes ?? [];
  const label = (t) => nodes.filter((n) => n?.type === t).map((n) => n.id).filter(Boolean);
  const tools = label("tool");
  const concepts = label("concept");
  if (tools.length || concepts.length) {
    recs.push({
      _id: `${id}#stack`,
      text: `${base.role} at ${base.company} — Tools and technologies: ${tools.join(", ")}. Concepts: ${concepts.join(", ")}`,
      ...base,
      system: "Stack",
    });
  }
  return recs;
}

const files = [
  ...fs.readdirSync("charts/data").filter((f) => f.endsWith(".json")).map((f) => [`charts/data/${f}`, "experience"]),
  ...fs.readdirSync("charts/data/projects").filter((f) => f.endsWith(".json")).map((f) => [`charts/data/projects/${f}`, "project"]),
];
const records = files.flatMap(([f, t]) => recordsFromFile(f, t));
console.log(`built ${records.length} chunks from ${files.length} files`);

// ponytail self-check: --dry proves the chunkers fire on every spec without
// touching the live index. Fails loudly if a spec stops producing its sections.
if (DRY) {
  const missing = files
    .map(([f]) => path.basename(f, ".json"))
    .filter((id) => !["#overview", "#outcomes", "#stack", "#story-"].every((suffix) =>
      records.some((r) => r._id.startsWith(`${id}${suffix}`))));
  for (const r of records) console.log(`  ${r._id}\n    ${r.text.slice(0, 140)}`);
  if (missing.length) throw new Error(`specs missing chunk kinds: ${missing.join(", ")}`);
  console.log(`\n✅ dry run: ${records.length} chunks, all ${files.length} specs produced every chunk kind.`);
  process.exit(0);
}

// 2. Clear the old messy records, then upsert the clean ones (integrated embedding
// vectorizes `text`; metadata fields ride along, enabling filters later).
console.log("clearing old records…");
// 404 = namespace already empty/absent — fine, upsert will (re)create it.
try {
  await index.namespace(NS).deleteAll();
} catch (e) {
  console.log("  (nothing to clear:", e?.name ?? e, ")");
}
for (let i = 0; i < records.length; i += 90) {
  await index.namespace(NS).upsertRecords({ records: records.slice(i, i + 90) });
}
console.log("upserted. waiting for freshness…");

// 3. ponytail self-check: the smallest thing that fails if ingestion broke.
await new Promise((r) => setTimeout(r, 6000));
const res = await index.namespace(NS).searchRecords({
  query: { topK: 3, inputs: { text: "large-scale ETL pipeline with Spark and Databricks" } },
});
const hits = res?.result?.hits ?? [];
console.log("self-check hits:", hits.map((h) => `${h._id} (${h._score?.toFixed(2)})`).join(", "));
if (!hits.length) throw new Error("self-check FAILED: no hits returned");
console.log("\n✅ done. Same env — chat retrieval now uses clean, granular, metadata-tagged chunks.");
