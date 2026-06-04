"""Validate portfolio experience JSON specs.

Usage:
    python charts/validate_experience.py charts/data/restorefast.json
    python charts/validate_experience.py charts/data/*.json
"""

from __future__ import annotations

import json
import sys
from numbers import Real
from pathlib import Path
from typing import Any


REQUIRED_TOP_LEVEL_KEYS = [
    "output",
    "meta",
    "hero",
    "radar",
    "heatmap",
    "domain_colors",
    "bubbles",
    "outcomes",
    "storyline",
]

REQUIRED_META_KEYS = ["company", "role", "duration", "location"]

RADAR_DIMENSIONS = [
    "UI/UX",
    "Backend Dev",
    "ETL Pipelines",
    "Schema Design",
    "MCP/API",
    "RAG/Vector DB",
    "Agentic Dev",
    "CI/CD",
    "User Analytics",
]

REQUIRED_BUBBLE_KEYS = [
    "label",
    "theme",
    "ownership",
    "complexity",
    "impact",
    "maturity",
    "evidence",
]

BUBBLE_SCORE_KEYS = ["ownership", "complexity", "impact", "maturity"]

REQUIRED_DOMAIN_COLORS = {
    "AI / ML": "#dd0077",
    "Integration": "#4a0028",
    "Cloud & Infra": "#1a433b",
    "Data Engineering": "#4ec9b0",
}


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
    minimum: float,
    maximum: float,
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


def _validate_radar(errors: list[str], spec: dict[str, Any]) -> None:
    radar = spec.get("radar")
    if not isinstance(radar, dict):
        errors.append("radar must be an object.")
        return

    expected = set(RADAR_DIMENSIONS)
    actual = set(radar)
    missing = [key for key in RADAR_DIMENSIONS if key not in radar]
    extra = sorted(actual - expected)

    if missing:
        errors.append(f"radar missing fixed dimensions: {', '.join(missing)}.")
    if extra:
        errors.append(f"radar has unexpected dimensions: {', '.join(extra)}.")

    for dimension in RADAR_DIMENSIONS:
        if dimension in radar:
            _check_score(errors, radar[dimension], f"radar.{dimension}", 0, 10)


def _validate_heatmap(errors: list[str], spec: dict[str, Any]) -> None:
    heatmap = spec.get("heatmap")
    if not isinstance(heatmap, dict):
        errors.append("heatmap must be an object.")
        return

    systems = heatmap.get("systems")
    capabilities = heatmap.get("capabilities")
    z_matrix = heatmap.get("z")

    if not isinstance(systems, list) or not systems:
        errors.append("heatmap.systems must be a non-empty list.")
        systems = []
    elif not all(_is_non_empty_string(system) for system in systems):
        errors.append("heatmap.systems must contain only non-empty strings.")

    if not isinstance(capabilities, list) or not capabilities:
        errors.append("heatmap.capabilities must be a non-empty list.")
        capabilities = []
    elif not all(_is_non_empty_string(capability) for capability in capabilities):
        errors.append("heatmap.capabilities must contain only non-empty strings.")

    if not isinstance(z_matrix, list):
        errors.append("heatmap.z must be a matrix.")
        return

    if systems and len(z_matrix) != len(systems):
        errors.append(
            "heatmap.z row count must match heatmap.systems "
            f"({len(z_matrix)} != {len(systems)})."
        )

    expected_columns = len(capabilities)
    for row_index, row in enumerate(z_matrix):
        row_path = f"heatmap.z[{row_index}]"
        if not isinstance(row, list):
            errors.append(f"{row_path} must be a list.")
            continue

        if capabilities and len(row) != expected_columns:
            errors.append(
                f"{row_path} column count must match heatmap.capabilities "
                f"({len(row)} != {expected_columns})."
            )

        for column_index, value in enumerate(row):
            _check_score(errors, value, f"{row_path}[{column_index}]", 0, 5)


def _validate_bubbles(errors: list[str], spec: dict[str, Any]) -> None:
    bubbles = spec.get("bubbles")
    if not isinstance(bubbles, list):
        errors.append("bubbles must be a list.")
        return

    for index, bubble in enumerate(bubbles):
        path = f"bubbles[{index}]"
        if not _check_required_keys(errors, bubble, REQUIRED_BUBBLE_KEYS, path):
            continue

        for key in ("label", "theme", "evidence"):
            if not _is_non_empty_string(bubble[key]):
                errors.append(f"{path}.{key} must be a non-empty string.")

        for key in BUBBLE_SCORE_KEYS:
            _check_score(errors, bubble[key], f"{path}.{key}", 0, 10)


def _validate_domain_colors(errors: list[str], spec: dict[str, Any]) -> None:
    domain_colors = spec.get("domain_colors")
    if not isinstance(domain_colors, dict):
        errors.append("domain_colors must be an object.")
        return

    for domain, expected_color in REQUIRED_DOMAIN_COLORS.items():
        actual_color = domain_colors.get(domain)
        if actual_color is None:
            errors.append(f"domain_colors missing {domain}.")
            continue

        if not isinstance(actual_color, str) or actual_color.lower() != expected_color:
            errors.append(
                f"domain_colors.{domain} must be {expected_color} "
                f"(found {actual_color!r})."
            )


def validate_experience(spec: Any) -> list[str]:
    """Return validation errors for an experience spec."""
    errors: list[str] = []

    if not isinstance(spec, dict):
        return ["experience spec must be a JSON object."]

    _check_required_keys(errors, spec, REQUIRED_TOP_LEVEL_KEYS, "root")
    _validate_meta(errors, spec)

    if "radar" in spec:
        _validate_radar(errors, spec)
    if "heatmap" in spec:
        _validate_heatmap(errors, spec)
    if "bubbles" in spec:
        _validate_bubbles(errors, spec)
    if "domain_colors" in spec:
        _validate_domain_colors(errors, spec)

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
