# KARTHIK IYER
Arlington, VA | +1 (202) 713-1699 | karthikiyer365@gmail.com | linkedin.com/in/karthikiyer365 | karthikiyer.info

<!-- Source of truth for the AI: transcribed from the current resume PDF
     (public/Karthik-Iyer-Resume.pdf). Baked into resumeMaster.json for the resume
     routes and chunked per bullet into Pinecone by scripts/ingest.mjs.
     Structure is parsed: ## section, ### org | location (or project | stack),
     #### role | dates, "- " bullets. Keep it in sync with the PDF. -->

## PROFESSIONAL SUMMARY
AI Engineer and Data Analyst with 2+ years putting AI to work for Operations, Sales and Finance teams to support data-driven decisions. Integrates siloed business systems across CRM, finance, workforce and project management into one unified, ERP-style data layer, simplifying the data architecture that agentic AI automations and workflows run on. Skilled in Python, SQL, data modeling, LLM evaluation, workflow design and cross-functional collaboration.

## SKILLS
- Languages & Data: Python (Pandas, NumPy, Scikit-learn, PyTorch), SQL, PostgreSQL, MySQL, R, TypeScript
- AI / ML: LLMs, RAG, MCP / Agentic AI, LangChain, OpenAI Realtime API, Hugging Face, XGBoost, SHAP
- Data Engineering: ETL Pipelines, Data Modeling, Schema Design, REST APIs, Data Validation, Web Scraping
- Cloud & DevOps: AWS (S3, EC2, IAM), GCP (BigQuery), Databricks, Spark, Docker, GitHub Actions (CI/CD)
- BI & Visualization: Tableau, Power BI, Shiny, Streamlit, Dash, Plotly, Looker Studio, PostHog
- Sports Data: Statcast (pybaseball), Wyscout, Taka, TITAN GPS, FBref, StatsBomb, Transfermarkt
- Additional Skills: React, Node.js, FastAPI, Twilio, Supabase, Pinecone, Docker Compose, GHCR, Vercel, ADF (Blob), MLOps, Random Forest, SVM, Time Series Forecasting, PCA, t-SNE, Matplotlib, Seaborn, Understat, socceraction (SPADL/VAEP), Excel (Pivot, Solver, VBA, Macros)

## EDUCATION
### George Washington University | Washington, DC
#### M.S. in Data Analytics (GPA 3.68/4.00) | May 2025
Coursework: Database Systems, ETL, Machine Learning, Data Visualization, Project Management, Sports Analytics.

### University of Mumbai, SIES | Mumbai, India
#### B.E. in Computer Engineering (CGPA 3.50/4.00) | May 2022
Coursework: Image Processing, Database Management, ERP Systems, NLP, Web Development, Data Structures and Algorithms.

## WORK EXPERIENCE
### RestoreFast Operations LLC | North Bethesda, MD, USA
#### AI Engineer | June 2025 – July 2026
- Built multi-agent orchestration in LangChain with RAG (documents, email), MCP (Xero, Procore) and NL-to-SQL (database) sub-agents, plus an orchestrator agent for answer calculation and response synthesis, later rebuilt as the shared data-access layer behind the company's internal tools.
- Unified 6 business systems (Gmail, Drive, Xero, Procore, Nutshell, Supabase) into one internal data layer through custom MCP tools, RAG connectors and REST services, so managers could pull project, billing and client history themselves.
- Designed the RAG ingestion and retrieval pipeline on a 100K-vector Pinecone index with semantic and graph chunking, reranking and metadata-filtered BM25 hybrid search, lifting precision@k by ~30% as scored by an LLM-as-a-Judge on retrieved chunks, with login-based IAM limiting each user to authorized chunks.
- Evaluated LLM orchestration and accuracy across Claude, Gemini and GPT-4o on 100+ test questions with a 3-person panel, tracing most failures to multi-step math and ~10% to chunks missed in retrieval.
- Architected a bidirectional WebSocket bridge in FastAPI between Twilio and the OpenAI Realtime API, taking half of ~300 quarterly inbound calls off a team that had answered every call by hand.
- Designed Realtime API tool calls that verified clients by phone, email and project number, created tickets and escalated to sales, with automatic fallback rerouting on WebSocket failure so no leads were lost.
- Built an agentic crew recommendation system (DS-CAR) in Python and SQL over PostgreSQL, filtering 20–500 workers by distance, skills and certification records, then ranking crews for project managers.
- Built a compliance document hub on Supabase (PostgreSQL) with AWS S3 document storage, tracking worker and project requirement expirations and attachments across 5+ active projects.
- Developed a central communications layer routing events from 15+ internal tools to SMS, voice and email channels through a containerized Twilio integration.
- Automated data ingestion pipelines in Python and SQL as cron-scheduled Docker Compose jobs into PostgreSQL and Pinecone, keeping data current without manual reloads.
- Established self-hosted infrastructure for ingestion, agent orchestration and MCP servers using FastAPI and Docker Compose, deployed via GitHub Actions CI/CD and maintained over SSH.
- Delivered work in two-week Agile sprints coordinated in Slack, and maintained technical documentation for the data layer, pipelines and agent tools so teammates could run and update them.
- Analyzed product usage data in PostHog across 150+ users over 6 months; found field crews used only 5–8 of 30 mobile-app features, which led to a field-app redesign.

### George Washington University | Washington, DC, USA
#### Performance Analyst (Volunteer), GWU Soccer | May 2025 – August 2025
- Built player-load dashboards on TITAN sensor data (ACWR, Recovery Index, DSL), aligning training with position-specific development plans to reduce fatigue and, in effect, injury risk.
- Analyzed per-session training performance to surface fatigue inflection points and high-load drills, informing week-to-week coach-side training adjustments.
- Built position-specific scouting workflows on Wyscout and Taka, integrating 3 seasons of A-10 match-by-match event and tracking data, helping to rank prospects by xG, xT and xA metrics.

#### Technical Systems Admin, Software Support | August 2024 – May 2025
- Conducted inventory audits and supported demand forecasting using BMC Helix, ensuring resource allocation and procurement.
- Built Power BI feedback dashboards tracking usage and sentiment across 10+ academic tools on Mac, Linux, and Windows, driving 90%+ user satisfaction through data-informed support.
- Analyzed support ticket trends and operational data to identify system bottlenecks, contributing to a 97% issue resolution rate and improving team response workflows.

#### Teaching Assistant, Decision Making & Data Analytics | September 2024 – December 2024
- Ran weekly 3-hour student support sessions translating probabilistic and data-analytics concepts into applied examples for a multi-section graduate cohort.
- Built an auto-grading pipeline for 400+ assignments using Python, NLP, and BERT, cutting evaluation time ~60% and saving faculty ~10 hours per week.
- Refined the grading algorithm with 3 faculty members over the term, lifting scoring consistency and plagiarism detection.
- Validated the grading model against 200 hand-graded submissions (~80% agreement), recalibrating per assignment and hand-checking borderline cases.

### DPSY & Associates | Mumbai, India
#### Analytics Intern | April 2023 – June 2023
- Built data cleansing, data-quality checks and reconciliation routines for a banking client with SQL and Python (Pandas, NumPy), cleaning and filtering 80% of routine records to surface high-risk cases and cut audit cycles from 2 to 1.5 months.
- Aggregated market and product-segment statistics in Excel (pivot tables, lookups) on costing, profit margins and inventory holding levels, showing which segments justified their carrying cost.
- Built and presented 10+ Tableau and Power BI dashboards and decks internally, feeding client presentations that helped banking, retail and energy clients pinpoint stocking levels and ROI thresholds.
- Modeled energy demand vs. renewable generation with regression in Python so an energy client could plan capital spend.

### TechAnalogy | Mumbai, India
#### Sales & Marketing Operations Lead | August 2021 – December 2021
- Analyzed campaign performance and engagement metrics to support 10+ new B2B acquisitions, serving as primary data liaison across 4 key accounts.
- Initiated a cross-channel B2C+B2B campaign strategy whose coordinated execution drove a ~20% increase in student registrations across the quarter.
- Ran market research on social-media engagement and event-participant demographics, unlocking the pilot launch of a 3-domain Robotics course with 100+ enrollments.
- Ran A/B testing on marketing offers to identify top-performing variants, lifting campaign conversion rates ~5% on the recurring lead funnel.

## PROJECTS
### Laya vs Traditional ML – ModernBERT for Classification of Support Tickets | Python, PyTorch, Hugging Face, scikit-learn
- Built a confidence-gated text classification router in Python with scikit-learn (TF-IDF, logistic regression) so operations teams could auto-route confident tickets and hand ambiguous ones to people; routed 46% at 96% accuracy on 16,338 tickets.
- Rebuilt model evaluation with grouped cross-validation after finding 77% of tickets had reworded duplicates, exposing a 33-point accuracy overstatement before choosing a model.
- Benchmarked Laya, a ModernBERT System One decision model, zero-shot and fine-tuned in PyTorch, against the logistic regression; +0.75 points over seed 42 and 43 runs at 8 GPU-hours each, so the baseline stayed.
- Calibrated ModernBERT confidence with temperature scaling, cutting calibration error from 0.178 to 0.076, so routing thresholds reflected how often the model was actually right.

### Demand Forecasting – Gradient Boosting for Inventory Planning | Python, scikit-learn, Shiny
- Forecasted weekly SKU demand for 320 products with scikit-learn HistGradientBoosting so a planning manager could size stock and buys, cutting 4-week WAPE to 15.2% vs 20.5% for the best standard method.
- Diagnosed forecast bias where a neutral-looking −1.3% average hid end-of-life products over-forecast by 42%, and added a decline warning so planners see where forecasts are weakest.
- Shipped a quantile inventory planner in Shiny for Python that stocks to the p90 of total demand rather than summed weekly p90s, keeping ~90% coverage with 2–8% less inventory.

### SportSignal – ETL Ingestion Pipeline for Unifying Disjointed Sports Data | Python, SQL, Supabase, GitHub Actions
- Built a multi-sport data hub loading 18 seasons of big-five European football (FBref, Transfermarkt, Understat, StatsBomb, ClubElo) and MLB Statcast into Supabase PostgreSQL behind public dashboards.
- Automated refreshes as a GitHub Actions pipeline with Parquet caching and per-league failure isolation, keeping 49,792 player-seasons and 542,481 shots current without manual reloads.
- Matched players across sources with no shared IDs using crosswalks and fuzzy matching, so market value, transfers and per-90 output join into one player record.

### Pitcher Perfect – MLB Pitcher Analysis | Python, pybaseball, XGBoost, SHAP, Supabase
- Built pitcher profiles from Statcast (4.5M pitches, 2020–2026) covering pitch usage, velo, spin, tilt, induced vertical break, arm-side run, arm angle, extension and whiff%, with release point, movement and location plots.
- Added pitch mix by situation, spin-direction clocks and game-by-game arm angle and velo trends, so a pitching coach can spot fatigue or mechanical drift between starts.
- Trained an XGBoost Stuff model on pitch physics with SHAP; testing it against CSW% showed CSW% matched it over a full season (r 0.186 vs 0.184), pointing to a Stuff + CSW% blend next.

### FIFA × NBA – Plus-Minus Modeling for Soccer Players | Python, scikit-learn, Dash, Plotly, GCP
- Defined NBA Plus-Minus metrics for soccer as Offensive/Defensive Plus-Minus, integrating 25K+ FIFA player records across 5 seasons into a cross-sport benchmarking dataset for player-valuation modeling.
- Engineered 20+ statistical and contextual features with Pandas and Scikit-learn, applying PCA to reduce dimensionality and lift downstream model interpretability.
- Trained Multivariate Linear Regression models reaching ~0.85 R² on market-value prediction across player positions.
- Deployed an interactive comparison dashboard on Dash, Plotly, and GCP, enabling dynamic player-performance tracking and side-by-side league-level views.
- Translated valuation outputs into a club-side scouting and pricing framework, giving non-technical decision-makers a model-backed lens for transfer conversations.

### Action Valuation – Spatiotemporal Gradient Boosting for VAEP | Python, XGBoost, socceraction
- Trained gradient-boosted classifiers in XGBoost on 758,434 events from 380 games, predicting scoring and conceding probability within the next 10 actions from location, action type and prior actions.
- Standardized raw event logs into SPADL, a one-row-per-action schema with x/y coordinates on a 105 x 68 m grid, so models trained on any data provider used the same features.
- Blocked evaluation leakage via cross-fitting so no game was scored by its own model; reached AUC 0.795, calibration within 0.5 points and 0.768 rank correlation with real standings.

### EcoPolitical Understanding – R Dashboard with World Bank, V-Dem and IMF Data | R, Parquet, Shiny (shinylive)
- Engineered a config-driven ETL pipeline in R merging World Bank, IMF World Economic Outlook and V-Dem data into 4,355 observations spanning 64 indicators across 12 economic and governance categories, driven from a single CSV configuration.
- Added a validation layer computing per-indicator coverage and data vintage, flagging sparse series before they reach a chart.
- Published a Shiny dashboard compiled to WebAssembly with shinylive on static hosting, so readers can trace India's economic and governance indicators over time without a server.

## CERTIFICATIONS, PUBLICATIONS & VOLUNTEER EXPERIENCE
### Certifications
Microsoft Azure — ML Pipelines | Google — Data Foundations | Google Analytics (GA4) | Python for Data Science

### Publication
Sports Analytics: Soccer Player Market Value Analysis and Potential Prediction — IJREAM 7(10), January 2022 (multivariate regression, R² 0.83)

### Volunteer & Leadership
#### FIFA Club World Cup 2025, Practice Session Volunteer | June 2025 – July 2025
#### IEEE, Executive Committee Member & Computer Society Chairperson | Jan 2020 – Dec 2023
- Led IEEE student-branch and section leadership across 4 years, coordinating bi-annual event timelines and outreach across 100+ chapters in 2 states.
- Coordinated cross-functional teams of 70+ contributors across international IEEE conferences and a multi-section codefest drawing 300+ entrants.
- Managed a 25-person team building and maintaining internal web applications, lifting social-media outreach ~30% across the section.
