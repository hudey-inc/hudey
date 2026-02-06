#!/usr/bin/env python3
"""
Campaign brief intake - validates JSON against CampaignBrief schema.

Usage:
  python tools/intake_brief.py .tmp/brief.json
  python tools/intake_brief.py --stdin < .tmp/brief.json
"""

import argparse
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.brief import CampaignBrief


def load_and_validate(json_content: str) -> CampaignBrief:
    """Parse JSON and validate against CampaignBrief schema."""
    data = json.loads(json_content)
    return CampaignBrief(**data)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate and load a campaign brief from JSON"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("file", nargs="?", help="Path to JSON brief file")
    group.add_argument("--stdin", action="store_true", help="Read JSON from stdin")
    parser.add_argument(
        "--output",
        "-o",
        help="Save validated brief to this path (default: overwrite input)",
    )
    args = parser.parse_args()

    if args.stdin:
        content = sys.stdin.read()
        output_path = args.output or Path(".tmp", "validated_brief.json")
    else:
        path = Path(args.file)
        if not path.exists():
            print(f"Error: File not found: {path}", file=sys.stderr)
            return 1
        content = path.read_text()
        output_path = Path(args.output) if args.output else path

    try:
        brief = load_and_validate(content)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Validation error: {e}", file=sys.stderr)
        return 1

    # Save validated brief (ensures output dir exists)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(brief.model_dump_json(indent=2))
    print(str(output_path.resolve()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
