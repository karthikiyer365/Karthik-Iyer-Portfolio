"""Build the portfolio index experience summary notebook chart."""

from __future__ import annotations

import base64
import io
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from wordcloud import WordCloud


REPO_ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_PATH = REPO_ROOT / "content/Summary.ipynb"

DOMAIN_COLORS = {
    "AI / ML": "#dd0077",
    "Integration": "#c98aa0",
    "Backend Engineering": "#b8b8b8",
    "Cloud & Infra": "#a8b8b0",
    "Data Engineering": "#88c0b4",
    "Workflow / Ops": "#4ec9b0",
}

CAREER_SIGNAL_COLORS = {
    "AI / ML": "#dd0077",
    "Analytics": "#4ec9b0",
    "ETL / Data Engineering": "#88c0b4",
    "Software Development": "#b8b8b8",
}

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

# Current portfolio "Present" endpoint for the static chart.
CURRENT_YEAR_VALUE = 2026 + (6 - 1) / 12


def _rgba(hex_color: str, alpha: float) -> str:
    c = hex_color.lstrip("#")
    r, g, b = (int(c[i : i + 2], 16) for i in (0, 2, 4))
    return f"rgba({r},{g},{b},{alpha})"


def _parse_endpoint(text: str, *, is_end: bool = False) -> float | None:
    text = text.strip()
    if text.lower() == "present":
        return CURRENT_YEAR_VALUE

    year_match = re.search(r"(20\d{2})", text)
    if not year_match:
        return None

    year = int(year_match.group(1))
    month = None
    for token in re.findall(r"[A-Za-z]+", text):
        key = token.lower()
        if key in MONTHS:
            month = MONTHS[key]
            break

    if month is None:
        return year + (0.92 if is_end else 0.08)
    return year + (month - 1) / 12


def _parse_span(duration: str) -> tuple[float, float]:
    pieces = re.split(r"\s+[\u2013-]\s+", duration)
    if len(pieces) >= 2:
        start = _parse_endpoint(pieces[0], is_end=False)
        end = _parse_endpoint(pieces[-1], is_end=True)
    else:
        start = _parse_endpoint(duration, is_end=False)
        end = _parse_endpoint(duration, is_end=True)

    if start is None and end is None:
        start, end = 2023.0, 2023.5
    elif start is None:
        start = end - 0.35
    elif end is None:
        end = start + 0.35

    if end < start:
        end = start + 0.35
    if abs(end - start) < 0.16:
        end = start + 0.35
    return start, end


AI_ML_TERMS = (
    "agent",
    "auto-grading",
    "classifier",
    "detection",
    "dimensionality",
    "elo-style",
    "hotline",
    "modeling",
    "nlp",
    "plagiarism",
    "probability",
    "recommender",
    "regression",
    "sequence",
    "sentiment",
    "social-distancing",
    "trend",
    "validation",
)

ANALYTICS_TERMS = (
    "a/b",
    "analysis",
    "analytics",
    "audit",
    "benchmarking",
    "campaign",
    "dashboard",
    "eda",
    "forecasting",
    "insights",
    "inventory",
    "market research",
    "optimization",
    "policy",
    "reconciliation",
    "reporting",
    "research",
    "support sessions",
    "tableau",
    "ticket",
)

ETL_DATA_TERMS = (
    "assignment review",
    "audio features",
    "ball-by-ball",
    "data cleaning",
    "data consolidation",
    "data engineering",
    "data modeling",
    "database",
    "databricks",
    "etl",
    "feature",
    "ingestion",
    "knowledge platform",
    "pipeline",
    "sensor",
)

SOFTWARE_TERMS = (
    "api",
    "comms",
    "connectivity",
    "cross-platform",
    "integration",
    "mcp",
    "query layer",
    "scheduling system",
    "support layer",
    "system",
    "web development",
)

WORD_CLOUD_CONCEPTS = {
    # ── Core ML ──────────────────────────────────────────────
    "ML":                    ("machine learning", "ml", "modeling", "predictive"),
    "Regression":            ("regression", "linear regression", "multivariate lr"),
    "Classification":        ("classifier", "classifiers", "classification"),
    "Clustering":            ("clustering", "cluster", "k-means", "kmeans"),
    "LSTM":                  ("lstm", "bi-lstm", "cnn-lstm"),
    "PCA":                   ("pca", "principal component", "dimensionality"),
    "Time-Series":           ("time-series", "time series", "forecasting"),
    "Statistical Modeling":  ("statistical modeling", "statistics", "probability"),
    "Feature Engineering":   ("feature engineering", "features", "feature reduction"),
    "Cross Validation":      ("cross validation", "cross-validation", "k-fold"),
    # ── AI / LLMs ────────────────────────────────────────────
    "LLMs":                  ("llm", "llms", "multi-turn llm", "large language model"),
    "RAG":                   ("rag", "retrieval augmented", "retrieval-augmented"),
    "AI Agents":             ("agent", "agents", "voice agent", "hotline agent", "compliance agent"),
    "NLP":                   ("nlp", "sentiment", "bert", "reviews"),
    "Computer Vision":       ("opencv", "computer vision", "image processing", "social-distancing"),
    "Agentic Apps":          ("agentic application", "agentic ai", "agentic"),
    "MCP Systems":           ("mcp", "mcp systems", "mcp integration"),
    "Recommendation Systems":("recommender", "recommendation", "matching"),
    # ── Frameworks & Libraries ───────────────────────────────
    "Scikit-learn":          ("scikit-learn", "sklearn"),
    "TensorFlow":            ("tensorflow",),
    "NumPy":                 ("numpy",),
    "Pandas":                ("pandas",),
    "Pinecone":              ("pinecone",),
    "Python":                ("python",),
    "SQL":                   ("sql",),
    # ── Data Engineering ─────────────────────────────────────
    "ETL Pipelines":         ("etl", "pipeline", "pipelines", "ingestion", "data consolidation"),
    "Data Engineering":      ("data engineering", "spark", "databricks", "schema", "supabase"),
    "Data Modeling":         ("data modeling", "schema design", "database", "dbms"),
    "Data Architecture":     ("data architecture", "architecture", "design"),
    "Data Cleaning":         ("data cleaning", "cleaning pipeline", "normalization"),
    "Databricks":            ("databricks",),
    "Spark":                 ("spark",),
    "MongoDB":               ("mongodb",),
    "MySQL":                 ("mysql",),
    "Supabase":              ("supabase",),
    # ── Analytics & BI ───────────────────────────────────────
    "Analytics":             ("analytics", "analysis", "insights", "reporting", "eda"),
    "Dashboards":            ("dashboard", "dashboards", "tableau", "power bi", "plotly", "dash"),
    "Sports Analytics":      ("sports analytics", "soccer", "nba", "player valuation", "ipl"),
    "Financial Analytics":   ("financial analytics", "forecasting", "reconciliation", "inventory"),
    "Tableau":               ("tableau",),
    "Power BI":              ("power bi", "powerbi"),
    "Dash / Plotly":         ("dash", "plotly"),
    "Inventory Analysis":    ("inventory analysis", "inventory"),
    "Market Research":       ("market research",),
    # ── Software & Cloud ─────────────────────────────────────
    "Workflow Automation":   ("workflow", "automation", "operations automation", "aiops"),
    "CRM Integration":       ("crm", "crms", "integration", "integrations"),
    "Cloud":                 ("aws", "gcp", "azure", "docker", "s3", "ec2", "adf"),
    "APIs":                  ("api", "apis", "query layer"),
    "Web Development":       ("web development", "web dev"),
    "Next.js":               ("next.js", "nextjs"),
    "Communication Systems": ("comms", "slack", "sms", "email", "voip"),
    # ── Domain ───────────────────────────────────────────────
    "Compliance":            ("compliance", "document expiry", "checks"),
    "Supply Chain":          ("supply chain", "resource management", "worker matching"),
    "Teaching Support":      ("teaching", "auto-grader", "support sessions"),
    "HRV Sensors":           ("hrv", "bp sensor", "sensor"),
    "OpenCV":                ("opencv",),
    "Voice Agents":          ("voice agent", "llm based voice agent"),
    "Product Usage":         ("product usage", "usage analysis"),
}

WORD_CLOUD_GROUPS = {
    "AI Agents": "AI / ML",
    "LLMs / RAG": "AI / ML",
    "Machine Learning": "AI / ML",
    "NLP": "AI / ML",
    "Computer Vision": "AI / ML",
    "Recommendation Systems": "AI / ML",
    "Statistical Modeling": "AI / ML",
    "ETL Pipelines": "ETL / Data Engineering",
    "Data Engineering": "ETL / Data Engineering",
    "Data Modeling": "ETL / Data Engineering",
    "Databricks": "ETL / Data Engineering",
    "Spark": "ETL / Data Engineering",
    "MySQL": "ETL / Data Engineering",
    "Supabase": "ETL / Data Engineering",
    "Analytics": "Analytics",
    "Dashboards": "Analytics",
    "Sports Analytics": "Analytics",
    "Financial Analytics": "Analytics",
    "Optimization": "Analytics",
    "Tableau": "Analytics",
    "Power BI": "Analytics",
    "Dash / Plotly": "Analytics",
    "Product Usage": "Analytics",
    "Market Research": "Analytics",
    "BI Reporting": "Analytics",
    "Client Dashboards": "Analytics",
    "Decision Analytics": "Analytics",
    "Inventory Analysis": "Analytics",
    "Linear Regression": "Analytics",
    "Market Value": "Analytics",
    "Tableau / Power BI": "Analytics",
    "MCP Systems": "Software Development",
    "Workflow Automation": "Software Development",
    "CRM Integration": "Software Development",
    "Cloud": "Software Development",
    "Compliance": "Software Development",
    "Supply Chain": "Software Development",
    "Next.js": "Software Development",
    "APIs": "Software Development",
    "Communication Systems": "Software Development",
    "Teaching Support": "Software Development",
    "Python": "Software Development",
    "SQL": "ETL / Data Engineering",
    "AIOps": "Software Development",
    "Agentic Apps": "AI / ML",
    "Auto-Grading": "AI / ML",
    "Bird's-Eye Logic": "AI / ML",
    "C++": "Software Development",
    "Cross Validation": "AI / ML",
    "Data Architecture": "ETL / Data Engineering",
    "Data Cleaning": "ETL / Data Engineering",
    "Data Drift": "ETL / Data Engineering",
    "DBMS": "ETL / Data Engineering",
    "Document Expiry": "Software Development",
    "Feature Engineering": "ETL / Data Engineering",
    "Git": "Software Development",
    "HRV Sensors": "AI / ML",
    "MongoDB": "ETL / Data Engineering",
    "Next.js / tRPC": "Software Development",
    "OpenCV": "AI / ML",
    "Pandas": "Analytics",
    "Project Compliance": "Software Development",
    "Resource Management": "Software Development",
    "Scikit-learn": "AI / ML",
    "Schema Design": "ETL / Data Engineering",
    "Supabase / MySQL": "ETL / Data Engineering",
    "User Registration": "Software Development",
    "Voice Agents": "AI / ML",
    "Web Development": "Software Development",
    "Worker Matching": "Software Development",
}


def _has_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def _career_signal(point: dict[str, Any], role: str) -> str:
    """Map detailed portfolio systems into clean career-growth signals."""
    domain = point["domain"]
    system_text = point["system"].lower()
    context = f"{system_text} {role.lower()}"

    if _has_any(system_text, AI_ML_TERMS):
        return "AI / ML"
    if _has_any(system_text, ETL_DATA_TERMS):
        return "ETL / Data Engineering"
    if _has_any(system_text, ANALYTICS_TERMS):
        return "Analytics"
    if _has_any(system_text, SOFTWARE_TERMS):
        return "Software Development"

    if domain == "Data Engineering":
        return "ETL / Data Engineering"
    if domain in {"Backend Engineering", "Integration", "Cloud & Infra"}:
        return "Software Development"
    if domain == "AI / ML":
        return "AI / ML" if "ml" in context or "ai" in context else "Analytics"
    return "Analytics"


def _collect_events() -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    spec_paths = sorted((REPO_ROOT / "charts/data").glob("*.json"))
    spec_paths += sorted((REPO_ROOT / "charts/data/projects").glob("*.json"))

    for path in spec_paths:
        spec = json.loads(path.read_text(encoding="utf-8"))
        start, end = _parse_span(spec["meta"]["duration"])
        center = (start + end) / 2
        duration = max(end - start, 0.25)

        for point in spec["bubble_chart"]["points"]:
            domain = point["domain"]
            if domain not in DOMAIN_COLORS:
                continue
            signal = _career_signal(point, spec["meta"]["role"])

            events.append(
                {
                    "domain": domain,
                    "signal": signal,
                    "system": point["system"],
                    "role": spec["meta"]["role"],
                    "company": spec["meta"]["company"],
                    "duration_label": spec["meta"]["duration"],
                    "center": center,
                    "duration": duration,
                    "strength": float(point["implementation_strength"]),
                }
            )

    return events


def _iter_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        strings: list[str] = []
        for item in value:
            strings.extend(_iter_strings(item))
        return strings
    if isinstance(value, dict):
        strings: list[str] = []
        for item in value.values():
            strings.extend(_iter_strings(item))
        return strings
    return []


def _notebook_source_text(path: Path) -> str:
    try:
        notebook = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return ""

    snippets = []
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") not in {"markdown", "code"}:
            continue
        snippets.append("".join(cell.get("source", [])))
    return "\n".join(snippets)


def _collect_corpus_text() -> str:
    snippets: list[str] = []

    for path in [REPO_ROOT / "content/resume.md", REPO_ROOT / "lib/personas.ts"]:
        if path.exists():
            snippets.append(path.read_text(encoding="utf-8"))

    for path in sorted((REPO_ROOT / "charts/data").glob("*.json")):
        snippets.extend(_iter_strings(json.loads(path.read_text(encoding="utf-8"))))
    for path in sorted((REPO_ROOT / "charts/data/projects").glob("*.json")):
        snippets.extend(_iter_strings(json.loads(path.read_text(encoding="utf-8"))))

    for path in sorted((REPO_ROOT / "content").rglob("*.ipynb")):
        snippets.append(_notebook_source_text(path))

    return "\n".join(snippets)


def _count_alias(text: str, alias: str) -> int:
    escaped = re.escape(alias.lower()).replace(r"\ ", r"[\s/+\-.·]+")
    pattern = rf"(?<![a-z0-9]){escaped}(?![a-z0-9])"
    return len(re.findall(pattern, text))


def _size_color(norm: float) -> str:
    """Map normalized word size (0=small → 1=large) to teal→white→pink."""
    stops: list[tuple[float, tuple[int, int, int]]] = [
        (0.0,  (0x4E, 0xC9, 0xB0)),  # vivid teal  — small
        (0.50, (0xF2, 0xF2, 0xF2)),  # near-white  — mid
        (1.0,  (0xDD, 0x00, 0x77)),  # hot pink    — dominant
    ]
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if norm <= t1:
            t = (norm - t0) / (t1 - t0)
            r = int(c0[0] + t * (c1[0] - c0[0]))
            g = int(c0[1] + t * (c1[1] - c0[1]))
            b = int(c0[2] + t * (c1[2] - c0[2]))
            return f"#{r:02x}{g:02x}{b:02x}"
    return "#dd0077"


def _word_counts(limit: int = 55) -> dict[str, int]:
    text = _collect_corpus_text().lower()
    raw = Counter(
        {
            label: sum(_count_alias(text, alias) for alias in aliases)
            for label, aliases in WORD_CLOUD_CONCEPTS.items()
        }
    )
    items = sorted(((l, c) for l, c in raw.items() if c > 0), key=lambda x: (-x[1], x[0]))
    return dict(items[:limit])


def _build_word_cloud_image(width: int = 1500, height: int = 500) -> str:
    """Render word cloud via wordcloud library → base64 PNG for Plotly layout image."""
    counts = _word_counts()
    if not counts:
        return ""
    min_c = min(counts.values())
    max_c = max(counts.values())
    spread = max(max_c - min_c, 1)

    def color_func(word: str, font_size: int, position: Any, orientation: Any,
                   random_state: Any = None, **kwargs: Any) -> str:
        norm = (counts.get(word, min_c) - min_c) / spread
        return _size_color(norm)

    wc = WordCloud(
        width=width,
        height=height,
        background_color=None,
        mode="RGBA",
        max_font_size=60,
        min_font_size=18,
        prefer_horizontal=0.80,
        margin=6,
        color_func=color_func,
        random_state=42,
        collocations=False,
    ).generate_from_frequencies(counts)

    buf = io.BytesIO()
    wc.to_image().save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ── Career-profile radar ───────────────────────────────────────────────────────

HEATMAP_EXPERIENCES: list[str] = [
    "RestoreFast",
    "GWU Teaching",
    "GWU Systems",
    "DPSY",
    "TechAnalogy",
]

HEATMAP_TECH: list[str] = [
    "Python", "SQL", "ML", "NLP", "RAG",
    "Agentic AI", "ETL", "Dashboards", "MCP / API", "Cloud",
]

# z[experience][tech] — intensity 0–10
HEATMAP_Z: list[list[float]] = [
    #  Py   SQL   ML   NLP  RAG  AgAI  ETL  Dash  MCP  Cloud
    [  9,   8,    7,   5,   9,   9,    8,   3,    9,   6  ],  # RestoreFast
    [  8,   4,    6,   9,   2,   4,    3,   4,    3,   2  ],  # GWU Teaching
    [  6,   6,    4,   3,   1,   1,    6,   8,    5,   4  ],  # GWU Systems
    [  7,   8,    4,   2,   1,   1,    8,   9,    3,   2  ],  # DPSY
    [  3,   2,    3,   2,   1,   1,    2,   7,    4,   2  ],  # TechAnalogy
]

PORTFOLIO_RADAR: dict[str, float] = {
    "Agentic AI":          7.0,
    "MCP/API Integration": 8.0,
    "RAG / Vector":        8.0,
    "ML Modeling":         8.5,
    "Deep Learning":       5.0,
    "NLP":                 6.0,
    "Cloud Compute":       4.0,
    "Data Engineering":    9.0,
    "Analytics & BI":      8.5,
    "SDE":                 7.0,
    "Workflow & Ops":      8.0,
}

_RADAR_AXIS_MAP: dict[str, str] = {
    "AI / ML":                "AI / ML",
    "LLM / NLP Eval":         "AI / ML",
    "Computer Vision":         "AI / ML",
    "NLP":                    "AI / ML",
    "Python Automation":       "AI / ML",
    "Data Engineering":        "Data Engineering",
    "Database Systems":        "Data Engineering",
    "SQL / Python":            "Data Engineering",
    "Analytics / Insights":    "Analytics & BI",
    "Dashboarding":            "Analytics & BI",
    "Financial Analytics":     "Analytics & BI",
    "Inventory Analytics":     "Analytics & BI",
    "Ticket Analytics":        "Analytics & BI",
    "User Analytics":          "Analytics & BI",
    "Campaign Analytics":      "Analytics & BI",
    "Market Research":         "Analytics & BI",
    "A/B Testing":             "Analytics & BI",
    "Forecasting":             "Analytics & BI",
    "Data Analytics":          "Analytics & BI",
    "Client Reporting":        "Analytics & BI",
    "Stakeholder Reporting":   "Analytics & BI",
    "Backend Engineering":     "Software & Cloud",
    "Cloud & Infra":           "Software & Cloud",
    "Web Development":         "Software & Cloud",
    "Data Structures":         "Software & Cloud",
    "Systems Support":         "Software & Cloud",
    "Cross-Platform Support":  "Software & Cloud",
    "Workflow / Ops":          "Workflow & Ops",
    "Workflow / Product":      "Workflow & Ops",
    "Operations / Automation": "Workflow & Ops",
    "Automation":              "Workflow & Ops",
    "SMO Strategy":            "Workflow & Ops",
    "Sales Ops":               "Workflow & Ops",
    "Account Coordination":    "Workflow & Ops",
    "Teaching Support":        "Workflow & Ops",
    "Academic Support":        "Workflow & Ops",
    "Stakeholder Alignment":   "Workflow & Ops",
    "Rubric Design":           "Workflow & Ops",
    "Systems Integration":     "Integration",
}

_ROLE_CONFIGS: list[tuple[str, str, str]] = [
    ("restorefast.json",            "RestoreFast",  "#dd0077"),
    ("dpsy.json",                   "DPSY",         "#b8b8b8"),
    ("techanalogy_smo_lead.json",   "TechAnalogy",  "#c98aa0"),
    ("gwu_systems_assistant.json",  "GWU Systems",  "#4ec9b0"),
    ("gwu_teaching_assistant.json", "GWU Teaching", "#a8b8b0"),
]


def _collect_all_radars() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for fname, label, color in _ROLE_CONFIGS:
        path = REPO_ROOT / "charts/data" / fname
        if not path.exists():
            continue
        raw = json.loads(path.read_text(encoding="utf-8")).get("radar", {})
        mapped: dict[str, float] = {ax: 0.0 for ax in COMMON_RADAR_AXES}
        for raw_axis, val in raw.items():
            common = _RADAR_AXIS_MAP.get(raw_axis)
            if common:
                mapped[common] = max(mapped[common], float(val))
        for ax in COMMON_RADAR_AXES:
            if mapped[ax] == 0.0:
                mapped[ax] = 2.0
        results.append({"label": label, "color": color, "values": mapped})
    return results


def build_chart() -> go.Figure:
    """Return the index chart: KDE timeline (top) + radar (bottom-left) + heatmap (bottom-right)."""
    events = _collect_events()

    x_grid = np.linspace(2018, CURRENT_YEAR_VALUE + 0.15, 460)
    signal_order = list(CAREER_SIGNAL_COLORS.keys())
    density_by_signal: dict[str, np.ndarray] = {}

    for signal in signal_order:
        density = np.zeros_like(x_grid)
        for event in [e for e in events if e["signal"] == signal]:
            sigma = max(0.45, min(1.10, event["duration"] / 2.2))
            weight = event["strength"] * (0.8 + min(event["duration"], 2.2) * 0.18)
            density += weight * np.exp(-0.5 * ((x_grid - event["center"]) / sigma) ** 2)
        density_by_signal[signal] = density

    # Stacked single column so panels read top-to-bottom on narrow screens
    # instead of squishing side by side.
    fig = make_subplots(
        rows=3,
        cols=1,
        specs=[
            [{"type": "xy"}],
            [{"type": "polar"}],
            [{"type": "xy"}],
        ],
        row_heights=[0.30, 0.36, 0.34],
        vertical_spacing=0.05,
    )

    # ── KDE career-signal traces (row 1, full width) ──────────────────────────
    for signal in signal_order:
        color = CAREER_SIGNAL_COLORS[signal]
        raw_density = density_by_signal[signal]
        signal_max = float(raw_density.max())
        density = raw_density / signal_max if signal_max > 0 else raw_density
        signal_count = sum(1 for event in events if event["signal"] == signal)

        fig.add_trace(
            go.Scatter(
                x=x_grid,
                y=density,
                mode="lines",
                line=dict(color=color, width=2.8),
                fill="tozeroy",
                fillcolor=_rgba(color, 0.18),
                name=signal,
                legendgroup=signal,
                hovertemplate=(
                    "%{x:.1f}<br>Normalized density: %{y:.2f}"
                    f"<br>{signal_count} portfolio systems<extra>{signal}</extra>"
                ),
            ),
            row=1, col=1,
        )

    label_x = {
        "Software Development": 2020.35,
        "ETL / Data Engineering": 2022.25,
        "Analytics": 2023.25,
        "AI / ML": 2024.75,
    }
    for signal, x in label_x.items():
        color = CAREER_SIGNAL_COLORS[signal]
        raw_density = density_by_signal[signal]
        signal_max = float(raw_density.max())
        density = raw_density / signal_max if signal_max > 0 else raw_density
        y = float(np.interp(x, x_grid, density))
        fig.add_annotation(
            x=x,
            y=min(y + 0.045, 1.03),
            xref="x",
            yref="y",
            text=signal.replace(" / ", " /<br>"),
            showarrow=False,
            font=dict(size=10, color=color),
        )

    for year in [2022, 2023, 2025]:
        fig.add_shape(
            type="line",
            x0=year, x1=year, y0=0, y1=1.08,
            xref="x", yref="y",
            line=dict(color="rgba(255,255,255,0.14)", width=1, dash="dot"),
            row=1, col=1,
        )

    # ── Single portfolio radar (row 2, col 1) ─────────────────────────────────
    radar_axes = list(PORTFOLIO_RADAR.keys())
    radar_vals = list(PORTFOLIO_RADAR.values())
    axes_closed = radar_axes + [radar_axes[0]]
    vals_closed = radar_vals + [radar_vals[0]]
    fig.add_trace(
        go.Scatterpolar(
            r=vals_closed,
            theta=axes_closed,
            fill="toself",
            fillcolor=_rgba("#dd0077", 0.15),
            line=dict(color="#dd0077", width=2.2),
            showlegend=False,
            hovertemplate="%{theta}: %{r:.1f} / 10<extra></extra>",
        ),
        row=2, col=1,
    )

    # ── Experience × Tech Stack heatmap (row 2, col 2) ────────────────────────
    z_display = list(reversed(HEATMAP_Z))
    y_display = list(reversed(HEATMAP_EXPERIENCES))
    fig.add_trace(
        go.Heatmap(
            z=z_display,
            x=HEATMAP_TECH,
            y=y_display,
            zmin=0,
            zmax=10,
            colorscale=[
                [0.0,  "#111111"],
                [0.30, "#0a2e28"],
                [0.65, "#1f7a68"],
                [1.0,  "#4ec9b0"],
            ],
            xgap=3,
            ygap=3,
            showscale=False,
            hovertemplate="%{y} × %{x}: %{z}/10<extra></extra>",
        ),
        row=3, col=1,
    )

    # ── Axis styling ──────────────────────────────────────────────────────────
    fig.update_polars(
        bgcolor="rgba(0,0,0,0)",
        radialaxis=dict(
            visible=True,
            range=[0, 10],
            showticklabels=False,
            ticks="",
            gridcolor="rgba(255,255,255,0.10)",
            linecolor="rgba(255,255,255,0.10)",
        ),
        angularaxis=dict(
            tickfont=dict(size=11, color="#cfcfcf"),
            linecolor="rgba(255,255,255,0.10)",
            gridcolor="rgba(255,255,255,0.08)",
            direction="clockwise",
            rotation=90,
        ),
    )

    fig.update_xaxes(
        row=1, col=1,
        range=[2019, CURRENT_YEAR_VALUE + 0.18],
        tickmode="array",
        tickvals=list(range(2019, 2027)),
        ticktext=[str(y) for y in range(2019, 2027)],
        title_text="Career timeline",
        title_font=dict(size=14, color="#bfbfbf"),
        tickfont=dict(size=13, color="#cfcfcf"),
        showgrid=True, gridcolor="rgba(255,255,255,0.07)",
        zeroline=False, linecolor="rgba(255,255,255,0.16)",
        automargin=True,
    )
    fig.update_yaxes(
        row=1, col=1,
        range=[-0.03, 1.08],
        tickmode="array",
        tickvals=[0, 0.25, 0.5, 0.75, 1.0],
        ticktext=["0", ".25", ".5", ".75", "1"],
        title_text="Relative career signal",
        title_font=dict(size=14, color="#bfbfbf"),
        tickfont=dict(size=13, color="#d8d8d8"),
        showgrid=True, gridcolor="rgba(255,255,255,0.07)",
        zeroline=False, linecolor="rgba(255,255,255,0.16)",
        automargin=True,
    )

    fig.update_xaxes(
        row=3, col=1,
        tickfont=dict(size=12, color="#cfcfcf"),
        tickangle=-35,
        showgrid=False,
        linecolor="rgba(255,255,255,0.10)",
        zeroline=False,
    )
    fig.update_yaxes(
        row=3, col=1,
        tickfont=dict(size=12, color="#cfcfcf"),
        showgrid=False,
        linecolor="rgba(255,255,255,0.10)",
        zeroline=False,
    )

    fig.update_layout(
        height=1050,
        paper_bgcolor="#111111",
        plot_bgcolor="#111111",
        title=dict(
            text="Technical Involvement",
            x=0.5, y=0.985,
            font=dict(size=18, color="#f0f0f0"),
        ),
        font=dict(family="Helvetica, Arial, sans-serif", color="#e5e5e5", size=14),
        margin=dict(l=50, r=50, t=48, b=10, autoexpand=True),
        showlegend=False,
        hoverlabel=dict(
            bgcolor="#1b1b1b",
            bordercolor="#333333",
            font=dict(color="#f5f5f5", size=11),
        ),
    )
    return fig


def _html_output(fig: go.Figure) -> dict[str, Any]:
    inner = fig.to_html(
        include_plotlyjs="cdn",
        full_html=False,
        div_id="experience-signal-map",
        default_width="100%",
        default_height="1050px",
        config={"responsive": True, "displayModeBar": False},
    )
    html = f'<div style="width:100%;padding:0 10px;box-sizing:border-box">{inner}</div>'
    return {
        "output_type": "display_data",
        "metadata": {},
        "data": {"text/html": html.splitlines(keepends=True)},
    }


def _source_lines(source: str) -> list[str]:
    return source.splitlines(keepends=True)


_BASE = "portfolio/experiences"

def _enc(name: str) -> str:
    """Percent-encode spaces and & for use in markdown link URLs."""
    return name.replace(" ", "%20").replace("&", "%26")

def _role_line(role: str, company: str, filename: str) -> str:
    url = f"{_BASE}/{_enc(filename)}"
    return f"### [{role}]({url}) · [{company}]({url})\n"

_ROLES_SOURCE = [
    "## Roles\n",
    "\n",
    _role_line("AI & Data Engineer", "RestoreFast", "AI & Data Engineer - RestoreFast.ipynb"),
    "\n",
    _role_line("Teaching Assistant", "George Washington University", "Teaching Assistant - GWU.ipynb"),
    "\n",
    _role_line("Technical Systems Admin", "George Washington University", "Technical Systems Admin - GWU.ipynb"),
    "\n",
    _role_line("Financial Analyst", "DPSY & Associates", "Financial Analyst - DPSY & Associates.ipynb"),
    "\n",
    _role_line("SMO Lead", "TechAnalogy", "SMO Lead - TechAnalogy.ipynb"),
]


def build_index_notebook() -> None:
    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))

    notebook["cells"] = [
        notebook["cells"][0],
        notebook["cells"][1],
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "### Overview\n",
                "\n",
                "This summary maps my portfolio across AI systems, data engineering, "
                "analytics, integration work, and workflow operations. The chart below "
                "combines an overlaid career-growth KDE with a concept cloud generated "
                "from my CV and portfolio source files.\n",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": _source_lines(
                "from charts.build_index_summary import build_chart\n"
            ),
        },
        {
            "cell_type": "code",
            "execution_count": 1,
            "metadata": {},
            "outputs": [_html_output(build_chart())],
            "source": _source_lines("fig = build_chart()\nfig.show()\n"),
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": _ROLES_SOURCE,
        },
    ]

    NOTEBOOK_PATH.write_text(json.dumps(notebook, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    build_index_notebook()
