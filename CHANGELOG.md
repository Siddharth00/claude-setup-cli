# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-28

### Added
- Interactive wizard with step-by-step prompts
- Codebase analyzer: detects language, framework, package manager, test tool, build tool, formatter, linter, database ORM, and infra
- CLAUDE.md generator with smart defaults per language/framework
- `.claude/settings.json` generator with permissions and model config
- Path-specific rules generator: code-style, testing, security, git, framework, database
- 7 prebuilt agent templates: code-reviewer, test-writer, debugger, doc-writer, security-audit, refactorer, data-analyst
- 8 prebuilt skill templates: pr-summary, explain, test-gen, todo, review, optimize, changelog, scaffold
- Hooks generator: format on save, lint on save, desktop notification, protect (block rm -rf), test runner, audit log
- MCP server config generator: GitHub, Filesystem, Brave Search, Slack, PostgreSQL, Playwright
- `.gitignore` updater (appends Claude-specific entries without clobbering existing content)
- `--version` and `--help` CLI flags
- Safe file writing: skips existing files, never overwrites silently
- Preview screen before writing any files
