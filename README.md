# Wedding Plan Organizer

Hackathon project. Three contributors, three different coding agents, one shared rulebook: [AGENTS.md](AGENTS.md).

## First-time setup
```bash
git clone https://github.com/Cmoze/wedding_plan_organizer.git
cd wedding_plan_organizer
./scripts/setup.sh
npm install
```
Then `npm run dev` and open http://localhost:3000.

## Daily workflow (everyone pushes to main)
1. `git pull` (rebases, thanks to setup.sh), then `npm install` if `package.json` changed
2. Have your agent do the work, then `./scripts/check.sh`
3. Commit small pieces with clear messages
4. `git pull` again, then `git push`. Never force push.

## Agent instruction files
| Agent | File |
|---|---|
| Codex, Cursor | read `AGENTS.md` directly |
| Claude Code | `CLAUDE.md` (imports `AGENTS.md`) |
| Gemini CLI | `GEMINI.md` (points to `AGENTS.md`) |
| GitHub Copilot | `.github/copilot-instructions.md` |

When an agent makes the same mistake twice, add a line to AGENTS.md.
