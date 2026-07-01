// Improve the EXISTING index in place: replace the 23 messy PDF-scraped blobs with
// clean, granular, metadata-tagged chunks from the gold JSON source.
// ponytail: no new index, no chunking algorithm (JSON structure = chunks), no embedding
// code (the index's integrated sparse model embeds `text`). Stays sparse on purpose.
// Run: node --env-file=.env scripts/ingest.mjs
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import path from "path";

const NAME = process.env.PINECONE_INDEX;
const HOST = process.env.PINECONE_HOST;
const NS = process.env.PINECONE_NAMESPACE || "__default__";
if (!NAME) throw new Error("PINECONE_INDEX not set");

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = HOST ? pc.index(NAME, HOST) : pc.index(NAME);

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
  const outcomes = j.outcomes
    ? Object.entries(j.outcomes).map(([k, v]) => `${k}: ${v}`).join(" · ")
    : "";
  const recs = [];
  if (j.hero) {
    recs.push({
      _id: `${id}#overview`,
      text: `${base.role} at ${base.company}. ${stripMd(j.hero)}${outcomes ? ` Metrics: ${outcomes}` : ""}`,
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
  return recs;
}

const files = [
  ...fs.readdirSync("charts/data").filter((f) => f.endsWith(".json")).map((f) => [`charts/data/${f}`, "experience"]),
  ...fs.readdirSync("charts/data/projects").filter((f) => f.endsWith(".json")).map((f) => [`charts/data/projects/${f}`, "project"]),
];
const records = files.flatMap(([f, t]) => recordsFromFile(f, t));
console.log(`built ${records.length} chunks from ${files.length} files`);

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
