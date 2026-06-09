// lib/settings.ts
// Single source of truth for the Portfolio Settings screen.
// Data is hardcoded (placeholders for Tools/Skills until a résumé is parsed;
// Contact values are real, migrated from the former content/contact.md).

/** Reserved editor-tab path that triggers the settings screen. */
export const SETTINGS_PATH = "settings";
export const SETTINGS_LABEL = "Portfolio Settings";

export type Subsection = "tools" | "skills" | "contact";

/* ---------- Tools & TechStack ---------- */

export type ToolTab = "all" | "core" | "tooling";

export type ToolGroup =
  | "Languages & frameworks"
  | "Cloud, data & infrastructure"
  | "BI & visualization";

/** Render order for grouped view. */
export const TOOL_GROUPS: ToolGroup[] = [
  "Languages & frameworks",
  "Cloud, data & infrastructure",
  "BI & visualization",
];

export interface ToolItem {
  name: string;
  description: string;
  group: ToolGroup;
  tabs: ToolTab[]; // always includes "all"
}

export const TOOLS_DATA: ToolItem[] = [
  // Languages & frameworks
  {
    name: "Python",
    description:
      "Primary language for pipelines, ML, and services — Pandas, NumPy, Scikit-learn, PyTorch, TensorFlow.",
    group: "Languages & frameworks",
    tabs: ["all", "core"],
  },
  {
    name: "SQL",
    description: "Querying, modeling, and transformation across relational stores.",
    group: "Languages & frameworks",
    tabs: ["all", "core"],
  },
  {
    name: "PostgreSQL / MySQL",
    description: "Relational databases for transactional and analytical workloads.",
    group: "Languages & frameworks",
    tabs: ["all", "core"],
  },
  {
    name: "MongoDB",
    description: "Document store for semi-structured and NoSQL data.",
    group: "Languages & frameworks",
    tabs: ["all", "tooling"],
  },
  {
    name: "R",
    description: "Statistical computing and exploratory analysis.",
    group: "Languages & frameworks",
    tabs: ["all", "tooling"],
  },
  {
    name: "Node.js",
    description: "JavaScript runtime for services and internal tooling.",
    group: "Languages & frameworks",
    tabs: ["all", "tooling"],
  },
  // Cloud, data & infrastructure
  {
    name: "Databricks & Spark",
    description: "Distributed ETL and large-scale data processing.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "GCP (BigQuery, Looker Studio)",
    description: "Warehousing and analytics on Google Cloud.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "Azure (ADF, Blob)",
    description: "Data Factory orchestration and blob storage.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "AWS (S3, EC2, IAM)",
    description: "Object storage, compute, and access management.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "Pinecone",
    description: "Vector database powering RAG and semantic retrieval.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "core"],
  },
  {
    name: "Docker & GHCR",
    description: "Containerized services and image registry.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "tooling"],
  },
  {
    name: "Vercel",
    description: "Frontend and serverless deployment.",
    group: "Cloud, data & infrastructure",
    tabs: ["all", "tooling"],
  },
  // BI & visualization
  {
    name: "Tableau",
    description: "Stakeholder-ready dashboards and exploratory views.",
    group: "BI & visualization",
    tabs: ["all", "core"],
  },
  {
    name: "Power BI",
    description: "Interactive reporting and business dashboards.",
    group: "BI & visualization",
    tabs: ["all", "tooling"],
  },
  {
    name: "Dash & Plotly",
    description: "Interactive analytical apps and time-series dashboards.",
    group: "BI & visualization",
    tabs: ["all", "tooling"],
  },
  {
    name: "Matplotlib & Seaborn",
    description: "Exploratory and statistical plotting in Python.",
    group: "BI & visualization",
    tabs: ["all", "tooling"],
  },
  {
    name: "Excel (Pivot, Solver, VBA)",
    description: "Modeling, optimization, and macro automation.",
    group: "BI & visualization",
    tabs: ["all", "tooling"],
  },
];

/* ---------- Skills & Techniques ---------- */

export type SkillTab = "technical" | "soft";

export type SkillCategory =
  | "Analytics"
  | "ETL"
  | "UI/UX"
  | "AI"
  | "Development"
  | "Leadership"
  | "Management"
  | "Critical Thinking";

export interface SkillItem {
  category: SkillCategory;
  name: string;
  description: string;
  tabs: SkillTab[];
}

export const SKILLS_DATA: SkillItem[] = [
  {
    name: "Data pipeline & ETL design",
    description:
      "Build and maintain ingestion/transformation flows feeding analytics and ML workloads.",
    tabs: ["technical"],
    category: "ETL",
  },
  {
    name: "Data modeling & schema design",
    description: "Relational and document schemas, governed inputs, and clean data layers.",
    tabs: ["technical"],
    category: "Analytics",
  },
  {
    name: "Retrieval-augmented generation (RAG)",
    description: "Pair vector search with LLM reasoning for grounded, cited answers.",
    tabs: ["technical"],
    category: "AI",
  },
  {
    name: "Agentic AI & MCP tooling",
    description: "Multi-step agent flows and custom MCP connectors across enterprise systems.",
    tabs: ["technical"],
    category: "AI",
  },
  {
    name: "LLM application development",
    description: "Production LLM services — triage agents, knowledge platforms, and chat.",
    tabs: ["technical"],
    category: "Development",
  },
  {
    name: "Machine learning modeling",
    description: "Regression and classification with XGBoost, Random Forest, and SVM.",
    tabs: ["technical"],
    category: "AI",
  },
  {
    name: "Deep learning & time-series",
    description: "Bi-LSTM and CNN-LSTM sequence models and time-series forecasting.",
    tabs: ["technical"],
    category: "AI",
  },
  {
    name: "NLP",
    description: "BERT-based text understanding, auto-grading, and sentiment analysis.",
    tabs: ["technical"],
    category: "AI",
  },
  {
    name: "Dimensionality reduction & EDA",
    description: "PCA, t-SNE, and UMAP for feature spaces, plus rigorous exploratory analysis.",
    tabs: ["technical"],
    category: "Analytics",
  },
  {
    name: "MLOps & CI/CD",
    description: "Reproducible model delivery, containerization, and automated pipelines.",
    tabs: ["technical"],
    category: "Development",
  },
  {
    name: "Web scraping & data collection",
    description: "BeautifulSoup/Requests pipelines for longitudinal, multi-source datasets.",
    tabs: ["technical"],
    category: "ETL",
  },
  {
    name: "BI dashboards & reporting",
    description: "Self-service Tableau, Power BI, and Dash views for non-technical teams.",
    tabs: ["technical"],
    category: "UI/UX",
  },
  {
    name: "Statistical analysis & forecasting",
    description: "Hypothesis testing, regression, and time-series forecasting on messy data.",
    tabs: ["technical"],
    category: "Analytics",
  },
  {
    name: "Data storytelling for stakeholders",
    description: "Translating model and pipeline outputs into decision-ready recommendations.",
    tabs: ["soft"],
    category: "Critical Thinking",
  },
  {
    name: "Leadership",
    description: "Guiding teams, setting direction, and creating accountability without turning meetings into performance art.",
    tabs: ["soft"],
    category: "Leadership",
  },
  {
    name: "Management",
    description: "Planning work, coordinating priorities, and keeping execution moving across teams.",
    tabs: ["soft"],
    category: "Management",
  },
  {
    name: "Critical thinking",
    description: "Breaking down ambiguous problems, testing assumptions, and making decisions from evidence.",
    tabs: ["soft"],
    category: "Critical Thinking",
  },
];

/* ---------- Contact ---------- */

export type ContactTab = "all" | "work" | "social";

export interface ContactChannel {
  label: string;
  value: string;
  href?: string;
  tabs: ContactTab[]; // always includes "all"
  badge?: string; // small pink note, e.g. "fastest via SMS"
  subtext?: string; // muted second line
  /** Hidden when "Make contact details public" is OFF. */
  private?: boolean;
}

export const CONTACT_DATA: ContactChannel[] = [
  {
    label: "Phone",
    value: "+1 (202) 713-1699",
    href: "tel:+12027131699",
    tabs: ["all", "work"],
    private: true,
  },
  {
    label: "Email",
    value: "karthikiyer365@gmail.com",
    href: "mailto:karthikiyer365@gmail.com",
    tabs: ["all", "work"],
    private: true,
  },
    {
    label: "LinkedIn",
    value: "ksi365",
    href: "https://linkedin.com/in/ksi365",
    tabs: ["all", "work"],
  },
  {
    label:"GitHub",
    value:"karthikiyer365",
    href:"https://github.com/karthikiyer365",
    tabs:["all", "work"],
  },
  {
    label: "Location",
    value: "Arlington, VA",
    tabs: ["all"],
    subtext: "Open to remote & hybrid",
  },
  {
    label:"Instagram",
    value:"iyer.karthik00",
    href:"https://www.instagram.com/iyer.karthik00",
    tabs:["all", "social"]
  }

];