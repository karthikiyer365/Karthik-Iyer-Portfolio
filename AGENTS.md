# Portfolio Experience Generator Rules

Each experience JSON must use the fixed structure:

- output
- meta
- hero
- radar
- heatmap
- domain_colors
- bubbles
- outcomes
- storyline

The renderer must preserve this structure across all experiences.

## Chart rules

Radar:
- Shows capability profile.
- Uses fixed dimensions:
  - UI/UX
  - Backend Dev
  - ETL Pipelines
  - Schema Design
  - MCP/API
  - RAG/Vector DB
  - Agentic Dev
  - CI/CD
  - User Analytics
- Scores use 0-10.

Heatmap:
- Shows systems × capabilities.
- z matrix rows must match systems.
- z matrix columns must match capabilities.
- Scores use 0-5.

Bubble chart:
- Shows contribution artifacts.
- Each bubble must have:
  - label
  - theme
  - ownership
  - complexity
  - impact
  - maturity
  - evidence
- Scores use 0-10.

Domain colors:
- AI / ML: #dd0077
- Integration: #4a0028
- Cloud & Infra: #1a433b
- Data Engineering: #4ec9b0

Storyline must contain:
- Context
- Workflow
- Technical Implementation
- Outcomes

Tone:
- Portfolio-ready.
- Technical but readable.
- Avoid inflated startup language.
- Use evidence-based claims.
