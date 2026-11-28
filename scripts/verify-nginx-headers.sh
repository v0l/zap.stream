#!/usr/bin/env bash
set -euo pipefail

# Verifies v0l/zap.stream Dockerfile.prebuilt Nginx config and route-scoped
# security headers against a built image or local checkout.
#
# Usage:
#   ./scripts/verify-nginx-headers.sh                 # builds Dockerfile.prebuilt
#   ./scripts/verify-nginx-headers.sh <image-tag>     # tests existing image
#   CONTAINER_ENGINE=docker ./scripts/verify-nginx-headers.sh <image-tag>

ENGINE="${CONTAINER_ENGINE:-}"
if [[ -z "$ENGINE" ]]; then
  if command -v podman >/dev/null 2>&1; then
    ENGINE="podman"
  elif command -v docker >/dev/null 2>&1; then
    ENGINE="docker"
  else
    echo "ERROR: neither podman nor docker found in PATH" >&2
    exit 2
  fi
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required" >&2
  exit 2
fi

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

IMAGE="${1:-}"
TEMP_IMAGE=""
CID=""
TMPDIR="$(mktemp -d)"
PASS=0
FAIL=0

cleanup() {
  if [[ -n "$CID" ]]; then
    "$ENGINE" rm -f "$CID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$TEMP_IMAGE" ]]; then
    "$ENGINE" rmi -f "$TEMP_IMAGE" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

pass() {
  PASS=$((PASS + 1))
  printf 'PASS  %s\n' "$1"
}

fail() {
  FAIL=$((FAIL + 1))
  printf 'FAIL  %s\n' "$1" >&2
}

if [[ -z "$IMAGE" ]]; then
  if [[ ! -f "Dockerfile.prebuilt" ]]; then
    echo "ERROR: pass an image tag or run from the repo root containing Dockerfile.prebuilt" >&2
    exit 2
  fi
  if [[ ! -d "build" || ! -f "build/index.html" || ! -f "build/alert.html" ]]; then
    echo "ERROR: build/ (with index.html and alert.html) not found; run 'bun run build' first" >&2
    exit 2
  fi
  TEMP_IMAGE="zap-stream-nginx-verify:$$"
  IMAGE="$TEMP_IMAGE"
  echo "Building $IMAGE from Dockerfile.prebuilt using $ENGINE..."
  "$ENGINE" build -f Dockerfile.prebuilt -t "$IMAGE" . >/dev/null
fi

# 1. Config syntax test inside the image before starting the daemon
if "$ENGINE" run --rm --entrypoint nginx "$IMAGE" -t >/dev/null 2>&1; then
  pass "nginx -t syntax check"
else
  fail "nginx -t syntax check"
  "$ENGINE" run --rm --entrypoint nginx "$IMAGE" -t || true
  exit 1
fi

# 2. Verify WASM MIME mapping exists for nosniff compatibility
if "$ENGINE" run --rm --entrypoint sh "$IMAGE" -c 'grep -Eq "application/wasm[[:space:]]+wasm;" /etc/nginx/mime.types'; then
  pass "mime.types maps .wasm to application/wasm"
else
  fail "mime.types missing application/wasm mapping (breaks WASM under nosniff)"
fi

# 3. Start ephemeral container on a random loopback port
CID="$("$ENGINE" run -d -p 127.0.0.1::8080 "$IMAGE")"
HOST_PORT="$("$ENGINE" port "$CID" 8080/tcp | head -n 1 | awk -F: '{print $NF}')"
BASE_URL="http://127.0.0.1:${HOST_PORT}"

READY=0
for _ in $(seq 1 30); do
  if curl -sS -o /dev/null "$BASE_URL/" 2>/dev/null; then
    READY=1
    break
  fi
  sleep 0.2
done
if [[ "$READY" -ne 1 ]]; then
  fail "container failed to respond on $BASE_URL"
  "$ENGINE" logs "$CID" >&2 || true
  exit 1
fi

# Discover a real hashed asset and reference hashes inside the container
REAL_ASSET="$("$ENGINE" exec "$CID" sh -c 'find /usr/share/nginx/html/assets -type f | awk "NR==1{sub(\"^/usr/share/nginx/html\", \"\"); print}"')"
ALERT_HTML_SHA="$("$ENGINE" exec "$CID" sh -c 'sha256sum /usr/share/nginx/html/alert.html | awk "{print \$1}"')"
INDEX_HTML_SHA="$("$ENGINE" exec "$CID" sh -c 'sha256sum /usr/share/nginx/html/index.html | awk "{print \$1}"')"

if [[ -z "$REAL_ASSET" ]]; then
  fail "no static files found under /usr/share/nginx/html/assets"
  exit 1
fi

HDR_FILE="$TMPDIR/headers.txt"
BODY_FILE="$TMPDIR/body.bin"
STATUS=""

fetch() {
  local path="$1"
  shift
  STATUS="$(curl -sS -D "$HDR_FILE" -o "$BODY_FILE" -w '%{http_code}' "$@" "${BASE_URL}${path}")"
}

get_header() {
  local target
  target="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  awk -v k="$target" '
    BEGIN { FS=":" }
    {
      sub(/\r$/, "")
      if (tolower($1) == k) {
        sub(/^[^:]*:[ \t]*/, "")
        print
      }
    }
  ' "$HDR_FILE"
}

assert_status() {
  local label="$1" expected="$2"
  if [[ "$STATUS" == "$expected" ]]; then
    pass "$label: HTTP $expected"
  else
    fail "$label: expected HTTP $expected, got $STATUS"
  fi
}

assert_hdr_eq() {
  local label="$1" hdr="$2" expected="$3" actual
  actual="$(get_header "$hdr")"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label: $hdr == $expected"
  else
    fail "$label: $hdr expected '$expected', got '$actual'"
  fi
}

assert_hdr_contains() {
  local label="$1" hdr="$2" needle="$3" actual
  actual="$(get_header "$hdr")"
  if [[ "$actual" == *"$needle"* ]]; then
    pass "$label: $hdr contains '$needle'"
  else
    fail "$label: $hdr missing '$needle' (got '$actual')"
  fi
}

assert_hdr_not_contains() {
  local label="$1" hdr="$2" needle="$3" actual
  actual="$(get_header "$hdr")"
  if [[ "$actual" != *"$needle"* ]]; then
    pass "$label: $hdr omits '$needle'"
  else
    fail "$label: $hdr unexpectedly contains '$needle' (got '$actual')"
  fi
}

assert_hdr_absent() {
  local label="$1" hdr="$2" actual
  actual="$(get_header "$hdr")"
  if [[ -z "$actual" ]]; then
    pass "$label: $hdr absent"
  else
    fail "$label: expected $hdr absent, got '$actual'"
  fi
}

assert_baseline_headers() {
  local label="$1"
  assert_hdr_contains "$label" "Content-Security-Policy" "object-src 'none'"
  assert_hdr_contains "$label" "Content-Security-Policy" "base-uri 'self'"
  assert_hdr_contains "$label" "Content-Security-Policy" "form-action 'self'"
  # R4 tightened-CSP guard: exact script-src token must stay minimal...
  assert_hdr_contains     "$label" "Content-Security-Policy" "script-src 'self' 'wasm-unsafe-eval';"
  assert_hdr_contains     "$label" "Content-Security-Policy" "frame-src https://www.youtube-nocookie.com;"
  # ...and the dropped third-party origins must never reappear (script-src or frame-src)
  assert_hdr_not_contains "$label" "Content-Security-Policy" "platform.twitter.com"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "embed.tidal.com"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "challenges.cloudflare.com"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "googletagmanager.com"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "player.twitch.tv"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "open.spotify.com"
  assert_hdr_not_contains "$label" "Content-Security-Policy" "w.soundcloud.com"
  assert_hdr_eq       "$label" "X-Content-Type-Options"  "nosniff"
  assert_hdr_eq       "$label" "Referrer-Policy"         "strict-origin-when-cross-origin"
  assert_hdr_contains "$label" "Permissions-Policy"      "camera=()"
  assert_hdr_contains "$label" "Permissions-Policy"      "microphone=()"

  local srv
  srv="$(get_header "Server")"
  if [[ "$srv" != */[0-9]* ]]; then
    pass "$label: Server header hides nginx version ('$srv')"
  else
    fail "$label: Server header leaks version ('$srv')"
  fi
}

assert_locked_route() {
  local path="$1"
  fetch "$path" -H "X-Forwarded-Proto: https"
  assert_status           "$path" "200"
  assert_baseline_headers "$path"
  assert_hdr_contains     "$path" "Content-Security-Policy"   "frame-ancestors 'none'"
  assert_hdr_eq           "$path" "X-Frame-Options"           "DENY"
  assert_hdr_eq           "$path" "Cross-Origin-Opener-Policy" "same-origin"
  assert_hdr_contains     "$path" "Strict-Transport-Security" "max-age="
  assert_hdr_contains     "$path" "Strict-Transport-Security" "includeSubDomains"
}

assert_framable_route() {
  local path="$1"
  fetch "$path" -H "X-Forwarded-Proto: https"
  assert_status           "$path" "200"
  assert_baseline_headers "$path"
  assert_hdr_contains     "$path" "Content-Security-Policy"    "frame-ancestors *"
  assert_hdr_not_contains "$path" "Content-Security-Policy"    "frame-ancestors 'none'"
  assert_hdr_absent       "$path" "X-Frame-Options"
  assert_hdr_eq           "$path" "Cross-Origin-Opener-Policy" "unsafe-none"
  assert_hdr_contains     "$path" "Strict-Transport-Security"  "max-age="
}

echo "--- Locked-down app routes + regex boundary negative controls ---"
assert_locked_route "/settings"
assert_locked_route "/alerts"
assert_locked_route "/embedded-test"

echo "--- Framable SPA embed/popout routes (catches map \$uri rewrite bug) ---"
assert_framable_route "/embed/test-id"
assert_framable_route "/chat/test-id"
assert_framable_route "/widgets"

echo "--- OBS alert routes + S-9 shell verification ---"
assert_framable_route "/alert/test-id/zaps"
BODY_SHA="$(hash_file "$BODY_FILE")"
if [[ "$BODY_SHA" == "$ALERT_HTML_SHA" && "$BODY_SHA" != "$INDEX_HTML_SHA" ]]; then
  pass "/alert/test-id/zaps serves alert.html (not SPA index.html)"
else
  fail "/alert/test-id/zaps body mismatch (expected alert.html sha $ALERT_HTML_SHA, got $BODY_SHA)"
fi

assert_framable_route "/alert.html"
BODY_SHA="$(hash_file "$BODY_FILE")"
if [[ "$BODY_SHA" == "$ALERT_HTML_SHA" ]]; then
  pass "/alert.html serves alert.html directly"
else
  fail "/alert.html body mismatch"
fi

echo "--- Static asset caching + add_header inheritance check ---"
fetch "$REAL_ASSET" -H "X-Forwarded-Proto: https"
assert_status           "$REAL_ASSET" "200"
assert_baseline_headers "$REAL_ASSET"
assert_hdr_contains     "$REAL_ASSET" "Cache-Control"             "max-age=31536000"
assert_hdr_contains     "$REAL_ASSET" "Cache-Control"             "immutable"
assert_hdr_eq           "$REAL_ASSET" "X-Frame-Options"           "DENY"
assert_hdr_contains     "$REAL_ASSET" "Strict-Transport-Security" "max-age="

echo "--- 404 static asset negative cache control + always verification ---"
fetch "/assets/nonexistent.js" -H "X-Forwarded-Proto: https"
assert_status           "/assets/nonexistent.js" "404"
assert_baseline_headers "/assets/nonexistent.js"
assert_hdr_absent       "/assets/nonexistent.js" "Cache-Control"
assert_hdr_eq           "/assets/nonexistent.js" "X-Frame-Options"           "DENY"
assert_hdr_contains     "/assets/nonexistent.js" "Strict-Transport-Security" "max-age="

echo "--- Plain-HTTP and malformed X-Forwarded-Proto HSTS omission ---"
fetch "/"
assert_status           "/ (plain HTTP)" "200"
assert_baseline_headers "/ (plain HTTP)"
assert_hdr_absent       "/ (plain HTTP)" "Strict-Transport-Security"

fetch "/settings" -H "X-Forwarded-Proto: http, https"
assert_status           "/settings (multi-value XFP)" "200"
assert_hdr_absent       "/settings (multi-value XFP)" "Strict-Transport-Security"

echo "--- Summary: ${PASS} passed, ${FAIL} failed ---"
[[ "$FAIL" -eq 0 ]]
