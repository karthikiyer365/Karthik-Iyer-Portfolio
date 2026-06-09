"""
Bake an experience notebook from a JSON data spec.

Usage:
    python charts/bake.py charts/data/restorefast.json
    python charts/bake.py charts/data/*.json        # bake several

The spec's "output" field decides where the .ipynb is written (relative to
repo root). Charts carry pre-baked outputs so the static site renderer shows
them without executing Python.

Requires plotly + pandas (project .venv):
    source .venv/bin/activate
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import builders  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def bake(spec_path):
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    out_rel = spec["output"]
    out_path = os.path.join(REPO_ROOT, out_rel)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    nb = builders.build_notebook(spec)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)

    print(f"baked {spec_path} -> {out_rel} ({len(nb['cells'])} cells)")


def main(argv):
    if len(argv) < 2:
        print("usage: python charts/bake.py <spec.json> [more.json ...]")
        return 1
    for path in argv[1:]:
        bake(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
