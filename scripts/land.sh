#!/usr/bin/env bash
# Gets a worktree's commits ready to go onto main, then (with --push) puts them there.
#
#   ./scripts/land.sh          rebase on the latest origin/main, run check.sh and the production build
#   ./scripts/land.sh --push   the same, then push to main (which deploys the live site)
#
# Run it from inside a worktree made by ./scripts/worktree.sh, with everything committed.
# Pushing deploys, so agents push only when the human has said to.
set -euo pipefail
cd "$(dirname "$0")/.."

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" = "main" ]; then
  echo "You're on main. land.sh is for worktree branches (wt/<name>)." >&2
  exit 1
fi
if git status --porcelain | grep -q .; then
  echo "Commit or discard your changes first (git status shows uncommitted work)." >&2
  exit 1
fi

git fetch -q origin main
git rebase origin/main
./scripts/check.sh
npm run build

ahead="$(git rev-list --count origin/main..HEAD)"
echo "$branch is $ahead commit(s) ahead of origin/main, rebased, checked and built."

if [ "${1:-}" = "--push" ]; then
  # The pre-push hook builds again; it already passed here.
  SKIP_BUILD=1 git push origin HEAD:main
  main_root="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
  if [ -z "$(git -C "$main_root" status --porcelain --untracked-files=no)" ]; then
    git -C "$main_root" pull -q --ff-only origin main && echo "Updated $main_root to the new main."
  else
    echo "Note: $main_root has uncommitted changes, so it wasn't updated; run 'git pull' there later."
  fi
  echo "Pushed. Check the deploy: vercel ls (then vercel inspect <url> --logs if it says Error)."
else
  echo "Ready. Push with: ./scripts/land.sh --push"
fi
