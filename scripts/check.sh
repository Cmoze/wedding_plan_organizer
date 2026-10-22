#!/usr/bin/env bash
# Single check command for humans, agents, the pre-commit hook and CI.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "node_modules is missing: run 'npm install' first." >&2
  exit 1
fi

echo "==> format check"
npx prettier --check .

echo "==> lint"
npx eslint .

echo "==> typecheck"
npx next typegen >/dev/null && npx tsc --noEmit

echo "==> tests"
npx vitest run

echo "All checks passed."
