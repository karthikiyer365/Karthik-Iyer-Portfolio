// Bake the master resume and the chart-JSON corpus into an importable JSON module so
// the resume code doesn't read the filesystem at runtime (serverless functions don't
// bundle repo files, and Netlify's function bundler chokes on process.cwd()-relative
// reads). Runs at prebuild.
// Source is server/ai/resumeMaster.md (the PDF transcription), not the visual
// content/Resume.md page.
import fs from "fs";
import path from "path";

const src = path.join(process.cwd(), "server/ai/resumeMaster.md");
const text = fs.readFileSync(src, "utf8").replace(/<!--[\s\S]*?-->\s*/g, "");

// Only the narrative text from the chart JSONs (hero/storyline/outcomes) — keyword
// gap analysis input and the fallback when Pinecone is unavailable.
const parts = [];
for (const d of ["charts/data", "charts/data/projects"]) {
  const dir = path.join(process.cwd(), d);
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".json")) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const bits = [];
    if (typeof j.hero === "string") bits.push(j.hero);
    if (typeof j.storyline === "string") bits.push(j.storyline);
    if (j.outcomes && typeof j.outcomes === "object") {
      bits.push(Object.entries(j.outcomes).map(([k, v]) => `${k}: ${v}`).join("; "));
    }
    if (bits.length) parts.push(bits.join("\n"));
  }
}
const corpus = parts.join("\n\n---\n\n");

const out = path.join(process.cwd(), "server/ai/resumeMaster.json");
fs.writeFileSync(out, JSON.stringify({ text, corpus }));
console.log(`baked ${text.length} chars master + ${corpus.length} chars corpus (${parts.length} specs) -> ${out}`);
