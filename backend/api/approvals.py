"""DEPRECATED: Use FastAPI backend (backend.main) and POST /webhooks/creator-response or POST /api/approvals/creator-response.
REST stubs for creator response intake and approval webhooks."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from flask import Flask, request, jsonify

from services.response_router import ingest_response

app = Flask(__name__)


@app.route("/webhooks/creator-response", methods=["POST"])
def creator_response_webhook():
    """
    Ingest creator reply (e.g. from Resend inbound or manual forwarding).

    JSON body:
      - body: (required) Reply text
      - message_id: (optional) Resend/email message ID for correlation
      - from_email: (optional) Creator email
      - timestamp: (optional) ISO timestamp
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        body = data.get("body", "")
        if not body:
            return jsonify({"success": False, "error": "body required"}), 400

        result = ingest_response(
            body=body,
            message_id=data.get("message_id"),
            from_email=data.get("from_email"),
            timestamp=data.get("timestamp"),
        )
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/approvals/creator-response", methods=["POST"])
def creator_response_api():
    """Alias for creator-response webhook (REST API style)."""
    return creator_response_webhook()


@app.route("/api/approvals/status", methods=["GET"])
def approvals_status():
    """Health check for approval service."""
    return jsonify({"status": "ok", "service": "approvals"})


def run(host: str = "127.0.0.1", port: int = 5050, debug: bool = False) -> None:
    """Run the approvals API server."""
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    run(port=5050)
