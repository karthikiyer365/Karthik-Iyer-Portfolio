// Bake the resume markdown into an importable JSON module so the resume API routes
// don't read the filesystem at runtime (serverless functions don't bundle repo files,
// and Next 16 + Turbopack file-tracing is unreliable). Runs at prebuild.
// Case-insensitive lookup: `update` has content/resume.md, `main` has content/Resume.md,
// and Linux (Netlify) is case-sensitive.
import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");
const file = fs.readdirSync(contentDir).find((f) => /^resume\.md$/i.test(f));
if (!file) throw new Error("bake-master: no resume*.md found in content/");

const text = fs.readFileSync(path.join(contentDir, file), "utf8");
const out = path.join(process.cwd(), "server/ai/resumeMaster.json");
fs.writeFileSync(out, JSON.stringify({ text }));
console.log(`baked ${text.length} chars from content/${file} -> ${out}`);
