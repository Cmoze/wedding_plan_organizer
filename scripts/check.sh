#!/usr/bin/env bash
# Single check command for humans, agents, the pre-commit hook and CI.
# Fill in the steps once the stack is chosen.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> format check"
# e.g. npx prettier --check .   |   ruff format --check .

echo "==> lint"
# e.g. npx eslint .             |   ruff check .

echo "==> typecheck"
# e.g. npx tsc --noEmit         |   mypy .

echo "==> tests"
# e.g. npm test                 |   pytest

echo "All checks passed."
