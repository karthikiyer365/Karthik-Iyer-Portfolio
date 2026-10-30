// Bake the master resume into an importable JSON module so the resume API routes
// don't read the filesystem at runtime (serverless functions don't bundle repo files,
// and Next 16 + Turbopack file-tracing is unreliable). Runs at prebuild.
// Source is server/ai/resumeMaster.md (the PDF transcription), not the visual
// content/Resume.md page.
import fs from "fs";
import path from "path";

const src = path.join(process.cwd(), "server/ai/resumeMaster.md");
const text = fs.readFileSync(src, "utf8").replace(/<!--[\s\S]*?-->\s*/g, "");
const out = path.join(process.cwd(), "server/ai/resumeMaster.json");
fs.writeFileSync(out, JSON.stringify({ text }));
console.log(`baked ${text.length} chars from ${src} -> ${out}`);
