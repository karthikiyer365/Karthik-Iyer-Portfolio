"""Validate portfolio experience JSON specs.

Usage:
    python charts/validate_experience.py charts/data/restorefast.json
    python charts/validate_experience.py charts/data/*.json
"""

from __future__ import annotations

import json
import re
import sys
from numbers import Real
from pathlib import Path
from typing import Any


REQUIRED_TOP_LEVEL_KEYS = [
    "output",
    "meta",
    "hero",
    "domain_colors",
    "radar",
    "bubble_chart",
    "network_graph",
    "outcomes",
    "storyline",
]

REQUIRED_META_KEYS = ["company", "role", "duration", "location"]

DOMAIN_COLOR_ORDER = [
    ("AI / ML", "#dd0077"),
    ("Integration", "#c98aa0"),
    ("Backend Engineering", "#b8b8b8"),
    ("Cloud & Infra", "#a8b8b0"),
    ("Data Engineering", "#88c0b4"),
    ("Workflow / Ops", "#4ec9b0"),
]

REQUIRED_BUBBLE_CHART_KEYS = [
    "x_axis",
    "y_axis",
    "size_metric",
    "color_metric",
    "points",
]

REQUIRED_BUBBLE_POINT_KEYS = [
    "system",
    "domain",
    "ownership",
    "implementation_strength",
    "complexity",
    "impact",
    "maturity",
    "subsystems",
    "evidence",
]

BUBBLE_SCORE_KEYS = [
    "ownership",
    "implementation_strength",
    "complexity",
    "impact",
    "maturity",
]

REQUIRED_NETWORK_KEYS = ["title", "description", "nodes", "edges"]
NETWORK_NODE_TYPES = {"system", "concept", "tool"}

STORYLINE_SECTIONS = [
    "Context",
    "Workflow",
    "Technical Implementation",
    "Outcomes",
]


def _is_number(value: Any) -> bool:
    return isinstance(value, Real) and not isinstance(value, bool)


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _check_required_keys(
    errors: list[str],
    obj: Any,
    required_keys: list[str],
    path: str,
) -> bool:
    if not isinstance(obj, dict):
        errors.append(f"{path} must be an object.")
        return False

    missing = [key for key in required_keys if key not in obj]
    if missing:
        errors.append(f"{path} missing required keys: {', '.join(missing)}.")

    return not missing


def _check_score(
    errors: list[str],
    value: Any,
    path: str,
    minimum: float = 0,
    maximum: float = 10,
) -> None:
    if not _is_number(value):
        errors.append(f"{path} must be a number.")
        return

    if value < minimum or value > maximum:
        errors.append(f"{path} must be between {minimum:g} and {maximum:g}.")


def _validate_meta(errors: list[str], spec: dict[str, Any]) -> None:
    meta = spec.get("meta")
    if not _check_required_keys(errors, meta, REQUIRED_META_KEYS, "meta"):
        return

    for key in REQUIRED_META_KEYS:
        if not _is_non_empty_string(meta[key]):
            errors.append(f"meta.{key} must be a non-empty string.")


def _validate_hero(errors: list[str], spec: dict[str, Any]) -> None:
    hero = spec.get("hero")
    if not _is_non_empty_string(hero):
        errors.append("hero must be a non-empty markdown string.")
        return

    if not hero.lstrip().startswith("# "):
        errors.append("hero must start with an H1 markdown heading.")
    if "## Hero Overview" not in hero:
        errors.append("hero must contain a `## Hero Overview` section.")


def _validate_domain_colors(errors: list[str], spec: dict[str, Any]) -> None:
    domain_colors = spec.get("domain_colors")
    if not isinstance(domain_colors, dict):
        errors.append("domain_colors must be an object.")
        return

    actual_order = list(domain_colors.keys())
    expected_order = [domain for domain, _ in DOMAIN_COLOR_ORDER]
    if actual_order != expected_order:
        errors.append(
            "domain_colors must preserve the finalized domain order: "
            + ", ".join(expected_order)
            + "."
        )

    for domain, expected_color in DOMAIN_COLOR_ORDER:
        actual_color = domain_colors.get(domain)
        if actual_color is None:
            errors.append(f"domain_colors missing {domain}.")
            continue
        if not isinstance(actual_color, str) or actual_color.lower() != expected_color:
            errors.append(
                f"domain_colors.{domain} must be {expected_color} "
                f"(found {actual_color!r})."
            )


def _validate_radar(errors: list[str], spec: dict[str, Any]) -> None:
    radar = spec.get("radar")
    if not isinstance(radar, dict) or not radar:
        errors.append("radar must be a non-empty object.")
        return

    if len(radar) > 10:
        errors.append("radar should stay readable with 10 or fewer dimensions.")

    for dimension, score in radar.items():
        if not _is_non_empty_string(dimension):
            errors.append("radar dimension names must be non-empty strings.")
            continue
        _check_score(errors, score, f"radar.{dimension}")


def _validate_bubble_chart(errors: list[str], spec: dict[str, Any]) -> None:
    bubble_chart = spec.get("bubble_chart")
    if not _check_required_keys(
        errors,
        bubble_chart,
        REQUIRED_BUBBLE_CHART_KEYS,
        "bubble_chart",
    ):
        return

    expected_metadata = {
        "x_axis": "system",
        "y_axis": "ownership",
        "size_metric": "implementation_strength",
        "color_metric": "domain",
    }
    for key, expected_value in expected_metadata.items():
        if bubble_chart.get(key) != expected_value:
            errors.append(f"bubble_chart.{key} must be {expected_value!r}.")

    points = bubble_chart.get("points")
    if not isinstance(points, list) or not points:
        errors.append("bubble_chart.points must be a non-empty list.")
        return

    domains = set(spec.get("domain_colors", {}).keys())
    for index, point in enumerate(points):
        path = f"bubble_chart.points[{index}]"
        if not _check_required_keys(errors, point, REQUIRED_BUBBLE_POINT_KEYS, path):
            continue

        for key in ("system", "domain", "evidence"):
            if not _is_non_empty_string(point[key]):
                errors.append(f"{path}.{key} must be a non-empty string.")

        if domains and point["domain"] not in domains:
            errors.append(f"{path}.domain must exist in domain_colors.")

        subsystems = point["subsystems"]
        if not isinstance(subsystems, list) or not subsystems:
            errors.append(f"{path}.subsystems must be a non-empty list.")
        elif not all(_is_non_empty_string(item) for item in subsystems):
            errors.append(f"{path}.subsystems must contain only non-empty strings.")

        for key in BUBBLE_SCORE_KEYS:
            _check_score(errors, point[key], f"{path}.{key}")


def _validate_network_graph(errors: list[str], spec: dict[str, Any]) -> None:
    network = spec.get("network_graph")
    if not _check_required_keys(errors, network, REQUIRED_NETWORK_KEYS, "network_graph"):
        return

    for key in ("title", "description"):
        if not _is_non_empty_string(network[key]):
            errors.append(f"network_graph.{key} must be a non-empty string.")

    nodes = network.get("nodes")
    edges = network.get("edges")
    if not isinstance(nodes, list) or not nodes:
        errors.append("network_graph.nodes must be a non-empty list.")
        nodes = []
    if not isinstance(edges, list) or not edges:
        errors.append("network_graph.edges must be a non-empty list.")
        edges = []

    node_ids: set[str] = set()
    seen_types: set[str] = set()
    domains = set(spec.get("domain_colors", {}).keys())

    for index, node in enumerate(nodes):
        path = f"network_graph.nodes[{index}]"
        if not isinstance(node, dict):
            errors.append(f"{path} must be an object.")
            continue

        node_id = node.get("id")
        node_type = node.get("type")
        if not _is_non_empty_string(node_id):
            errors.append(f"{path}.id must be a non-empty string.")
        elif node_id in node_ids:
            errors.append(f"{path}.id duplicates an earlier node id.")
        else:
            node_ids.add(node_id)

        if node_type not in NETWORK_NODE_TYPES:
            errors.append(f"{path}.type must be one of: system, concept, tool.")
            continue
        seen_types.add(node_type)

        if node_type in {"system", "concept"}:
            domain = node.get("domain")
            if not _is_non_empty_string(domain):
                errors.append(f"{path}.domain must be a non-empty string.")
            elif domains and domain not in domains:
                errors.append(f"{path}.domain must exist in domain_colors.")

        if node_type == "tool" and not _is_non_empty_string(node.get("category")):
            errors.append(f"{path}.category must be a non-empty string.")

    missing_types = NETWORK_NODE_TYPES - seen_types
    if missing_types:
        errors.append(
            "network_graph.nodes must include all three node types: "
            + ", ".join(sorted(NETWORK_NODE_TYPES))
            + "."
        )

    node_type_by_id = {
        node.get("id"): node.get("type")
        for node in nodes
        if isinstance(node, dict) and _is_non_empty_string(node.get("id"))
    }

    for index, edge in enumerate(edges):
        path = f"network_graph.edges[{index}]"
        if not isinstance(edge, dict):
            errors.append(f"{path} must be an object.")
            continue

        source = edge.get("source")
        target = edge.get("target")
        if source not in node_ids:
            errors.append(f"{path}.source must reference an existing node id.")
        if target not in node_ids:
            errors.append(f"{path}.target must reference an existing node id.")

        source_type = node_type_by_id.get(source)
        target_type = node_type_by_id.get(target)
        valid_pair = (
            (source_type == "system" and target_type == "concept")
            or (source_type == "concept" and target_type == "tool")
        )
        if source_type and target_type and not valid_pair:
            errors.append(
                f"{path} must connect system -> concept or concept -> tool."
            )

        weight = edge.get("weight")
        if not _is_number(weight):
            errors.append(f"{path}.weight must be a number.")
        elif weight < 1 or weight > 3:
            errors.append(f"{path}.weight should be between 1 and 3.")


def _validate_outcomes(errors: list[str], spec: dict[str, Any]) -> None:
    outcomes = spec.get("outcomes")
    if not isinstance(outcomes, dict) or not outcomes:
        errors.append("outcomes must be a non-empty object.")
        return

    for key, value in outcomes.items():
        if not _is_non_empty_string(key):
            errors.append("outcomes metric labels must be non-empty strings.")
        if not _is_non_empty_string(value):
            errors.append(f"outcomes.{key} must be a non-empty string.")


def _validate_storyline(errors: list[str], spec: dict[str, Any]) -> None:
    storyline = spec.get("storyline")
    if not _is_non_empty_string(storyline):
        errors.append("storyline must be a non-empty markdown string.")
        return

    for section in STORYLINE_SECTIONS:
        pattern = rf"^##\s+{re.escape(section)}\s*$"
        if not re.search(pattern, storyline, flags=re.MULTILINE):
            errors.append(f"storyline must contain `## {section}`.")


def validate_experience(spec: Any) -> list[str]:
    """Return validation errors for an experience spec."""
    errors: list[str] = []

    if not isinstance(spec, dict):
        return ["experience spec must be a JSON object."]

    _check_required_keys(errors, spec, REQUIRED_TOP_LEVEL_KEYS, "root")
    _validate_meta(errors, spec)
    _validate_hero(errors, spec)
    _validate_domain_colors(errors, spec)
    _validate_radar(errors, spec)
    _validate_bubble_chart(errors, spec)
    _validate_network_graph(errors, spec)
    _validate_outcomes(errors, spec)
    _validate_storyline(errors, spec)

    return errors


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: python charts/validate_experience.py <spec.json> [more.json ...]")
        return 2

    has_errors = False
    for raw_path in argv[1:]:
        path = Path(raw_path)
        try:
            spec = _load_json(path)
        except (OSError, json.JSONDecodeError) as exc:
            has_errors = True
            print(f"{path}: unable to load JSON: {exc}")
            continue

        errors = validate_experience(spec)
        if errors:
            has_errors = True
            print(f"{path}: FAIL")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"{path}: OK")

    return 1 if has_errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
