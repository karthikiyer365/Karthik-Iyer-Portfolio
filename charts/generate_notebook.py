"""Generate one pre-rendered experience notebook from a JSON spec.

Usage:
    python charts/generate_notebook.py charts/data/restorefast.json
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import builders  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parents[1]


def output_path_for_spec(spec: dict) -> Path:
    output = spec["output"]
    path = Path(output)
    if path.is_absolute():
        return path
    return REPO_ROOT / path


def generate_notebook(spec_path: str | Path) -> Path:
    spec_path = Path(spec_path)
    with spec_path.open("r", encoding="utf-8") as handle:
        spec = json.load(handle)

    output_path = output_path_for_spec(spec)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    notebook = builders.build_notebook(spec)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(notebook, handle, indent=1, ensure_ascii=False)

    return output_path


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: python charts/generate_notebook.py <experience.json>")
        return 2

    output_path = generate_notebook(argv[1])
    try:
        display_path = output_path.relative_to(REPO_ROOT)
    except ValueError:
        display_path = output_path
    print(f"generated {display_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
