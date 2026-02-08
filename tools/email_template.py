"""HTML email template for outreach messages."""

import html


def render_email_html(
    body: str,
    brand_name: str = "Hudey",
    creator_name: str = "",
    reply_to: str = "",
) -> str:
    """Render an outreach email body into a clean, mobile-responsive HTML template.

    Args:
        body: Plain text email body (newlines become paragraphs)
        brand_name: Brand name shown in header
        creator_name: Creator's name (used for greeting if not already in body)
        reply_to: Email address for the reply button

    Returns:
        Complete HTML string ready for Resend
    """
    # Convert plain text to HTML paragraphs
    escaped = html.escape(body)
    paragraphs = [
        f"<p style=\"margin:0 0 16px 0;line-height:1.6;color:#1c1917;font-size:15px;\">{p.strip()}</p>"
        for p in escaped.split("\n\n")
        if p.strip()
    ]
    # If no double newlines, split on single newlines
    if len(paragraphs) <= 1:
        paragraphs = [
            f"<p style=\"margin:0 0 12px 0;line-height:1.6;color:#1c1917;font-size:15px;\">{p.strip()}</p>"
            for p in escaped.split("\n")
            if p.strip()
        ]
    body_html = "\n".join(paragraphs)

    safe_brand = html.escape(brand_name)
    safe_reply = html.escape(reply_to) if reply_to else ""
    mailto_href = f"mailto:{safe_reply}" if safe_reply else "mailto:"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{safe_brand}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafaf9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 16px 32px;border-bottom:1px solid #f5f5f4;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917;letter-spacing:0.02em;">{safe_brand}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 20px 32px;">
              {body_html}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1c1917;border-radius:8px;">
                    <a href="{mailto_href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
                      Reply to discuss
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 20px 32px;border-top:1px solid #f5f5f4;background-color:#fafaf9;">
              <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.5;">
                Sent via {safe_brand}. If you&rsquo;re not interested, simply ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
