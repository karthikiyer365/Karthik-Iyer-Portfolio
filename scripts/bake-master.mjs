// Bake content/resume.md into an importable JSON module so the resume API routes
// don't read the filesystem at runtime (serverless functions don't bundle repo files,
// and Next 16 + Turbopack file-tracing is unreliable). Runs at prebuild + committable.
import fs from "fs";
import path from "path";

const src = path.join(process.cwd(), "content/resume.md");
const out = path.join(process.cwd(), "server/ai/resumeMaster.json");
const text = fs.readFileSync(src, "utf8");
fs.writeFileSync(out, JSON.stringify({ text }));
console.log(`baked ${text.length} chars from content/resume.md -> ${out}`);
