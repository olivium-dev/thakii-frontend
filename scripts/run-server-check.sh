#!/usr/bin/env bash
# Run server diagnostics from your machine via Cloudflare Access SSH.
# Usage: from repo root:  bash scripts/run-server-check.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="$SCRIPT_DIR/check-server.sh"

if [ ! -f "$CHECK_SCRIPT" ]; then
  echo "Error: $CHECK_SCRIPT not found."
  exit 1
fi

echo "Running server diagnostics via Cloudflare SSH..."
echo ""

ssh -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  -o ProxyCommand="cloudflared access ssh --hostname thakii-02.fds-1.com" \
  -i ~/.ssh/thakii_key \
  ec2-user@thakii-02.fds-1.com 'bash -s' < "$CHECK_SCRIPT"
