#!/usr/bin/env bash
# One-time setup for each contributor after cloning.
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
git config pull.rebase true
[ -f .env ] || cp .env.example .env
echo "Hooks enabled, pull.rebase=true, .env ready."
