#!/usr/bin/env bash
# Đẩy codebase lên https://github.com/htthinh28/bhyt_pc_sadec
# Yêu cầu: tạo repo trống trên GitHub trước (không README, không .gitignore).

set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_NAME="${REMOTE_NAME:-sadec}"
REMOTE_URL="${REMOTE_URL:-https://github.com/htthinh28/bhyt_pc_sadec.git}"
SOURCE_BRANCH="${SOURCE_BRANCH:-cursor/tenant-model-a-3bv-e6c3}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"

if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote add "$REMOTE_NAME" "$REMOTE_URL"
else
  git remote set-url "$REMOTE_NAME" "$REMOTE_URL"
fi

echo "→ Push $SOURCE_BRANCH → $REMOTE_NAME/$TARGET_BRANCH"
git push -u "$REMOTE_NAME" "${SOURCE_BRANCH}:${TARGET_BRANCH}"

echo "✅ Xong: $REMOTE_URL (branch $TARGET_BRANCH)"
