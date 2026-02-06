#!/usr/bin/env python3
"""
Simulate creator response for testing the negotiation flow.

Usage:
  python tools/simulate_response.py --campaign abc123 --creator mock_1 --body "Yes! I can do 1 reel for £120"
  python tools/simulate_response.py --email creator@example.com --body "Interested!"
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.response_router import ingest_response


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Simulate a creator response for testing negotiation"
    )
    parser.add_argument("--body", "-b", required=True, help="Reply text from creator")
    parser.add_argument("--message-id", "-m", help="Resend message ID for lookup")
    parser.add_argument("--email", "-e", help="Creator email (fallback if no message_id)")
    parser.add_argument("--campaign", "-c", help="Campaign ID (with --creator for sim ID)")
    parser.add_argument("--creator", "-r", help="Creator ID (with --campaign for sim ID)")
    args = parser.parse_args()

    message_id = args.message_id
    if not message_id and args.campaign and args.creator:
        message_id = f"sim_{args.campaign}_{args.creator}"

    result = ingest_response(
        args.body,
        message_id=message_id or None,
        from_email=args.email or None,
    )

    if result.get("success"):
        print(json.dumps(result, indent=2))
        return 0

    print(f"Error: {result.get('error', 'Unknown')}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
