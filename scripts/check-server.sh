#!/usr/bin/env bash
# Server diagnostics for thakii-frontend white page / 404 debugging.
#
# Run ON the server (after SSH):
#   bash scripts/check-server.sh
#
# Or FROM your machine (SSH and run in one go). With Cloudflare Access:
#   cd thakii-frontend && bash scripts/run-server-check.sh
#   # Or manually:
#   ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
#     -o ProxyCommand="cloudflared access ssh --hostname thakii-02.fds-1.com" \
#     -i ~/.ssh/thakii_key ec2-user@thakii-02.fds-1.com 'bash -s' < scripts/check-server.sh
#
# Requires: sudo access on the server for nginx and log reading.

set -e
WEB_ROOT="${WEB_ROOT:-/var/www/thakii-frontend}"
SITE_NAME="${SITE_NAME:-thakii-02.fanusdigital.site}"

echo "=============================================="
echo "1. WEB ROOT: $WEB_ROOT"
echo "=============================================="
if [ ! -d "$WEB_ROOT" ]; then
  echo "ERROR: $WEB_ROOT does not exist."
  exit 1
fi
ls -la "$WEB_ROOT"
echo ""
if [ -d "$WEB_ROOT/assets" ]; then
  echo "First 20 files in assets/:"
  ls "$WEB_ROOT/assets" | head -20
else
  echo "WARNING: $WEB_ROOT/assets not found (Vite build puts JS/CSS here)."
fi
echo ""

echo "=============================================="
echo "2. INDEX.HTML (first 20 lines)"
echo "=============================================="
if [ -f "$WEB_ROOT/index.html" ]; then
  head -20 "$WEB_ROOT/index.html"
else
  echo "ERROR: index.html missing."
fi
echo ""

echo "=============================================="
echo "3. NGINX CONFIG (sites with $SITE_NAME or thakii)"
echo "=============================================="
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t 2>&1 || true
  echo ""
  for f in /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf /etc/nginx/sites-enabled/*; do
    [ -f "$f" ] || continue
    if sudo grep -l "thakii\|fanusdigital\|$SITE_NAME" "$f" >/dev/null 2>&1; then
      echo "--- $f ---"
      sudo cat "$f"
      echo ""
    fi
  done
else
  echo "Nginx not in PATH; checking common paths..."
  for f in /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf; do
    [ -f "$f" ] || continue
    if sudo grep -l "thakii\|fanusdigital" "$f" >/dev/null 2>&1; then
      echo "--- $f ---"
      sudo cat "$f"
    fi
  done
fi
echo ""

echo "=============================================="
echo "4. NGINX ERROR LOG (last 50 lines)"
echo "=============================================="
for log in /var/log/nginx/error.log /usr/local/var/log/nginx/error.log; do
  if [ -f "$log" ]; then
    sudo tail -50 "$log"
    break
  fi
done
echo ""

echo "=============================================="
echo "5. NGINX ACCESS LOG – recent 404s (last 30)"
echo "=============================================="
for log in /var/log/nginx/access.log /usr/local/var/log/nginx/access.log; do
  if [ -f "$log" ]; then
    ( sudo grep " 404 " "$log" 2>/dev/null | tail -30 ) || echo "(no 404s in tail)"
    break
  fi
done
echo ""

echo "=============================================="
echo "6. RECENT ACCESS LOG (last 20 lines)"
echo "=============================================="
for log in /var/log/nginx/access.log /usr/local/var/log/nginx/access.log; do
  if [ -f "$log" ]; then
    sudo tail -20 "$log"
    break
  fi
done
echo ""
echo "=============================================="
echo "Done. Look for: missing assets/, 404s for /assets/*, wrong root in nginx."
echo "=============================================="
