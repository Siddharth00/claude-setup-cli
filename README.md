# claude-setup

> Interactive CLI to scaffold [Claude Code](https://claude.ai/code) configuration for any project — in under 2 minutes.

Claude Code works best when it understands your project: how to build and test it, what conventions to follow, which tools to use. Setting that up manually means reading docs, writing YAML, and creating a dozen files. `claude-setup` does it for you interactively.

```
npx claude-setup
```

---

## What it generates

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions Claude reads every session — stack, commands, conventions, architecture |
| `.claude/settings.json` | Permissions, model selection, allowed/denied bash commands |
| `.claude/rules/*.md` | Path-specific rules that load only when Claude touches matching files |
| `.claude/agents/*.md` | Specialized sub-agents (code reviewer, debugger, security auditor, etc.) |
| `.claude/skills/*/SKILL.md` | Custom slash commands (`/pr-summary`, `/explain`, `/test-gen`, etc.) |
| `.claude/hooks/*.sh` | Auto-format on save, desktop notifications, block destructive commands |
| `.claude/.mcp.json` | MCP server config (GitHub, Playwright, Postgres, Brave Search, Slack) |
| `.gitignore` | Appends Claude-specific entries (local settings, memory dirs, logs) |

---

## How it works

**1. Analyzes your codebase automatically**

Detects language, framework, package manager, test tool, build tool, formatter, linter, database ORM, and infra — and pre-fills every prompt with smart defaults.

Supports: JavaScript/TypeScript, Python, Go, Rust, Java, Ruby, PHP, Dart and more. Frameworks: Next.js, React, Vue, Angular, Django, FastAPI, Flask, Express, NestJS, Gin, Axum, Actix and more.

**2. Interactive wizard**

Step-by-step questions. Press `Space` to toggle, `Enter` to confirm. Every question has a default — just hit Enter to accept.

**3. Writes files, skips existing ones**

Never overwrites without asking. Safe to re-run.

---

## Requirements

- Node.js ≥ 14
- [Claude Code](https://claude.ai/code) installed in the project you're setting up

---

## Installation & Usage

### One-time use (no install)
```bash
cd your-project
npx claude-setup
```

### Global install
```bash
npm install -g claude-setup
cd your-project
claude-setup
```

### Run without installing (local clone)
```bash
cd your-project
node /path/to/claude-setup/bin/claude-setup
```

---

## What gets asked

### Project info
Confirm or override the auto-detected name, language, framework, and project type.

### Component selection
Pick which files to generate — everything is optional:

```
◉ CLAUDE.md
◉ .claude/settings.json
◉ .claude/rules/
◯ .claude/agents/
◯ .claude/skills/
◯ Hooks
◯ MCP servers
◉ .gitignore updates
```

### Per-component questions

**CLAUDE.md** — dev/build/test commands, indentation style, test directory, source directory, coding conventions, architecture notes, environment variables, things Claude should never do.

**Settings** — permission mode (default/acceptEdits/plan), model (Sonnet/Opus/Haiku), pre-approved bash commands, blocked bash commands.

**Rules** — choose from: `code-style`, `testing`, `security`, `git`, `framework`, `database`. Each rule file has path globs so it only loads for relevant files.

**Agents** — choose from 7 prebuilt agents. For each: model override, read-only mode, proactive use setting.

**Skills** — choose from 8 prebuilt slash commands. Each is a ready-to-use SKILL.md.

**Hooks** — auto-format on save, auto-lint on save, desktop notification when Claude finishes, block `rm -rf`, run tests after edits, full audit log.

**MCP servers** — GitHub, Filesystem, Brave Search, Slack, PostgreSQL, Playwright.

---

## Generated examples

<details>
<summary><strong>CLAUDE.md (Next.js + TypeScript project)</strong></summary>

```markdown
# my-app

A full-stack Next.js application.

## Tech Stack

- **Language**: TypeScript
- **Framework**: Next.js
- **Package Manager**: npm
- **Testing**: vitest
- **Formatter**: prettier
- **Linter**: eslint

## Commands

### Development
\`\`\`bash
npm run dev
\`\`\`

### Test
\`\`\`bash
npm test
\`\`\`

## Code Style

- **Indentation**: 2 spaces
- Use `const` over `let`; avoid `var`
- Use explicit types; avoid `any`
- Prefer interfaces over type aliases for object shapes

## Workflow

1. Read relevant source files before making changes
2. Make focused, incremental changes
3. Run tests after changes
4. Lint before finalizing: `npm run lint`
```

</details>

<details>
<summary><strong>.claude/agents/code-reviewer.md</strong></summary>

```markdown
---
name: code-reviewer
description: Reviews code for quality, correctness, security, and best practices. Use proactively after significant code changes.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
effort: high
---

You are a senior software engineer performing a thorough code review.

## Review Checklist
...
```

</details>

<details>
<summary><strong>.claude/skills/pr-summary/SKILL.md</strong></summary>

```markdown
---
name: pr-summary
description: Summarizes pull request changes with context and impact assessment.
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep
---

## PR Context
\`\`\`
!`git log --oneline main..HEAD 2>/dev/null | head -20`
\`\`\`
...
```

</details>

---

## Available agents

| Agent | What it does |
|---|---|
| `code-reviewer` | Reviews for quality, security, best practices |
| `test-writer` | Writes comprehensive tests |
| `debugger` | Diagnoses and traces bugs methodically |
| `doc-writer` | Writes docstrings, READMEs, API docs |
| `security-audit` | Vulnerability analysis (OWASP, injection, secrets) |
| `refactorer` | Simplifies code while preserving behavior |
| `data-analyst` | SQL queries, data pipelines, analysis |

## Available skills

| Skill | What it does |
|---|---|
| `/pr-summary` | Summarize PR changes with AI context |
| `/explain` | Explain code with diagrams and analogies |
| `/test-gen` | Generate tests for a file or function |
| `/todo` | Create implementation plan from a feature request |
| `/review` | Full code review with checklist |
| `/optimize` | Performance analysis and suggestions |
| `/changelog` | Generate CHANGELOG from git history |
| `/scaffold` | Scaffold new component matching project conventions |

---

## After running

Open Claude Code in your project:

```bash
claude
```

Then try:

```
/pr-summary          # summarize latest changes
/review src/auth.ts  # review a specific file
@"code-reviewer (agent)" look at my latest commit
```

Useful Claude Code commands to explore what was set up:

```
/memory       # view loaded CLAUDE.md files and memory
/permissions  # review active permission rules
/init         # let Claude improve your CLAUDE.md further
```

---

## Contributing

Issues and PRs welcome at [github.com/YOUR_USERNAME/claude-setup](https://github.com/YOUR_USERNAME/claude-setup).

```bash
git clone https://github.com/YOUR_USERNAME/claude-setup.git
cd claude-setup
npm install
node bin/claude-setup   # run locally
```

---

## License

MIT — see [LICENSE](./LICENSE)
