# Contributing to claude-setup

Thanks for your interest in contributing!

## Getting started

```bash
git clone https://github.com/YOUR_USERNAME/claude-setup.git
cd claude-setup
npm install
node bin/claude-setup   # run the wizard locally
```

## Project structure

```
bin/claude-setup          CLI entry point (--help, --version, delegates to src/)
src/
  index.js                Main orchestrator: analyze → prompt → generate → write
  analyzer.js             Codebase analyzer (language, framework, tools detection)
  utils.js                Display helpers (chalk) and file utilities
  prompts/
    index.js              All inquirer prompt definitions, one function per component
  generators/
    claude-md.js          CLAUDE.md generator
    settings.js           settings.json generator
    rules.js              .claude/rules/*.md generators
    agents.js             .claude/agents/*.md generators
    skills.js             .claude/skills/*/SKILL.md generators
    hooks.js              .claude/hooks/*.sh generators
    mcp.js                .claude/.mcp.json generator
```

## Adding a new agent

1. Open `src/generators/agents.js`
2. Add a new entry to `AGENT_TEMPLATES` — key is the agent slug, value is a function receiving `{ model, readOnly, proactive }` and returning a markdown string
3. Add it to the choices list in `src/prompts/index.js` → `promptAgents()`

## Adding a new skill

1. Open `src/generators/skills.js`
2. Add a new entry to `SKILL_TEMPLATES` — key is the skill slug, value is a function returning a SKILL.md string (use array `.join('\n')` to avoid backtick escaping issues)
3. Add it to the choices list in `src/prompts/index.js` → `promptSkills()`

## Adding a new rule file

1. Open `src/generators/rules.js`
2. Add an entry to the `RULES` object — key is the rule slug, value is a function receiving `detected` and returning a markdown string (include frontmatter `paths:` for path-specific loading)
3. Add it to the choices list in `src/prompts/index.js` → `promptRules()`

## Adding a new language or framework to the analyzer

- Language detection: `src/analyzer.js` → `LANG_SIGNALS` object
- Framework detection: `src/analyzer.js` → `detectFramework()` function
- Test/build/formatter/linter detection: respective `detect*()` functions

## Code style

- CommonJS (`require`/`module.exports`) — no ESM
- No TypeScript (keep the contribution barrier low)
- Keep each generator self-contained — no cross-generator imports
- New prompts go in `src/prompts/index.js`, new generators in `src/generators/`

## Submitting a PR

1. Fork the repo and create a branch: `feat/my-feature` or `fix/my-bug`
2. Test your change: `node bin/claude-setup` from a real project
3. Open a PR with a clear description of what changed and why
