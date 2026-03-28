'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// ─── Display helpers ──────────────────────────────────────────────────────────

function header(text) {
  console.log('\n' + chalk.bold.cyan('┌─ ' + text + ' '));
}

function step(n, total, text) {
  console.log('\n' + chalk.bold.white(`[${n}/${total}] `) + chalk.bold(text));
}

function info(text) {
  console.log(chalk.gray('  › ') + text);
}

function success(text) {
  console.log(chalk.green('  ✓ ') + text);
}

function warn(text) {
  console.log(chalk.yellow('  ⚠ ') + text);
}

function error(text) {
  console.log(chalk.red('  ✗ ') + text);
}

function divider() {
  console.log(chalk.gray('─'.repeat(60)));
}

function banner() {
  console.clear();
  console.log(chalk.bold.cyan(`
  ╔═══════════════════════════════════════╗
  ║        Claude Code Setup Wizard       ║
  ║   Scaffold your project in minutes    ║
  ╚═══════════════════════════════════════╝
`));
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function writeFile(filePath, content, { overwrite = false } = {}) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(filePath) && !overwrite) {
    return false; // skipped
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true; // written
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function appendToGitignore(cwd, lines) {
  const gitignorePath = path.join(cwd, '.gitignore');
  let existing = '';
  if (fs.existsSync(gitignorePath)) {
    existing = fs.readFileSync(gitignorePath, 'utf8');
  }
  const toAdd = lines.filter(l => !existing.includes(l));
  if (toAdd.length === 0) return false;

  const section = '\n# Claude Code\n' + toAdd.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, existing + section, 'utf8');
  return true;
}

function listFiles(dir, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      results.push({ name: entry.name, path: full, isDir: entry.isDirectory() });
      if (entry.isDirectory() && currentDepth < maxDepth) {
        results.push(...listFiles(full, maxDepth, currentDepth + 1));
      }
    }
  } catch { /* ignore permission errors */ }
  return results;
}

module.exports = {
  header, step, info, success, warn, error, divider, banner,
  exists, readJSON, readFile, writeFile, ensureDir, appendToGitignore, listFiles,
};
