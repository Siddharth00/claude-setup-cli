'use strict';

const path = require('path');
const chalk = require('chalk');

const { analyze }          = require('./analyzer');
const prompts              = require('./prompts');
const claudeMdGen          = require('./generators/claude-md');
const settingsGen          = require('./generators/settings');
const rulesGen             = require('./generators/rules');
const agentsGen            = require('./generators/agents');
const skillsGen            = require('./generators/skills');
const hooksGen             = require('./generators/hooks');
const mcpGen               = require('./generators/mcp');
const {
  banner, step, info, success, warn, error, divider,
  writeFile, ensureDir, appendToGitignore,
} = require('./utils');

async function main() {
  banner();

  const cwd = process.cwd();

  // ── Analyze codebase ─────────────────────────────────────────────────────────
  console.log(chalk.bold('\n  Analyzing your codebase...\n'));
  const detected = analyze(cwd);
  printDetected(detected);

  const { proceed } = await require('inquirer').prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Proceed with setup?',
    default: true,
  }]);

  if (!proceed) {
    console.log(chalk.gray('\n  Setup cancelled.\n'));
    process.exit(0);
  }

  // ── Determine total steps ────────────────────────────────────────────────────
  // Step 1: project info, Step 2: component selection, then per-component steps
  const TOTAL_STEPS = 9; // max, will use subset

  // ── Step 1: Project info ─────────────────────────────────────────────────────
  const projectInfo = await prompts.promptProjectInfo(detected, TOTAL_STEPS);

  // ── Step 2: Component selection ──────────────────────────────────────────────
  const components = await prompts.promptComponents(TOTAL_STEPS);

  if (components.length === 0) {
    console.log(chalk.yellow('\n  No components selected. Exiting.\n'));
    process.exit(0);
  }

  // ── Collect answers per component ────────────────────────────────────────────
  let stepN = 3;
  const collected = {};

  if (components.includes('claude_md')) {
    collected.claudeMd = await prompts.promptClaudeMd(detected, projectInfo, stepN++, TOTAL_STEPS);
  }
  if (components.includes('settings')) {
    collected.settings = await prompts.promptSettings(detected, stepN++, TOTAL_STEPS);
  }
  if (components.includes('rules')) {
    collected.rules = await prompts.promptRules(detected, stepN++, TOTAL_STEPS);
  }
  if (components.includes('hooks')) {
    collected.hooks = await prompts.promptHooks(detected, stepN++, TOTAL_STEPS);
  }
  if (components.includes('agents')) {
    const r = await prompts.promptAgents(detected, stepN++, TOTAL_STEPS);
    collected.agents = r;
  }
  if (components.includes('skills')) {
    const r = await prompts.promptSkills(detected, stepN++, TOTAL_STEPS);
    collected.skills = r;
  }
  if (components.includes('mcp')) {
    const r = await prompts.promptMcp(stepN++, TOTAL_STEPS);
    collected.mcp = r;
  }

  // ── Preview ──────────────────────────────────────────────────────────────────
  console.log('\n');
  divider();
  console.log(chalk.bold.white('  Files to be created:'));
  divider();

  const preview = buildPreview(components, collected, detected);
  for (const [file, status] of preview) {
    console.log(`  ${chalk.cyan(file.padEnd(55))} ${status}`);
  }

  console.log('');

  const { confirmWrite } = await require('inquirer').prompt([{
    type: 'confirm',
    name: 'confirmWrite',
    message: 'Create these files?',
    default: true,
  }]);

  if (!confirmWrite) {
    console.log(chalk.gray('\n  Aborted — no files written.\n'));
    process.exit(0);
  }

  // ── Generate files ────────────────────────────────────────────────────────────
  console.log('');
  divider();
  console.log(chalk.bold.white('  Writing files...\n'));

  const claudeDir = path.join(cwd, '.claude');
  ensureDir(claudeDir);

  const written = [];
  const skipped = [];

  // CLAUDE.md
  if (components.includes('claude_md') && collected.claudeMd) {
    const content = claudeMdGen.generate(projectInfo, collected.claudeMd, detected);
    const filePath = path.join(cwd, 'CLAUDE.md');
    const ok = writeFile(filePath, content);
    ok ? written.push('CLAUDE.md') : skipped.push('CLAUDE.md');
  }

  // settings.json
  if (components.includes('settings') && collected.settings) {
    // Merge hook settings into settings.json if hooks selected
    let settingsContent = JSON.parse(settingsGen.generate(collected.settings));

    if (components.includes('hooks') && collected.hooks) {
      const hookResult = hooksGen.generate(collected.hooks, detected);
      if (Object.keys(hookResult.settingsHooks).length > 0) {
        settingsContent.hooks = hookResult.settingsHooks;
      }
      // Write hook scripts
      const hooksDir = path.join(claudeDir, 'hooks');
      ensureDir(hooksDir);
      for (const [name, scriptContent] of Object.entries(hookResult.scripts)) {
        const scriptPath = path.join(hooksDir, name);
        const ok = writeFile(scriptPath, scriptContent);
        if (ok) {
          // Make executable
          try { require('fs').chmodSync(scriptPath, 0o755); } catch { /* ignore */ }
          written.push(`.claude/hooks/${name}`);
        } else {
          skipped.push(`.claude/hooks/${name}`);
        }
      }
    }

    const settingsPath = path.join(claudeDir, 'settings.json');
    const ok = writeFile(settingsPath, JSON.stringify(settingsContent, null, 2));
    ok ? written.push('.claude/settings.json') : skipped.push('.claude/settings.json');
  }

  // Rules
  if (components.includes('rules') && collected.rules) {
    const ruleFiles = rulesGen.generate(collected.rules.ruleFiles, detected);
    const rulesDir = path.join(claudeDir, 'rules');
    ensureDir(rulesDir);
    for (const [name, content] of Object.entries(ruleFiles)) {
      const filePath = path.join(rulesDir, `${name}.md`);
      const ok = writeFile(filePath, content);
      ok ? written.push(`.claude/rules/${name}.md`) : skipped.push(`.claude/rules/${name}.md`);
    }
  }

  // Agents
  if (components.includes('agents') && collected.agents) {
    const agentFiles = agentsGen.generate(
      collected.agents.selectedAgents,
      collected.agents.agentDetails
    );
    const agentsDir = path.join(claudeDir, 'agents');
    ensureDir(agentsDir);
    for (const [name, content] of Object.entries(agentFiles)) {
      const filePath = path.join(agentsDir, `${name}.md`);
      const ok = writeFile(filePath, content);
      ok ? written.push(`.claude/agents/${name}.md`) : skipped.push(`.claude/agents/${name}.md`);
    }
  }

  // Skills
  if (components.includes('skills') && collected.skills) {
    const skillFiles = skillsGen.generate(collected.skills.selectedSkills);
    for (const [name, content] of Object.entries(skillFiles)) {
      const skillDir = path.join(claudeDir, 'skills', name);
      ensureDir(skillDir);
      const filePath = path.join(skillDir, 'SKILL.md');
      const ok = writeFile(filePath, content);
      ok ? written.push(`.claude/skills/${name}/SKILL.md`) : skipped.push(`.claude/skills/${name}/SKILL.md`);
    }
  }

  // Hooks (without settings — already handled above if settings also selected)
  if (components.includes('hooks') && !components.includes('settings') && collected.hooks) {
    const hookResult = hooksGen.generate(collected.hooks, detected);

    // Write scripts
    const hooksDir = path.join(claudeDir, 'hooks');
    ensureDir(hooksDir);
    for (const [name, scriptContent] of Object.entries(hookResult.scripts)) {
      const scriptPath = path.join(hooksDir, name);
      const ok = writeFile(scriptPath, scriptContent);
      if (ok) {
        try { require('fs').chmodSync(scriptPath, 0o755); } catch { /* ignore */ }
        written.push(`.claude/hooks/${name}`);
      } else {
        skipped.push(`.claude/hooks/${name}`);
      }
    }

    // Merge into any existing settings.json or create minimal one
    const settingsPath = path.join(claudeDir, 'settings.json');
    let existingSettings = {};
    try {
      existingSettings = JSON.parse(require('fs').readFileSync(settingsPath, 'utf8'));
    } catch { /* fresh */ }

    if (Object.keys(hookResult.settingsHooks).length > 0) {
      existingSettings.hooks = {
        ...existingSettings.hooks,
        ...hookResult.settingsHooks,
      };
      const ok = writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), { overwrite: true });
      if (ok) written.push('.claude/settings.json (hooks added)');
    }
  }

  // MCP
  if (components.includes('mcp') && collected.mcp) {
    const mcpContent = mcpGen.generate(collected.mcp.servers, collected.mcp.mcpDetails);
    if (mcpContent) {
      const mcpPath = path.join(claudeDir, '.mcp.json');
      const ok = writeFile(mcpPath, mcpContent);
      ok ? written.push('.claude/.mcp.json') : skipped.push('.claude/.mcp.json');
    }
  }

  // .gitignore
  if (components.includes('gitignore')) {
    const gitignoreLines = [
      '.claude/settings.local.json',
      '.claude/.mcp-local.json',
      '.claude/agent-memory-local/',
      '.claude/tool-log.jsonl',
    ];
    const updated = appendToGitignore(cwd, gitignoreLines);
    updated ? written.push('.gitignore (updated)') : skipped.push('.gitignore (already has Claude entries)');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('');
  divider();
  console.log(chalk.bold.white('  Setup Complete!\n'));

  if (written.length > 0) {
    console.log(chalk.bold.green('  Created:'));
    for (const f of written) success(f);
  }

  if (skipped.length > 0) {
    console.log('');
    console.log(chalk.bold.yellow('  Skipped (already exist):'));
    for (const f of skipped) warn(f);
  }

  console.log('');
  divider();
  printNextSteps(components, collected, detected);
  console.log('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printDetected(d) {
  const items = [
    ['Language',        d.language],
    ['Framework',       d.framework],
    ['Package Manager', d.packageManager],
    ['Test Tool',       d.testTool],
    ['Build Tool',      d.buildTool],
    ['Formatter',       d.formatter],
    ['Linter',          d.linter],
    ['Database',        d.database],
    ['Dev command',     d.commands.dev],
    ['Build command',   d.commands.build],
    ['Test command',    d.commands.test],
  ];
  for (const [label, value] of items) {
    if (value) {
      console.log(`  ${chalk.gray(label.padEnd(18))} ${chalk.white(value)}`);
    }
  }
  if (d.infra && d.infra.length > 0) {
    console.log(`  ${chalk.gray('Infra'.padEnd(18))} ${chalk.white(d.infra.join(', '))}`);
  }
  console.log('');
}

function buildPreview(components, collected, detected) {
  const items = [];
  if (components.includes('claude_md'))
    items.push(['CLAUDE.md', chalk.green('create')]);
  if (components.includes('settings'))
    items.push(['.claude/settings.json', chalk.green('create')]);

  if (components.includes('rules') && collected.rules) {
    for (const r of (collected.rules.ruleFiles || [])) {
      items.push([`.claude/rules/${r}.md`, chalk.green('create')]);
    }
  }
  if (components.includes('agents') && collected.agents) {
    for (const a of (collected.agents.selectedAgents || [])) {
      items.push([`.claude/agents/${a}.md`, chalk.green('create')]);
    }
  }
  if (components.includes('skills') && collected.skills) {
    for (const s of (collected.skills.selectedSkills || [])) {
      items.push([`.claude/skills/${s}/SKILL.md`, chalk.green('create')]);
    }
  }
  if (components.includes('hooks') && collected.hooks) {
    const hookResult = hooksGen.generate(collected.hooks, detected);
    for (const name of Object.keys(hookResult.scripts)) {
      items.push([`.claude/hooks/${name}`, chalk.green('create')]);
    }
  }
  if (components.includes('mcp') && collected.mcp &&
      collected.mcp.servers.filter(s => s !== 'none').length > 0) {
    items.push(['.claude/.mcp.json', chalk.green('create')]);
  }
  if (components.includes('gitignore'))
    items.push(['.gitignore', chalk.yellow('update')]);

  return items;
}

function printNextSteps(components, collected, detected) {
  console.log(chalk.bold.white('  Next Steps:\n'));

  let n = 1;

  if (components.includes('settings')) {
    info(`${n++}. Review .claude/settings.json — adjust permissions as needed`);
  }
  if (components.includes('mcp') && collected.mcp?.servers?.length > 0) {
    info(`${n++}. Set environment variables for MCP servers (check .claude/.mcp.json)`);
  }
  if (components.includes('agents') && collected.agents?.selectedAgents?.length > 0) {
    info(`${n++}. Try an agent: ${chalk.cyan(`@"${collected.agents.selectedAgents[0]} (agent)" review this file`)}`);
  }
  if (components.includes('skills') && collected.skills?.selectedSkills?.length > 0) {
    info(`${n++}. Try a skill: ${chalk.cyan(`/${collected.skills.selectedSkills[0]}`)}`);
  }
  if (components.includes('claude_md')) {
    info(`${n++}. Run ${chalk.cyan('/init')} inside Claude Code to auto-improve your CLAUDE.md`);
  }

  info(`${n++}. Open Claude Code: ${chalk.cyan('claude')} in your project directory`);
  info(`${n++}. Run ${chalk.cyan('/memory')} to view loaded context and memory`);
  info(`${n++}. Run ${chalk.cyan('/permissions')} to review active permission rules`);
}

main().catch(err => {
  console.error(chalk.red('\n  Error: ' + err.message));
  process.exit(1);
});
