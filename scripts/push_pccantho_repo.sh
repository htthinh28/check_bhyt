#!/usr/bin/env bash
# Đẩy toàn bộ repo lên https://github.com/htthinh28/pccantho-cdss-bhyt
# Yêu cầu: repo trống đã tạo trên GitHub (không README/.gitignore).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REMOTE="${1:-pccantho}"
URL="https://github.com/htthinh28/pccantho-cdss-bhyt"
WAIT_SECS="${WAIT_SECS:-0}"

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  git remote add "$REMOTE" "$URL"
fi

push_with_retry() {
  local ref="$1"
  local attempt=1
  local delay=4
  while [ "$attempt" -le 5 ]; do
    if git push "$REMOTE" "$ref"; then
      return 0
    fi
    echo "[push_pccantho] Thử lại $ref (lần $attempt) sau ${delay}s..."
    sleep "$delay"
    attempt=$((attempt + 1))
    delay=$((delay * 2))
  done
  return 1
}

wait_for_repo() {
  local waited=0
  while [ "$waited" -lt "$WAIT_SECS" ]; do
    if git ls-remote "$REMOTE" HEAD >/dev/null 2>&1; then
      return 0
    fi
    echo "[push_pccantho] Chờ repo $URL ... (${waited}s/${WAIT_SECS}s)"
    sleep 15
    waited=$((waited + 15))
  done
  return 1
}

echo "[push_pccantho] Kiểm tra repo $URL ..."
if ! git ls-remote "$REMOTE" HEAD >/dev/null 2>&1; then
  if [ "$WAIT_SECS" -gt 0 ]; then
    wait_for_repo || true
  fi
fi

if ! git ls-remote "$REMOTE" HEAD >/dev/null 2>&1; then
  echo "[push_pccantho] LỖI: Không truy cập được $URL"
  echo "  → Tạo repo trống tại: https://github.com/new?name=pccantho-cdss-bhyt&owner=htthinh28"
  echo "  → Owner: htthinh28, Public hoặc Private, KHÔNG tick README/license."
  echo "  → Sau khi tạo: bash scripts/push_pccantho_repo.sh"
  exit 1
fi

echo "[push_pccantho] Đồng bộ refs từ origin..."
git fetch origin --prune --tags

echo "[push_pccantho] Đẩy toàn bộ nhánh từ origin..."
push_with_retry '+refs/remotes/origin/*:refs/heads/*'

echo "[push_pccantho] Đẩy tags..."
push_with_retry --tags

echo "[push_pccantho] Xong. Repo: $URL"
