import { callOpenRouterChat } from "./llm";

// TS port of resume-autopilot/scripts/keyword_match.py — JD-to-resume keyword gap
// analysis. Script-only, zero LLM tokens. Output feeds the questions + generate
// prompts (internal only, never shown to the recruiter as a score UI).
// ponytail: unknown-term scan from the python version skipped — it existed so Claude
// wouldn't re-read the JD; our LLM calls receive the full JD anyway.

const KNOWN_KEYWORDS = [
  // Languages
  "python", "sql", "scala", "java", "r", "bash", "go", "rust", "typescript", "javascript",
  "node.js", "nodejs",
  // Big Data / Processing
  "spark", "pyspark", "hadoop", "hive", "flink", "kafka", "kinesis", "beam", "dbt",
  "databricks", "delta lake", "delta", "iceberg", "parquet", "avro", "orc",
  // Cloud — AWS
  "aws", "s3", "glue", "lambda", "redshift", "emr", "athena", "sagemaker", "step functions",
  "dynamodb", "sqs", "sns", "rds", "ec2", "ecs", "eks", "cloudwatch", "cloudformation",
  "cdk", "terraform", "iam",
  // Cloud — GCP
  "gcp", "bigquery", "dataflow", "dataproc", "pub/sub", "pubsub", "cloud run", "gke",
  "vertex ai", "vertex",
  // Cloud — Azure
  "azure", "azure data factory", "adf", "synapse", "azure databricks", "cosmos db",
  "azure functions", "ado",
  // Orchestration / Workflow
  "airflow", "prefect", "dagster", "luigi", "mage", "argo",
  // Databases
  "postgresql", "postgres", "mysql", "snowflake", "mongodb", "cassandra", "redis",
  "elasticsearch", "neo4j", "sqlite", "cockroachdb", "duckdb",
  // ML / AI
  "machine learning", "deep learning", "nlp", "llm", "rag", "langchain", "openai",
  "hugging face", "pytorch", "tensorflow", "scikit-learn", "sklearn", "xgboost",
  "lightgbm", "mlflow", "feature store", "vector database", "embeddings",
  "transformer", "bert", "gpt", "fine-tuning", "prompt engineering",
  "mcp", "agentic ai", "agentic", "pinecone", "mlops",
  // Data Engineering patterns
  "etl", "elt", "data pipeline", "data lake", "data lakehouse", "data warehouse",
  "data mesh", "data catalog", "data quality", "data lineage", "data governance",
  "data modeling", "schema design", "data validation", "web scraping",
  "streaming", "batch processing", "real-time", "cdc", "change data capture",
  "schema evolution", "schema registry",
  // DevOps / Infra
  "docker", "kubernetes", "k8s", "ci/cd", "github actions", "jenkins", "gitlab ci",
  "helm", "ansible", "git", "github", "gitlab",
  // APIs / Integration
  "rest", "restful", "rest api", "graphql", "grpc", "api gateway", "fastapi", "flask", "django",
  // Soft / Process
  "agile", "scrum", "jira", "confluence", "stakeholder", "cross-functional",
  // BI / Visualization
  "tableau", "power bi", "looker", "quicksight", "grafana", "superset",
  "plotly", "dash", "matplotlib", "seaborn", "excel",
  // Testing
  "pytest", "unit testing", "integration testing", "data testing", "great expectations",
  // Monitoring
  "datadog", "new relic", "splunk", "prometheus", "alerting", "observability",
];

// Treat these as the same keyword when checking resume presence.
const ALIASES: Record<string, string[]> = {
  pyspark: ["spark"],
  postgresql: ["postgres"],
  "scikit-learn": ["sklearn"],
  "pub/sub": ["pubsub"],
  k8s: ["kubernetes"],
  "step functions": ["stepfunctions"],
  "delta lake": ["delta"],
};

// Cluster keys match the Jake-template \textbf{...} skill labels — the generate
// prompt uses the same labels so placement suggestions map 1:1.
const SKILLS_CLUSTERS: Record<string, string[]> = {
  "Languages & Data": [
    "python", "sql", "r", "node.js", "nodejs", "typescript", "javascript",
    "java", "scala", "go", "rust", "bash",
    "mysql", "snowflake", "mongodb", "postgresql", "postgres", "neo4j", "bigquery",
    "redis", "cassandra", "elasticsearch", "sqlite", "cockroachdb", "duckdb",
    "dynamodb", "rds",
  ],
  "Data Engineering": [
    "etl", "elt", "data pipeline", "data modeling", "schema design", "data validation",
    "rest", "rest api", "web scraping", "mlops", "ci/cd",
    "data warehouse", "data lake", "data lakehouse",
    "batch processing", "streaming", "real-time",
    "dbt", "airflow", "prefect", "dagster", "luigi", "mage", "argo",
    "parquet", "avro", "orc",
    "git", "github", "gitlab", "github actions", "gitlab ci",
  ],
  "AI / ML": [
    "machine learning", "deep learning", "nlp", "llm", "rag", "langchain", "openai",
    "hugging face", "pytorch", "tensorflow", "scikit-learn", "sklearn", "xgboost",
    "lightgbm", "mlflow", "feature store", "vector database", "embeddings",
    "transformer", "bert", "gpt", "fine-tuning", "prompt engineering",
    "sagemaker", "vertex ai", "vertex", "mcp", "agentic",
  ],
  "Cloud & DevOps": [
    "aws", "s3", "glue", "lambda", "redshift", "emr", "athena",
    "step functions", "sqs", "sns", "ec2", "ecs", "eks", "cloudwatch",
    "cloudformation", "iam", "kinesis", "kubernetes", "k8s",
    "docker", "terraform", "ansible", "helm", "cdk", "jenkins",
    "azure", "gcp", "databricks", "spark", "pyspark", "hadoop", "hive", "flink",
    "kafka", "beam", "delta lake", "delta", "iceberg",
    "datadog", "prometheus", "splunk", "grafana", "observability",
  ],
  "BI & Visualization": [
    "tableau", "power bi", "looker", "quicksight", "superset",
    "plotly", "dash", "seaborn", "matplotlib", "excel",
  ],
};

// Role-type taxonomy: what flavor of technical work the JD is asking for.
// Keyword-scored, sync, zero LLM cost — same mechanism as before, relabeled
// and reshaped around Karthik's actual work (streaming+batch merged into one
// etl-de bucket; project-management added since nothing detected it before).
const ROLE_TYPES: Record<string, string[]> = {
  "etl-de": ["kafka", "kinesis", "flink", "real-time", "streaming", "cdc",
    "change data capture", "pubsub", "pub/sub", "beam", "schema registry",
    "spark", "pyspark", "glue", "airflow", "etl", "elt", "dbt",
    "batch processing", "hive", "hadoop", "emr", "dagster", "prefect"],
  "bi-analytics": ["dbt", "snowflake", "tableau", "power bi", "looker", "bigquery",
    "duckdb", "quicksight", "superset", "grafana", "data warehouse",
    "data lakehouse", "redshift"],
  "ai-ml": ["sagemaker", "mlflow", "feature store", "machine learning", "pytorch",
    "tensorflow", "llm", "rag", "vertex ai", "xgboost", "scikit-learn",
    "embeddings", "fine-tuning"],
  "cloud-infra": ["eks", "k8s", "kubernetes", "terraform", "cdk", "cloudformation",
    "docker", "helm", "ecs", "ansible", "ci/cd", "github actions",
    "cloudwatch", "observability"],
  "project-management": ["stakeholder management", "roadmap", "cross-functional",
    "scrum master", "program management", "sprint planning", "backlog",
    "agile ceremonies", "okr", "prioritization", "delivery management",
    "product owner"],
};

// Industry taxonomy: what domain the hiring org operates in. Signals are
// DOMAIN-OBJECT vocabulary (what the company does), never role vocabulary
// ("engineer"/"developer"/"analyst") — every JD Karthik pastes is already a
// technical role, so role words would false-match every bucket equally and
// tell us nothing about industry. "other/unclassified" is a fallback, not a
// scored bucket, and is intentionally absent from this map.
const INDUSTRIES: Record<string, string[]> = {
  tech: ["saas platform", "developer platform", "api-first", "product analytics",
    "internal tooling"],
  finance: ["trading systems", "portfolio data", "fintech", "lending platform",
    "underwriting models", "risk data", "hedge fund", "brokerage systems"],
  "logistics/supply-chain": ["fleet telemetry", "freight brokerage", "tms", "wms",
    "route optimization", "supply chain visibility", "last-mile",
    "distribution network", "inventory forecasting"],
  sports: ["sports analytics", "player tracking data", "league operations data",
    "team performance metrics", "sports betting data"],
  edutech: ["lms platform", "curriculum data", "student outcomes",
    "online learning platform", "ed-tech"],
  "insurance/proptech": ["claims data", "underwriting models", "property data",
    "restoration operations data", "construction data", "real estate platform",
    "procore", "policy data"],
  "retail/e-commerce": ["e-commerce platform", "checkout systems",
    "merchandising data", "storefront analytics", "marketplace data",
    "sku-level data"],
  consulting: ["client engagement data", "professional services delivery",
    "advisory analytics"],
};

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, kw: string) => new RegExp(`\\b${escRe(kw)}\\b`).test(text);
const countWord = (text: string, kw: string) =>
  (text.match(new RegExp(`\\b${escRe(kw)}\\b`, "g")) ?? []).length;

// Score every group's signal words against `text`, return the group with the
// highest hit count. Shared by role-type and industry scoring — both are the
// same "which labeled bucket does this JD's language match best" operation.
function pickBestMatch(
  text: string,
  groups: Record<string, string[]>
): { key: string; signals: string[]; score: number } {
  let bestKey = "";
  let best = -1;
  let bestSignals: string[] = [];
  for (const [key, sigs] of Object.entries(groups)) {
    let score = 0;
    const hit: string[] = [];
    for (const sig of sigs) {
      const c = countWord(text, sig);
      score += c;
      if (c > 0) hit.push(`${sig}×${c}`);
    }
    if (score > best) {
      best = score;
      bestKey = key;
      bestSignals = hit.slice(0, 5);
    }
  }
  return { key: bestKey, signals: bestSignals, score: best };
}

export interface JdAnalysis {
  score: number; // % of JD keywords present in resume material
  present: string[];
  missing: { kw: string; freq: number; cluster: string }[]; // ranked by JD emphasis
  roleType: string;
  roleTypeSignals: string[];
  quickWins: string[];
}

export function analyzeJd(jdText: string, resumeText: string): JdAnalysis | null {
  const jd = jdText.toLowerCase();
  const resume = resumeText.toLowerCase();

  const found = KNOWN_KEYWORDS.filter((kw) => hasWord(jd, kw));
  if (!found.length) return null;

  const present: string[] = [];
  const missing: string[] = [];
  for (const kw of found) {
    const ok = hasWord(resume, kw) || (ALIASES[kw] ?? []).some((a) => hasWord(resume, a));
    (ok ? present : missing).push(kw);
  }

  const freq = new Map(found.map((kw) => [kw, countWord(jd, kw)] as [string, number]));

  const { key: roleType, signals: roleTypeSignals } = pickBestMatch(jd, ROLE_TYPES);

  const clusterOf = (kw: string) =>
    Object.entries(SKILLS_CLUSTERS).find(([, m]) => m.includes(kw))?.[0] ?? "Skills";
  const missingRanked = missing
    .sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))
    .map((kw) => ({ kw, freq: freq.get(kw) ?? 0, cluster: clusterOf(kw) }));
  const quickWins = missingRanked
    .slice(0, 3)
    .map((m) => `Add "${m.kw}" to Skills > ${m.cluster}${m.freq > 1 ? ` (JD mentions ×${m.freq})` : ""}`);

  return {
    score: Math.round((present.length / found.length) * 100),
    present,
    missing: missingRanked,
    roleType,
    roleTypeSignals,
    quickWins,
  };
}

export interface IndustryResult {
  industry: string;
  method: "keyword" | "llm";
  signals?: string[];
}

// Compact text block for prompt injection.
export function formatReport(a: JdAnalysis, industry?: IndustryResult): string {
  const missing = a.missing
    .map((m) => `${m.kw}${m.freq > 1 ? ` ×${m.freq}` : ""} → Skills > ${m.cluster}`)
    .join("; ");
  return [
    `Match score: ${a.score}% (${a.present.length}/${a.present.length + a.missing.length} known JD keywords covered)`,
    `Role-type: ${a.roleType} [${a.roleTypeSignals.join(", ") || "—"}]`,
    industry
      ? `Industry: ${industry.industry} (${industry.method}${industry.signals?.length ? `, ${industry.signals.join(", ")}` : ""})`
      : "",
    a.missing.length ? `Missing keywords (by JD emphasis): ${missing}` : "No missing known keywords — full coverage.",
    a.quickWins.length ? `Quick wins: ${a.quickWins.join(" | ")}` : "",
    `Present: ${a.present.join(", ")}`,
  ].filter(Boolean).join("\n");
}

function classifyIndustryKeyword(jdText: string): { industry: string; signals: string[] } {
  const { key, signals, score } = pickBestMatch(jdText.toLowerCase(), INDUSTRIES);
  return score > 0 ? { industry: key, signals } : { industry: "other/unclassified", signals: [] };
}

const INDUSTRY_LABELS = [...Object.keys(INDUSTRIES), "other/unclassified"];

async function classifyIndustryLlm(jdText: string): Promise<{ industry: string }> {
  const result = await callOpenRouterChat({
    temperature: 0,
    max_tokens: 30,
    messages: [
      {
        role: "system",
        content: `Classify the INDUSTRY of the company hiring for this job description. Every JD you see is for a technical (developer/data/analytics) role — classify the COMPANY's industry from what it does, never from the role's title. Reply with EXACTLY ONE label from this list, nothing else: ${INDUSTRY_LABELS.join(", ")}.`,
      },
      { role: "user", content: jdText.slice(0, 4000) },
    ],
  });
  const raw = (result.content ?? "").trim().toLowerCase();
  const match = INDUSTRY_LABELS.find((label) => raw.includes(label));
  return { industry: match ?? "other/unclassified" };
}

// Env-toggled A/B comparison point: keyword scoring (default, zero LLM cost)
// vs a dedicated LLM classification call. Never throws — falls back to the
// keyword path so a flaky/misconfigured LLM call never breaks resume
// generation. Set RESUME_INDUSTRY_CLASSIFIER=llm to flip the toggle.
export async function classifyIndustry(jdText: string): Promise<IndustryResult> {
  const method = process.env.RESUME_INDUSTRY_CLASSIFIER === "llm" ? "llm" : "keyword";
  if (method === "keyword") {
    return { method: "keyword", ...classifyIndustryKeyword(jdText) };
  }
  try {
    const { industry } = await classifyIndustryLlm(jdText);
    return { method: "llm", industry };
  } catch (e) {
    console.warn("[classifyIndustry] LLM path failed, falling back to keyword", e);
    return { method: "keyword", ...classifyIndustryKeyword(jdText) };
  }
}
