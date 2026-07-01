import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The resume API routes read files at runtime (content/resume.md via readMaster,
  // charts/data/*.json via loadCorpus fallback). Serverless bundles don't include
  // these by default, so fs.readFileSync throws in prod ("generation failed").
  // Trace them into the function bundles.
  outputFileTracingIncludes: {
    "/api/resume/generate": ["./content/**/*", "./charts/data/**/*"],
    "/api/resume/questions": ["./content/**/*", "./charts/data/**/*"],
  },
};

export default nextConfig;
