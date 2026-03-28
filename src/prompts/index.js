'use strict';

const inquirer = require('inquirer');
const chalk = require('chalk');
const { step, info, divider } = require('../utils');

// ─── Step 1: Confirm / override detected info ─────────────────────────────────

async function promptProjectInfo(detected, totalSteps) {
  step(1, totalSteps, 'Project Information');
  info('Detected from codebase — confirm or override below.\n');

  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: detected.name,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Short description:',
      default: detected.description || '',
    },
    {
      type: 'input',
      name: 'language',
      message: 'Primary language:',
      default: detected.language,
    },
    {
      type: 'input',
      name: 'framework',
      message: 'Framework (leave blank if none):',
      default: detected.framework || '',
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      default: detected.projectType,
      choices: ['web-app', 'api', 'cli-tool', 'library', 'desktop-app', 'mobile-app', 'monorepo', 'project'],
    },
  ]);
}

// ─── Step 2: Component selection ─────────────────────────────────────────────

async function promptComponents(totalSteps) {
  step(2, totalSteps, 'What would you like to set up?');
  info('Select all components you want to generate.\n');

  const { components } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'components',
      message: 'Components to generate:',
      choices: [
        { name: 'CLAUDE.md — Project instructions for Claude',        value: 'claude_md',  checked: true },
        { name: '.claude/settings.json — Permissions & model config', value: 'settings',   checked: true },
        { name: '.claude/rules/ — Conditional rules per file/domain', value: 'rules',      checked: true },
        { name: '.claude/agents/ — Custom specialized sub-agents',    value: 'agents',     checked: false },
        { name: '.claude/skills/ — Custom slash commands / skills',   value: 'skills',     checked: false },
        { name: 'Hooks — Auto-run scripts on tool use/save',          value: 'hooks',      checked: false },
        { name: 'MCP servers — Connect external tools to Claude',     value: 'mcp',        checked: false },
        { name: '.gitignore updates',                                  value: 'gitignore',  checked: true },
      ],
    },
  ]);
  return components;
}

// ─── Step 3: CLAUDE.md details ────────────────────────────────────────────────

async function promptClaudeMd(detected, projectInfo, stepN, totalSteps) {
  step(stepN, totalSteps, 'CLAUDE.md Configuration');
  info('Define instructions Claude will follow every session.\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'devCommand',
      message: 'Dev/start command:',
      default: detected.commands.dev || '',
    },
    {
      type: 'input',
      name: 'buildCommand',
      message: 'Build command:',
      default: detected.commands.build || '',
    },
    {
      type: 'input',
      name: 'testCommand',
      message: 'Test command:',
      default: detected.commands.test || '',
    },
    {
      type: 'input',
      name: 'lintCommand',
      message: 'Lint command (blank to skip):',
      default: detected.commands.lint || '',
    },
    {
      type: 'input',
      name: 'formatCommand',
      message: 'Format command (blank to skip):',
      default: detected.commands.format || '',
    },
    {
      type: 'list',
      name: 'indentation',
      message: 'Code indentation style:',
      default: '2 spaces',
      choices: ['2 spaces', '4 spaces', 'tabs'],
    },
    {
      type: 'confirm',
      name: 'hasTests',
      message: 'Should Claude write/run tests?',
      default: true,
    },
    {
      type: 'input',
      name: 'testDir',
      message: 'Test directory/pattern:',
      default: detected.language === 'Python' ? 'tests/' : '__tests__/ or *.test.ts',
      when: a => a.hasTests,
    },
    {
      type: 'input',
      name: 'srcDir',
      message: 'Main source directory:',
      default: 'src/',
    },
    {
      type: 'confirm',
      name: 'addConventions',
      message: 'Add custom coding conventions / style notes?',
      default: false,
    },
    {
      type: 'editor',
      name: 'conventions',
      message: 'Enter coding conventions (opens editor):',
      default: '- Use async/await over callbacks\n- Prefer const over let\n- Name booleans with is/has/should prefix',
      when: a => a.addConventions,
    },
    {
      type: 'confirm',
      name: 'addDontDo',
      message: "Add things Claude should NOT do?",
      default: false,
    },
    {
      type: 'input',
      name: 'dontDo',
      message: "Things Claude must not do (comma separated):",
      default: 'push to main directly, delete files without confirmation, expose secrets in logs',
      when: a => a.addDontDo,
    },
    {
      type: 'confirm',
      name: 'addArchitecture',
      message: 'Add architecture / design notes?',
      default: false,
    },
    {
      type: 'editor',
      name: 'architecture',
      message: 'Describe the architecture:',
      default: '## Architecture\n\n- Layer 1: ...\n- Layer 2: ...',
      when: a => a.addArchitecture,
    },
    {
      type: 'confirm',
      name: 'addEnvVars',
      message: 'List important environment variables?',
      default: false,
    },
    {
      type: 'input',
      name: 'envVars',
      message: 'Env vars (comma separated, e.g. DATABASE_URL,API_KEY):',
      when: a => a.addEnvVars,
    },
  ]);

  return answers;
}

// ─── Step: Settings ───────────────────────────────────────────────────────────

async function promptSettings(detected, stepN, totalSteps) {
  step(stepN, totalSteps, 'Settings Configuration');
  info('Configure permissions and Claude behavior.\n');

  const pm = detected.packageManager || 'npm';

  return inquirer.prompt([
    {
      type: 'list',
      name: 'defaultMode',
      message: 'Default permission mode:',
      default: 'default',
      choices: [
        { name: 'default      — Ask for each tool use (recommended)',    value: 'default' },
        { name: 'acceptEdits  — Auto-approve file edits',                value: 'acceptEdits' },
        { name: 'plan         — Read-only, no writes',                   value: 'plan' },
      ],
    },
    {
      type: 'list',
      name: 'model',
      message: 'Default model:',
      default: 'claude-sonnet-4-6',
      choices: [
        { name: 'claude-sonnet-4-6 (recommended, balanced)',  value: 'claude-sonnet-4-6' },
        { name: 'claude-opus-4-6   (most capable)',           value: 'claude-opus-4-6' },
        { name: 'claude-haiku-4-5  (fastest, cheapest)',      value: 'claude-haiku-4-5-20251001' },
      ],
    },
    {
      type: 'checkbox',
      name: 'allowedBash',
      message: 'Pre-approve bash commands (no prompts):',
      choices: [
        { name: `${pm} run *          — All package scripts`,        value: `Bash(${pm} run *)`,    checked: true },
        { name: 'git *                — All git operations',         value: 'Bash(git *)',           checked: true },
        { name: `${pm} install *      — Package installs`,           value: `Bash(${pm} install *)`, checked: false },
        { name: 'docker *             — Docker commands',            value: 'Bash(docker *)',        checked: false },
        { name: 'make *               — Make targets',               value: 'Bash(make *)',          checked: false },
        detected.language === 'Python' ?
          { name: 'python/pytest       — Python tools', value: 'Bash(python *)', checked: true } :
          { name: 'cargo *             — Rust/Cargo',   value: 'Bash(cargo *)',   checked: false },
        detected.language === 'Go' ?
          { name: 'go *               — Go tools',      value: 'Bash(go *)',      checked: true } :
          { name: 'go *               — Go tools',      value: 'Bash(go *)',      checked: false },
      ],
    },
    {
      type: 'checkbox',
      name: 'deniedBash',
      message: 'Block these commands (always denied):',
      choices: [
        { name: 'rm -rf *      — Recursive force delete',          value: 'Bash(rm -rf *)',     checked: true },
        { name: 'git push --force — Force push',                   value: 'Bash(git push --force *)', checked: false },
        { name: 'DROP TABLE     — SQL destructive ops',            value: 'Bash(*DROP TABLE*)', checked: false },
        { name: 'curl | bash    — Pipe to bash',                   value: 'Bash(curl * | bash)', checked: false },
      ],
    },
  ]);
}

// ─── Step: Rules ──────────────────────────────────────────────────────────────

async function promptRules(detected, stepN, totalSteps) {
  step(stepN, totalSteps, 'Rules Configuration');
  info('Path-specific rules load only when Claude works with matching files.\n');

  return inquirer.prompt([
    {
      type: 'checkbox',
      name: 'ruleFiles',
      message: 'Which rule files to create?',
      choices: [
        { name: 'code-style.md   — Formatting, naming, conventions',  value: 'code-style',   checked: true },
        { name: 'testing.md      — Test conventions and patterns',     value: 'testing',      checked: true },
        { name: 'security.md     — Security requirements',            value: 'security',     checked: false },
        { name: 'git.md          — Commit/PR conventions',            value: 'git',          checked: false },
        detected.framework ?
          { name: `${detected.framework}.md — Framework-specific rules`, value: 'framework', checked: true } :
          { name: 'api.md          — API design conventions',          value: 'api',          checked: false },
        detected.database ?
          { name: 'database.md    — DB/ORM patterns',                  value: 'database',     checked: true } :
          { name: 'database.md    — DB/ORM patterns',                  value: 'database',     checked: false },
      ],
    },
  ]);
}

// ─── Step: Hooks ─────────────────────────────────────────────────────────────

async function promptHooks(detected, stepN, totalSteps) {
  step(stepN, totalSteps, 'Hooks Configuration');
  info('Hooks automatically run scripts at specific points in Claude\'s workflow.\n');

  return inquirer.prompt([
    {
      type: 'checkbox',
      name: 'hooks',
      message: 'Which hooks to set up?',
      choices: [
        detected.formatter ? {
          name: `Auto-format on save (${detected.formatter})`,
          value: 'format',
          checked: true,
        } : {
          name: 'Auto-format on save',
          value: 'format',
          checked: false,
        },
        detected.linter ? {
          name: `Auto-lint on save (${detected.linter})`,
          value: 'lint',
          checked: false,
        } : {
          name: 'Auto-lint on save',
          value: 'lint',
          checked: false,
        },
        { name: 'Desktop notification when Claude finishes',  value: 'notify',  checked: true },
        { name: 'Block rm -rf / destructive commands',        value: 'protect', checked: true },
        { name: 'Log all tool uses to a file',                value: 'log',     checked: false },
        { name: 'Run tests after file edits',                 value: 'tests',   checked: false },
      ],
    },
    {
      type: 'list',
      name: 'notifyPlatform',
      message: 'Notification method:',
      when: a => a.hooks.includes('notify'),
      choices: [
        { name: 'macOS native (osascript)', value: 'mac' },
        { name: 'Linux (notify-send)',      value: 'linux' },
        { name: 'Terminal bell',            value: 'bell' },
      ],
      default: process.platform === 'linux' ? 'linux' : 'mac',
    },
    {
      type: 'input',
      name: 'formatCommand',
      message: 'Format command to run on save:',
      default: detected.commands.format || '',
      when: a => a.hooks.includes('format'),
    },
    {
      type: 'input',
      name: 'lintCommand',
      message: 'Lint command to run on save:',
      default: detected.commands.lint || '',
      when: a => a.hooks.includes('lint'),
    },
  ]);
}

// ─── Step: Agents ────────────────────────────────────────────────────────────

async function promptAgents(detected, stepN, totalSteps) {
  step(stepN, totalSteps, 'Agents Configuration');
  info('Agents are specialized sub-agents Claude can delegate tasks to.\n');

  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message: 'Which agents to create?',
      choices: [
        { name: 'code-reviewer   — Reviews code quality, security, best practices', value: 'code-reviewer',   checked: true },
        { name: 'test-writer     — Writes and improves tests',                       value: 'test-writer',     checked: false },
        { name: 'debugger        — Diagnoses and fixes bugs',                        value: 'debugger',        checked: false },
        { name: 'doc-writer      — Writes documentation',                            value: 'doc-writer',      checked: false },
        { name: 'security-audit  — Security vulnerability analysis',                 value: 'security-audit',  checked: false },
        { name: 'refactorer      — Refactors and simplifies code',                   value: 'refactorer',      checked: false },
        { name: 'data-analyst    — Analyzes data, writes queries',                   value: 'data-analyst',    checked: false },
      ],
    },
  ]);

  const agentDetails = {};
  for (const agent of selectedAgents) {
    console.log(chalk.gray(`\n  Configuring: ${agent}`));
    const details = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `  Model for ${agent}:`,
        choices: [
          { name: 'inherit (same as main)', value: 'inherit' },
          { name: 'sonnet',                 value: 'sonnet' },
          { name: 'opus (most capable)',    value: 'opus' },
          { name: 'haiku (fastest)',        value: 'haiku' },
        ],
        default: 'inherit',
      },
      {
        type: 'confirm',
        name: 'readOnly',
        message: `  Make ${agent} read-only (no file writes)?`,
        default: agent === 'code-reviewer' || agent === 'debugger' || agent === 'security-audit',
      },
      {
        type: 'confirm',
        name: 'proactive',
        message: `  Should Claude proactively use ${agent} without being asked?`,
        default: agent === 'code-reviewer',
      },
    ]);
    agentDetails[agent] = details;
  }

  return { selectedAgents, agentDetails };
}

// ─── Step: Skills ─────────────────────────────────────────────────────────────

async function promptSkills(detected, stepN, totalSteps) {
  step(stepN, totalSteps, 'Skills Configuration');
  info('Skills are custom slash commands you can invoke with /skill-name.\n');

  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Which skills to create?',
      choices: [
        { name: '/pr-summary     — Summarize PR changes with AI context',      value: 'pr-summary',    checked: true },
        { name: '/explain        — Explain code with diagrams and analogies',  value: 'explain',       checked: false },
        { name: '/test-gen       — Generate tests for a file or function',     value: 'test-gen',      checked: false },
        { name: '/todo           — Create structured TODO from a feature req', value: 'todo',          checked: false },
        { name: '/review         — Full code review with checklist',           value: 'review',        checked: false },
        { name: '/optimize       — Analyze and optimize code performance',     value: 'optimize',      checked: false },
        { name: '/changelog      — Generate CHANGELOG entry from git log',     value: 'changelog',     checked: false },
        { name: '/scaffold       — Scaffold a new component/module',           value: 'scaffold',      checked: false },
      ],
    },
  ]);

  return { selectedSkills };
}

// ─── Step: MCP ────────────────────────────────────────────────────────────────

async function promptMcp(stepN, totalSteps) {
  step(stepN, totalSteps, 'MCP Servers');
  info('MCP servers give Claude access to external tools and services.\n');

  const { servers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'servers',
      message: 'Which MCP servers to configure?',
      choices: [
        { name: 'GitHub — PR review, issues, code search',         value: 'github',     checked: false },
        { name: 'Filesystem — Extended file access',               value: 'filesystem', checked: false },
        { name: 'Brave Search — Web search capability',            value: 'brave',      checked: false },
        { name: 'Slack — Read/write Slack messages',               value: 'slack',      checked: false },
        { name: 'PostgreSQL — Direct database queries',            value: 'postgres',   checked: false },
        { name: 'Playwright — Browser automation/testing',         value: 'playwright', checked: false },
        { name: 'None / I\'ll configure manually',                 value: 'none',       checked: true },
      ],
    },
  ]);

  const mcpDetails = {};
  const filteredServers = servers.filter(s => s !== 'none');

  if (filteredServers.includes('github')) {
    const d = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: '  GitHub token env var name:',
        default: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      },
    ]);
    mcpDetails.github = d;
  }

  if (filteredServers.includes('postgres')) {
    const d = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: '  PostgreSQL connection URL env var:',
        default: 'DATABASE_URL',
      },
    ]);
    mcpDetails.postgres = d;
  }

  if (filteredServers.includes('brave')) {
    const d = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: '  Brave API key env var:',
        default: 'BRAVE_API_KEY',
      },
    ]);
    mcpDetails.brave = d;
  }

  return { servers: filteredServers, mcpDetails };
}

module.exports = {
  promptProjectInfo,
  promptComponents,
  promptClaudeMd,
  promptSettings,
  promptRules,
  promptHooks,
  promptAgents,
  promptSkills,
  promptMcp,
};
