#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# ==================== Configuration ====================
SMTP_URL="${MAIL_SMTP_URL:-}"
USERNAME="${MAIL_USERNAME:-}"
PASSWORD="${MAIL_PASSWORD:-}"
# MAIL_FROM: Supports plain email (e.g., "user@example.com") or display name format (e.g., "Sender Name <user@example.com>")
MAIL_FROM="${MAIL_FROM:-}"
# MAIL_TO: Supports single or comma-separated multiple recipients, with optional display names
#          (e.g., "Recipient <a@example.com>, b@example.com")
MAIL_TO="${MAIL_TO:-}"
SUBJECT="${MAIL_SUBJECT:-}"

# Body content file paths (no default values)
TEXT_BODY_FILE="${MAIL_TEXT_BODY_FILE:-}"
HTML_BODY_FILE="${MAIL_HTML_BODY_FILE:-}"
# ==================================================

# Define cleanup function to ensure temporary file is always deleted
cleanup() {
    if [[ -n "${MAIL_FILE:-}" && -f "$MAIL_FILE" ]]; then
        rm -f "$MAIL_FILE"
    fi
}

# Trap EXIT, SIGHUP, SIGINT, SIGTERM to run cleanup
trap cleanup EXIT SIGHUP SIGINT SIGTERM

# Initialize temporary file early so it's tracked right away
MAIL_FILE=$(mktemp)

# Validate required variables (including SUBJECT)
MISSING_VARS=()
[[ -z "$SMTP_URL" ]] && MISSING_VARS+=("MAIL_SMTP_URL")
[[ -z "$USERNAME" ]] && MISSING_VARS+=("MAIL_USERNAME")
[[ -z "$PASSWORD" ]] && MISSING_VARS+=("MAIL_PASSWORD")
[[ -z "$MAIL_FROM" ]] && MISSING_VARS+=("MAIL_FROM")
[[ -z "$MAIL_TO" ]] && MISSING_VARS+=("MAIL_TO")
[[ -z "$SUBJECT" ]] && MISSING_VARS+=("MAIL_SUBJECT")

if (( ${#MISSING_VARS[@]} > 0 )); then
    echo "Error: Missing required environment variables: ${MISSING_VARS[*]}" >&2
    exit 1
fi

# Helper function to extract clean email address from "Display Name <email@example.com>" or "email@example.com"
# SMTP envelope commands (MAIL FROM / RCPT TO) require clean email addresses,
# whereas MIME headers (From / To) retain display names for mail client rendering.
extract_email() {
    local input="$1"
    if [[ "$input" =~ \<([^>]+)\> ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "$input" | xargs
    fi
}

ENVELOPE_FROM=$(extract_email "$MAIL_FROM")

# Parse comma-separated MAIL_TO list into --mail-rcpt argument array for curl
MAIL_RCPT_ARGS=()
IFS=',' read -ra ADDR_ARRAY <<< "$MAIL_TO"
for addr in "${ADDR_ARRAY[@]}"; do
    clean_addr=$(extract_email "$addr")
    if [[ -n "$clean_addr" ]]; then
        MAIL_RCPT_ARGS+=("--mail-rcpt" "$clean_addr")
    fi
done

if (( ${#MAIL_RCPT_ARGS[@]} == 0 )); then
    echo "Error: No valid recipient email address found in MAIL_TO." >&2
    exit 1
fi

# Read text body from file if path is provided
TEXT_BODY=""
if [[ -n "$TEXT_BODY_FILE" ]]; then
    if [[ -f "$TEXT_BODY_FILE" ]]; then
        TEXT_BODY=$(<"$TEXT_BODY_FILE")
    else
        echo "Error: Text body file not found: $TEXT_BODY_FILE" >&2
        exit 1
    fi
fi

# Read HTML body from file if path is provided
HTML_BODY=""
if [[ -n "$HTML_BODY_FILE" ]]; then
    if [[ -f "$HTML_BODY_FILE" ]]; then
        HTML_BODY=$(<"$HTML_BODY_FILE")
    else
        echo "Error: HTML body file not found: $HTML_BODY_FILE" >&2
        exit 1
    fi
fi

# Validate that at least one body file path is provided and its content is not empty
if [[ -z "$TEXT_BODY" && -z "$HTML_BODY" ]]; then
    echo "Error: Both MAIL_TEXT_BODY_FILE and MAIL_HTML_BODY_FILE cannot be empty. Please provide at least one valid file path." >&2
    exit 1
fi

echo "==> Generating email MIME structure..."

BOUNDARY="mail-boundary-$(date +%s%N)"

# 1. Write email headers
cat <<EOF > "$MAIL_FILE"
From: $MAIL_FROM
To: $MAIL_TO
Subject: $SUBJECT
MIME-Version: 1.0
EOF

# 2. Determine MIME type structure based on available content
if [[ -n "$TEXT_BODY" && -n "$HTML_BODY" ]]; then
    # Both are provided: use multipart/alternative
    echo "Content-Type: multipart/alternative; boundary=\"$BOUNDARY\"" >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"

    # Append Text Part
    echo "--$BOUNDARY" >> "$MAIL_FILE"
    echo 'Content-Type: text/plain; charset="utf-8"' >> "$MAIL_FILE"
    echo "Content-Transfer-Encoding: base64" >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"
    printf "%s" "$TEXT_BODY" | base64 >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"

    # Append HTML Part
    echo "--$BOUNDARY" >> "$MAIL_FILE"
    echo 'Content-Type: text/html; charset="utf-8"' >> "$MAIL_FILE"
    echo "Content-Transfer-Encoding: base64" >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"
    printf "%s" "$HTML_BODY" | base64 >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"

    # Close boundary
    echo "--$BOUNDARY--" >> "$MAIL_FILE"

elif [[ -n "$TEXT_BODY" ]]; then
    # Only Text is provided
    echo 'Content-Type: text/plain; charset="utf-8"' >> "$MAIL_FILE"
    echo "Content-Transfer-Encoding: base64" >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"
    printf "%s" "$TEXT_BODY" | base64 >> "$MAIL_FILE"

else
    # Only HTML is provided
    echo 'Content-Type: text/html; charset="utf-8"' >> "$MAIL_FILE"
    echo "Content-Transfer-Encoding: base64" >> "$MAIL_FILE"
    echo "" >> "$MAIL_FILE"
    printf "%s" "$HTML_BODY" | base64 >> "$MAIL_FILE"
fi

echo "==> Sending email via curl to $MAIL_TO..."

# 3. Send via curl and check exit status
set +e
curl --fail --show-error \
  --url "$SMTP_URL" \
  --user "$USERNAME:$PASSWORD" \
  --mail-from "$ENVELOPE_FROM" \
  "${MAIL_RCPT_ARGS[@]}" \
  --upload-file "$MAIL_FILE"
CURL_EXIT_CODE=$?
set -e

if (( CURL_EXIT_CODE != 0 )); then
    echo "Error: Failed to send email via curl (exit code: $CURL_EXIT_CODE)." >&2
    exit "$CURL_EXIT_CODE"
fi

echo "==> Email sent successfully!"
