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

const ARCHETYPES: Record<string, string[]> = {
  "streaming-DE": ["kafka", "kinesis", "flink", "real-time", "streaming", "cdc",
    "change data capture", "pubsub", "pub/sub", "beam", "schema registry"],
  "batch-DE": ["spark", "pyspark", "glue", "airflow", "etl", "elt", "dbt",
    "batch processing", "hive", "hadoop", "emr", "dagster", "prefect"],
  "ml-adjacent": ["sagemaker", "mlflow", "feature store", "machine learning", "pytorch",
    "tensorflow", "llm", "rag", "vertex ai", "xgboost", "scikit-learn",
    "embeddings", "fine-tuning"],
  "cloud-infra-DE": ["eks", "k8s", "kubernetes", "terraform", "cdk", "cloudformation",
    "docker", "helm", "ecs", "ansible", "ci/cd", "github actions",
    "cloudwatch", "observability"],
  "analytics-DE": ["dbt", "snowflake", "tableau", "power bi", "looker", "bigquery",
    "duckdb", "quicksight", "superset", "grafana", "data warehouse",
    "data lakehouse", "redshift"],
};

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, kw: string) => new RegExp(`\\b${escRe(kw)}\\b`).test(text);
const countWord = (text: string, kw: string) =>
  (text.match(new RegExp(`\\b${escRe(kw)}\\b`, "g")) ?? []).length;

export interface JdAnalysis {
  score: number; // % of JD keywords present in resume material
  present: string[];
  missing: { kw: string; freq: number; cluster: string }[]; // ranked by JD emphasis
  archetype: string;
  archetypeSignals: string[];
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

  let archetype = "";
  let best = -1;
  let archetypeSignals: string[] = [];
  for (const [name, sigs] of Object.entries(ARCHETYPES)) {
    let score = 0;
    const hit: string[] = [];
    for (const sig of sigs) {
      const c = countWord(jd, sig);
      score += c;
      if (c > 0) hit.push(`${sig}×${c}`);
    }
    if (score > best) {
      best = score;
      archetype = name;
      archetypeSignals = hit.slice(0, 5);
    }
  }

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
    archetype,
    archetypeSignals,
    quickWins,
  };
}

// Compact text block for prompt injection.
export function formatReport(a: JdAnalysis): string {
  const missing = a.missing
    .map((m) => `${m.kw}${m.freq > 1 ? ` ×${m.freq}` : ""} → Skills > ${m.cluster}`)
    .join("; ");
  return [
    `Match score: ${a.score}% (${a.present.length}/${a.present.length + a.missing.length} known JD keywords covered)`,
    `Archetype: ${a.archetype} [${a.archetypeSignals.join(", ") || "—"}]`,
    a.missing.length ? `Missing keywords (by JD emphasis): ${missing}` : "No missing known keywords — full coverage.",
    a.quickWins.length ? `Quick wins: ${a.quickWins.join(" | ")}` : "",
    `Present: ${a.present.join(", ")}`,
  ].filter(Boolean).join("\n");
}
