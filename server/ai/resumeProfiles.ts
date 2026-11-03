// Role families for the tailored resume: which family a JD belongs to decides the
// summary title, the 5 skills groups, which roles/projects are core vs. page-2
// filler, and project order. Titles/orgs/dates never change per family — they come
// verbatim from the master resume (resumeContext.parseMaster).
import { pickBestMatch } from "./keywordMatch";

export type RoleFamily =
  | "sports-analyst"
  | "supply-chain-analyst"
  | "financial-analyst"
  | "data-scientist"
  | "ai-engineer"
  | "data-analyst";

// Insertion order is the tie-break (pickBestMatch keeps the first best): domain
// families beat generic ones, data-analyst is the default when nothing matches.
const ROLE_FAMILY_KEYWORDS: Record<RoleFamily, string[]> = {
  "sports-analyst": ["sports", "athlete", "athletes", "player", "players", "scouting", "coaching", "coaches",
    "match", "league", "soccer", "football", "basketball", "baseball", "statcast", "tracking data", "wyscout",
    "opta", "statsbomb", "performance analyst", "sports science", "injury", "recruitment analytics"],
  "supply-chain-analyst": ["supply chain", "logistics", "inventory", "demand planning", "procurement", "sourcing",
    "warehouse", "fulfillment", "freight", "transportation", "s&op", "forecast accuracy", "replenishment",
    "distribution", "purchasing", "stockout", "lead time", "vendor"],
  "financial-analyst": ["financial analyst", "fp&a", "financial planning", "budget", "budgeting", "variance analysis",
    "p&l", "financial model", "financial modeling", "valuation", "accounting", "gaap", "cash flow",
    "reconciliation", "audit", "finance", "investment", "banking", "margin", "forecasting revenue"],
  "data-scientist": ["data scientist", "machine learning", "ml engineer", "deep learning", "pytorch", "tensorflow",
    "scikit-learn", "xgboost", "feature engineering", "experimentation", "causal", "statistical modeling",
    "nlp", "computer vision", "mlops", "mlflow", "sagemaker", "model training", "model deployment"],
  "ai-engineer": ["ai engineer", "data engineer", "llm", "llms", "large language model", "rag", "agent", "agents",
    "agentic", "langchain", "langgraph", "mcp", "vector database", "genai", "generative ai", "etl", "elt",
    "data pipeline", "data pipelines", "airflow", "dbt", "kafka", "spark", "databricks", "fastapi", "docker"],
  "data-analyst": ["data analyst", "business analyst", "sql", "excel", "tableau", "power bi", "looker", "dashboard",
    "dashboards", "reporting", "kpi", "kpis", "insights", "stakeholders", "data visualization", "metrics"],
};

export function pickRoleFamily(jdText: string): RoleFamily {
  const { key, score } = pickBestMatch(jdText.toLowerCase(), ROLE_FAMILY_KEYWORDS);
  return score > 0 ? (key as RoleFamily) : "data-analyst";
}

// Experience ids are the master resume's role titles; project ids the part of the
// project name before " – ". Core entries always ship; filler entries are added by
// the packer (lib/resumePacker.ts) only while page 2 is under 70% full, in order.
export interface FamilyProfile {
  label: string;
  summaryTitle: string; // the summary opens "<summaryTitle> with 2+ years…"
  skills: { group: string; items: string[] }[]; // exactly 5, defaults the LLM may refine
  experience: string[];
  experienceFiller: string[];
  projects: string[];
  projectFiller: string[];
}

const LANGUAGES = { group: "Languages", items: ["Python", "SQL", "R", "TypeScript"] };
const DASHBOARDING = {
  group: "Dashboarding",
  items: ["Power BI", "Tableau", "Looker Studio", "Shiny", "Streamlit", "Dash", "Plotly", "PostHog"],
};
const DATA_ENGINEERING = {
  group: "Data Engineering",
  items: ["ETL Pipelines", "Data Modeling", "PostgreSQL", "Supabase", "Spark", "Databricks", "REST APIs", "GitHub Actions"],
};

export const FAMILY_PROFILES: Record<RoleFamily, FamilyProfile> = {
  "ai-engineer": {
    label: "AI / Data Engineer",
    summaryTitle: "AI Engineer",
    skills: [
      { group: "AI & ML", items: ["LLMs", "RAG", "MCP / Agentic AI", "LangChain", "OpenAI Realtime API", "Pinecone", "LLM Evaluation", "Hugging Face"] },
      DATA_ENGINEERING,
      { group: "Cloud & DevOps", items: ["AWS (S3, EC2, IAM)", "GCP (BigQuery)", "Docker", "Docker Compose", "GitHub Actions (CI/CD)", "FastAPI"] },
      LANGUAGES,
      DASHBOARDING,
    ],
    experience: ["AI Engineer", "Data Analyst", "Teaching Assistant", "Financial Analyst"],
    experienceFiller: ["Sales & Marketing Operations Lead", "Performance Analyst (Volunteer)"],
    projects: ["SportSignal", "Laya vs Traditional ML", "EcoPolitical Understanding"],
    projectFiller: ["Action Valuation", "Demand Forecasting"],
  },
  "data-scientist": {
    label: "Data Scientist / ML Engineer",
    summaryTitle: "Data Scientist",
    skills: [
      { group: "Machine Learning", items: ["scikit-learn", "XGBoost", "HistGradientBoosting", "PyTorch", "Hugging Face (ModernBERT)", "SHAP", "LLMs"] },
      { group: "Statistics", items: ["Grouped Cross-Validation", "Calibration", "A/B Testing", "Regression", "Time-Series Forecasting", "PCA", "t-SNE"] },
      DATA_ENGINEERING,
      LANGUAGES,
      { group: "Deployment", items: ["Docker", "FastAPI", "GitHub Actions (CI/CD)", "Streamlit", "Shiny", "AWS (S3, EC2)"] },
    ],
    experience: ["AI Engineer", "Teaching Assistant", "Financial Analyst"],
    experienceFiller: ["Data Analyst", "Performance Analyst (Volunteer)"],
    projects: ["Laya vs Traditional ML", "Action Valuation", "Pitcher Perfect", "Demand Forecasting"],
    projectFiller: ["FIFA × NBA", "SportSignal"],
  },
  "data-analyst": {
    label: "Data Analyst",
    summaryTitle: "Data Analyst",
    skills: [
      { group: "Analytics", items: ["Excel (Power Query, Power Pivot/DAX, VBA, XLOOKUP, Pivot Tables, Solver)", "SQL", "pandas", "A/B Testing"] },
      DASHBOARDING,
      { group: "Forecasting & ML", items: ["scikit-learn", "XGBoost", "HistGradientBoosting", "Regression", "Time-Series & Quantile Forecasting", "PCA"] },
      DATA_ENGINEERING,
      LANGUAGES,
    ],
    experience: ["AI Engineer", "Data Analyst", "Teaching Assistant", "Financial Analyst", "Sales & Marketing Operations Lead"],
    experienceFiller: ["Performance Analyst (Volunteer)"],
    projects: ["Olist E-commerce", "Demand Forecasting", "EcoPolitical Understanding"],
    projectFiller: ["FIFA × NBA", "SportSignal"],
  },
  "sports-analyst": {
    label: "Sports Analyst",
    summaryTitle: "Sports Data Analyst",
    skills: [
      { group: "Sports Data", items: ["Statcast (pybaseball)", "Wyscout", "Taka", "TITAN GPS", "FBref", "StatsBomb", "Transfermarkt", "Understat"] },
      { group: "Modeling", items: ["xG / xT / xA", "VAEP / SPADL (socceraction)", "XGBoost", "SHAP", "Regression", "PCA"] },
      DASHBOARDING,
      DATA_ENGINEERING,
      LANGUAGES,
    ],
    experience: ["AI Engineer", "Performance Analyst (Volunteer)", "Teaching Assistant"],
    experienceFiller: ["Data Analyst", "Financial Analyst"],
    projects: ["SportSignal", "Pitcher Perfect", "Action Valuation", "FIFA × NBA"],
    projectFiller: ["Demand Forecasting"],
  },
  "financial-analyst": {
    label: "Financial Analyst",
    summaryTitle: "Financial Analyst",
    skills: [
      { group: "Financial Analysis", items: ["Excel (Power Query, Power Pivot/DAX, VBA, Solver)", "Reconciliation", "Margin & Cost Analysis", "Financial Reporting"] },
      { group: "Analytics", items: ["SQL", "pandas", "A/B Testing", "Data Validation", "Data Cleansing"] },
      DASHBOARDING,
      { group: "Forecasting", items: ["Regression", "Time-Series Forecasting", "HistGradientBoosting", "Quantile Forecasting", "scikit-learn"] },
      LANGUAGES,
    ],
    experience: ["AI Engineer", "Data Analyst", "Financial Analyst", "Sales & Marketing Operations Lead"],
    experienceFiller: ["Teaching Assistant", "Performance Analyst (Volunteer)"],
    projects: ["Olist E-commerce", "Demand Forecasting", "EcoPolitical Understanding"],
    projectFiller: ["Laya vs Traditional ML"],
  },
  "supply-chain-analyst": {
    label: "Supply Chain Analyst",
    summaryTitle: "Supply Chain Analyst",
    skills: [
      { group: "Planning & Forecasting", items: ["Demand Forecasting", "Quantile / p90 Inventory Planning", "WAPE", "Forecast Bias", "HistGradientBoosting"] },
      { group: "Analytics", items: ["Excel (Power Query, Pivot Tables, Solver)", "SQL", "pandas", "Inventory Analysis"] },
      DASHBOARDING,
      DATA_ENGINEERING,
      LANGUAGES,
    ],
    experience: ["AI Engineer", "Data Analyst", "Financial Analyst"],
    experienceFiller: ["Sales & Marketing Operations Lead", "Teaching Assistant", "Performance Analyst (Volunteer)"],
    projects: ["Demand Forecasting", "Olist E-commerce"],
    projectFiller: ["EcoPolitical Understanding", "SportSignal"],
  },
};
