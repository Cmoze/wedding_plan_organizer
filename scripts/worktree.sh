#!/usr/bin/env bash
# One working copy per agent session, so parallel sessions never share files, hooks or a dev server.
#
#   ./scripts/worktree.sh new <name>     create ../together-wt/<name> on branch wt/<name>, from origin/main
#   ./scripts/worktree.sh list           show worktrees
#   ./scripts/worktree.sh remove <name>  delete the worktree and its branch (after it has landed)
#
# The new copy gets .env / .env.local and a copy-on-write clone of node_modules (fast on APFS),
# so `./scripts/check.sh` and `npm run dev -- -p <port>` work right away. Land it with ./scripts/land.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
main_root="$(git rev-parse --path-format=absolute --git-common-dir)/.."
main_root="$(cd "$main_root" && pwd)"
base="$(dirname "$main_root")/together-wt"

cmd="${1:-}"
name="${2:-}"
case "$cmd" in
  new)
    [ -n "$name" ] || { echo "usage: $0 new <name>" >&2; exit 1; }
    [[ "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "name: lowercase letters, digits and dashes" >&2; exit 1; }
    dir="$base/$name"
    [ ! -e "$dir" ] || { echo "$dir already exists" >&2; exit 1; }
    git fetch -q origin main
    mkdir -p "$base"
    git worktree add -q -b "wt/$name" "$dir" origin/main
    for f in .env .env.local; do [ -f "$main_root/$f" ] && cp "$main_root/$f" "$dir/$f"; done
    if [ -d "$main_root/node_modules" ]; then
      cp -Rc "$main_root/node_modules" "$dir/node_modules" 2>/dev/null ||
        cp -R "$main_root/node_modules" "$dir/node_modules"
    else
      (cd "$dir" && npm ci)
    fi
    echo "Worktree ready: $dir (branch wt/$name, from origin/main)"
    echo "Dev server: cd \"$dir\" && npm run dev -- -p <3001-3009>"
    echo "When done: ./scripts/land.sh (from inside the worktree)"
    ;;
  list)
    git worktree list
    ;;
  remove)
    [ -n "$name" ] || { echo "usage: $0 remove <name>" >&2; exit 1; }
    dir="$base/$name"
    if git -C "$dir" status --porcelain 2>/dev/null | grep -q .; then
      echo "$dir has uncommitted changes; commit or discard them first." >&2
      exit 1
    fi
    if ! git merge-base --is-ancestor "wt/$name" origin/main 2>/dev/null; then
      git fetch -q origin main
      git merge-base --is-ancestor "wt/$name" origin/main ||
        { echo "wt/$name has commits that aren't on origin/main yet; land it first." >&2; exit 1; }
    fi
    git worktree remove --force "$dir"
    git branch -D "wt/$name" >/dev/null
    echo "Removed $dir and wt/$name."
    ;;
  *)
    sed -n '2,10p' "$0"
    exit 1
    ;;
esac
