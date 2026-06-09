# Portfolio Experience Generator Rules

Use this file as the structural contract for every generated experience notebook. The content changes per experience; the JSON shape, chart types, color order, and narrative placement rules do not.

## Fixed Top-Level Shape

Every experience JSON must use these keys:

- output
- meta
- hero
- domain_colors
- radar
- bubble_chart
- network_graph
- outcomes
- storyline

The notebook render order is:

- Hero markdown
- Radar / spider chart
- Clustered bubble chart in the same chart iframe as the radar
- Tri-partite graph
- Outcomes table
- Storyline markdown

Do not replace this structure with a heatmap, XY bubble chart, separate contribution chart, or a different graph sequence.

## Field Contract

`output`:
- Relative `.ipynb` destination.
- Should point under `content/experiences/`.

`meta`:
- Object with `company`, `role`, `duration`, and `location`.
- Values should be display-ready strings.

`hero`:
- Markdown string.
- Required structure:
  - H1 title
  - bold duration/location line
  - `## Hero Overview`
  - one or two concise overview paragraphs
- Purpose: frame the experience and summarize the main technical surface area.

`domain_colors`:
- Object whose insertion order controls the chart color ramp.
- Default order and values:
  - `AI / ML`: `#dd0077`
  - `Integration`: `#c98aa0`
  - `Backend Engineering`: `#b8b8b8`
  - `Cloud & Infra`: `#a8b8b0`
  - `Data Engineering`: `#88c0b4`
  - `Workflow / Ops`: `#4ec9b0`
- The renderer maps this ordered domain list onto the pink -> grey -> green ramp.

`radar`:
- Object mapping capability labels to numeric scores.
- Scores use 0-10.
- Purpose: summarize capability emphasis, not list every tool.
- Labels should be short, broad, and chart-readable.

`bubble_chart`:
- Object for clustered D3 pack layout.
- Required metadata:
  - `x_axis`: `"system"`
  - `y_axis`: `"ownership"`
  - `size_metric`: `"implementation_strength"`
  - `color_metric`: `"domain"`
- `points` is an array of system/contribution clusters.
- Each point must contain:
  - `system`
  - `domain`
  - `ownership`
  - `implementation_strength`
  - `complexity`
  - `impact`
  - `maturity`
  - `subsystems`
  - `evidence`
- Scores use 0-10.
- `implementation_strength` drives visible bubble radius.

`network_graph`:
- Object for the tri-partite graph.
- Required keys:
  - `title`
  - `description`
  - `nodes`
  - `edges`
- Node columns:
  - systems
  - concepts
  - tools
- System node shape: `id`, `type: "system"`, `domain`.
- Concept node shape: `id`, `type: "concept"`, `domain`.
- Tool node shape: `id`, `type: "tool"`, `category`.
- Edge shape: `source`, `target`, `weight`.
- Valid edge paths:
  - system -> concept
  - concept -> tool
- Typical edge weights: 1-3.

`outcomes`:
- Object mapping short metric labels to compact values.
- Purpose: render a two-column evidence table.
- Keep labels concise and values scan-friendly.

`storyline`:
- Markdown string.
- Required sections:
  - `## Context`
  - `## Workflow`
  - `## Technical Implementation`
  - `## Outcomes`
- Purpose: explain the work in narrative form after the charts.

## Content Rules

Hero:
- Use broad framing.
- Mention the kind of systems built and the environment they served.
- Avoid implementation detail that belongs in the storyline.

Radar:
- Score capability intensity.
- Do not encode tools directly unless a tool category is the capability.

Bubble chart:
- Use systems or contribution clusters as bubbles.
- Each bubble should be a meaningful work package, not a tiny task.
- Evidence should explain why the system matters.

Network graph:
- Use system nodes for delivered artifacts.
- Use concept nodes for architectural/capability ideas.
- Use tool nodes for concrete technologies, platforms, languages, or services.
- Keep labels compact enough to fit the graph.

Outcomes:
- Use measurable or clearly observable results.
- Avoid unsupported claims.

Storyline:
- Context explains the problem space.
- Workflow explains how work moved through the system.
- Technical Implementation explains how the work was built.
- Outcomes explains what changed because of the work.

## Tone

Use:
- technical but readable language
- evidence-backed claims
- concise system names
- concrete verbs
- portfolio-ready phrasing

Avoid:
- inflated claims
- generic hype
- unsupported metrics
- vague filler
- overexplaining obvious implementation details
