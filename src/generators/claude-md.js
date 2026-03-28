'use strict';

function generate(projectInfo, answers, detected) {
  const {
    name, description, language, framework, projectType,
  } = projectInfo;

  const {
    devCommand, buildCommand, testCommand, lintCommand, formatCommand,
    indentation, hasTests, testDir, srcDir,
    conventions, architecture, dontDo, envVars,
  } = answers;

  const lines = [];

  lines.push(`# ${name}`);
  lines.push('');

  if (description) {
    lines.push(description);
    lines.push('');
  }

  // Tech stack section
  lines.push('## Tech Stack');
  lines.push('');
  if (language)   lines.push(`- **Language**: ${language}`);
  if (framework)  lines.push(`- **Framework**: ${framework}`);
  if (detected.packageManager) lines.push(`- **Package Manager**: ${detected.packageManager}`);
  if (detected.testTool)       lines.push(`- **Testing**: ${detected.testTool}`);
  if (detected.buildTool)      lines.push(`- **Build**: ${detected.buildTool}`);
  if (detected.formatter)      lines.push(`- **Formatter**: ${detected.formatter}`);
  if (detected.linter)         lines.push(`- **Linter**: ${detected.linter}`);
  if (detected.database)       lines.push(`- **Database**: ${detected.database}`);
  if (detected.infra && detected.infra.length > 0) {
    lines.push(`- **Infra**: ${detected.infra.join(', ')}`);
  }
  lines.push('');

  // Commands section
  const hasAnyCommand = devCommand || buildCommand || testCommand || lintCommand || formatCommand;
  if (hasAnyCommand) {
    lines.push('## Commands');
    lines.push('');

    if (devCommand) {
      lines.push('### Development');
      lines.push('```bash');
      lines.push(devCommand);
      lines.push('```');
      lines.push('');
    }
    if (buildCommand) {
      lines.push('### Build');
      lines.push('```bash');
      lines.push(buildCommand);
      lines.push('```');
      lines.push('');
    }
    if (testCommand) {
      lines.push('### Test');
      lines.push('```bash');
      lines.push(testCommand);
      lines.push('```');
      lines.push('');
    }
    if (lintCommand) {
      lines.push('### Lint');
      lines.push('```bash');
      lines.push(lintCommand);
      lines.push('```');
      lines.push('');
    }
    if (formatCommand) {
      lines.push('### Format');
      lines.push('```bash');
      lines.push(formatCommand);
      lines.push('```');
      lines.push('');
    }
  }

  // Project structure
  lines.push('## Project Structure');
  lines.push('');
  if (srcDir) lines.push(`- \`${srcDir}\` — Main source code`);
  if (hasTests && testDir) lines.push(`- \`${testDir}\` — Tests`);
  if (detected.database) lines.push(`- \`prisma/\` or \`migrations/\` — Database schema & migrations`);
  lines.push('');

  // Code style
  lines.push('## Code Style');
  lines.push('');
  lines.push(`- **Indentation**: ${indentation}`);

  if (language === 'TypeScript' || language === 'JavaScript/TypeScript') {
    lines.push('- Use `const` over `let`; avoid `var`');
    lines.push('- Prefer `async/await` over `.then()` chains');
    if (detected.hasTypeScript) {
      lines.push('- Use explicit types; avoid `any`');
      lines.push('- Prefer interfaces over type aliases for object shapes');
    }
  } else if (language === 'Python') {
    lines.push('- Follow PEP 8');
    lines.push('- Use type hints for function signatures');
    lines.push('- Prefer `pathlib` over `os.path`');
  } else if (language === 'Go') {
    lines.push('- Follow standard Go conventions (`gofmt`)');
    lines.push('- Error handling must be explicit — never ignore errors');
    lines.push('- Use interfaces for dependency injection');
  } else if (language === 'Rust') {
    lines.push('- Follow `rustfmt` style');
    lines.push('- Prefer `Result<T, E>` over panics for recoverable errors');
    lines.push('- Use `clippy` suggestions');
  }

  if (conventions) {
    lines.push('');
    lines.push('### Additional Conventions');
    conventions.trim().split('\n').forEach(l => lines.push(l));
  }
  lines.push('');

  // Testing
  if (hasTests) {
    lines.push('## Testing');
    lines.push('');
    lines.push(`- Run \`${testCommand || 'tests'}\` before committing`);
    if (testDir) lines.push(`- Tests live in \`${testDir}\``);
    lines.push('- Each new function/feature needs a corresponding test');
    lines.push('- Prefer integration tests over mocking where practical');
    lines.push('');
  }

  // Architecture
  if (architecture) {
    lines.push('## Architecture');
    lines.push('');
    architecture.trim().split('\n').forEach(l => lines.push(l));
    lines.push('');
  }

  // Environment variables
  if (envVars) {
    lines.push('## Environment Variables');
    lines.push('');
    const vars = envVars.split(',').map(v => v.trim()).filter(Boolean);
    for (const v of vars) {
      lines.push(`- \`${v}\``);
    }
    lines.push('');
    lines.push('Copy `.env.example` to `.env` and fill in values before running.');
    lines.push('');
  }

  // Do NOT
  if (dontDo) {
    lines.push('## Important — Do NOT');
    lines.push('');
    const items = dontDo.split(',').map(v => v.trim()).filter(Boolean);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Workflow
  lines.push('## Workflow');
  lines.push('');
  lines.push('1. Read relevant source files before making changes');
  lines.push('2. Make focused, incremental changes');
  if (hasTests) lines.push('3. Run tests after changes');
  if (lintCommand) lines.push(`${hasTests ? '4' : '3'}. Lint before finalizing: \`${lintCommand}\``);
  lines.push('- Ask for clarification if the requirements are ambiguous');
  lines.push('- Prefer editing existing files over creating new ones');
  lines.push('');

  return lines.join('\n');
}

module.exports = { generate };
