#!/usr/bin/env python3
"""
Example tool — template for WAT framework scripts.

- Loads config from .env
- Does deterministic work (no AI reasoning)
- Can be run directly or invoked by an agent following a workflow
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def main() -> None:
    """Run the tool."""
    # Example: read a value from .env (optional keys are fine)
    api_key = os.getenv("API_KEY", "")
    if api_key:
        print("API_KEY is set")
    else:
        print("API_KEY not set — add it to .env when needed")

    # Tool logic goes here
    print("Example tool ran successfully.")


if __name__ == "__main__":
    main()
