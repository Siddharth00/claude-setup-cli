'use strict';

const fs = require('fs');
const path = require('path');
const { readJSON, readFile, listFiles } = require('./utils');

// ─── Language detection ───────────────────────────────────────────────────────

const LANG_SIGNALS = {
  'package.json':        'JavaScript/TypeScript',
  'pyproject.toml':      'Python',
  'requirements.txt':    'Python',
  'setup.py':            'Python',
  'Cargo.toml':          'Rust',
  'go.mod':              'Go',
  'pom.xml':             'Java',
  'build.gradle':        'Java/Kotlin',
  'build.gradle.kts':    'Kotlin',
  'Gemfile':             'Ruby',
  'composer.json':       'PHP',
  '*.csproj':            'C#',
  '*.sln':               'C#',
  'Package.swift':       'Swift',
  'pubspec.yaml':        'Dart/Flutter',
  'mix.exs':             'Elixir',
};

function detectLanguage(cwd) {
  for (const [file, lang] of Object.entries(LANG_SIGNALS)) {
    if (file.startsWith('*')) {
      // glob check - look for matching extension
      try {
        const ext = file.slice(1);
        const entries = fs.readdirSync(cwd);
        if (entries.some(e => e.endsWith(ext))) return lang;
      } catch { /* ignore */ }
    } else if (fs.existsSync(path.join(cwd, file))) {
      return lang;
    }
  }
  // fallback: count source files
  const extCounts = {};
  try {
    const files = listFiles(cwd, 1);
    for (const f of files) {
      const ext = path.extname(f.name);
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
  } catch { /* ignore */ }
  const topExt = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0];
  if (topExt) {
    const map = { '.ts': 'TypeScript', '.js': 'JavaScript', '.py': 'Python',
                  '.rs': 'Rust', '.go': 'Go', '.rb': 'Ruby', '.java': 'Java' };
    return map[topExt[0]] || 'Unknown';
  }
  return 'Unknown';
}

// ─── Framework detection ──────────────────────────────────────────────────────

function detectFramework(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };

  const checks = [
    ['next',        'Next.js'],
    ['nuxt',        'Nuxt.js'],
    ['@sveltejs/kit', 'SvelteKit'],
    ['svelte',      'Svelte'],
    ['@angular/core', 'Angular'],
    ['vue',         'Vue.js'],
    ['react',       'React'],
    ['express',     'Express'],
    ['fastify',     'Fastify'],
    ['@nestjs/core','NestJS'],
    ['hono',        'Hono'],
    ['remix',       '@remix-run/react'],
    ['astro',       'Astro'],
    ['gatsby',      'Gatsby'],
    ['electron',    'Electron'],
    ['tauri',       'Tauri'],
  ];

  for (const [pkg, name] of checks) {
    if (deps[pkg]) return name;
  }

  // Python frameworks from pyproject.toml / requirements.txt
  const reqFile = readFile(path.join(cwd, 'requirements.txt')) ||
                  readFile(path.join(cwd, 'pyproject.toml')) || '';
  if (reqFile.includes('django'))   return 'Django';
  if (reqFile.includes('fastapi'))  return 'FastAPI';
  if (reqFile.includes('flask'))    return 'Flask';
  if (reqFile.includes('starlette')) return 'Starlette';

  // Rust
  const cargoToml = readFile(path.join(cwd, 'Cargo.toml')) || '';
  if (cargoToml.includes('actix-web'))  return 'Actix Web';
  if (cargoToml.includes('axum'))       return 'Axum';
  if (cargoToml.includes('rocket'))     return 'Rocket';
  if (cargoToml.includes('tauri'))      return 'Tauri';

  // Go
  const goMod = readFile(path.join(cwd, 'go.mod')) || '';
  if (goMod.includes('gin-gonic/gin')) return 'Gin';
  if (goMod.includes('gofiber/fiber')) return 'Fiber';
  if (goMod.includes('labstack/echo')) return 'Echo';

  return null;
}

// ─── Package manager detection ────────────────────────────────────────────────

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, 'bun.lockb')))        return 'bun';
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml')))   return 'pnpm';
  if (fs.existsSync(path.join(cwd, 'yarn.lock')))        return 'yarn';
  if (fs.existsSync(path.join(cwd, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(cwd, 'package.json')))     return 'npm';
  return null;
}

// ─── Build/test tool detection ────────────────────────────────────────────────

function detectTestTool(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };
  if (deps['vitest'])  return 'vitest';
  if (deps['jest'])    return 'jest';
  if (deps['mocha'])   return 'mocha';
  if (deps['jasmine']) return 'jasmine';
  if (deps['ava'])     return 'ava';

  if (fs.existsSync(path.join(cwd, 'pytest.ini')) ||
      fs.existsSync(path.join(cwd, 'setup.cfg')))         return 'pytest';

  const pyproject = readFile(path.join(cwd, 'pyproject.toml')) || '';
  if (pyproject.includes('pytest'))  return 'pytest';
  if (pyproject.includes('unittest')) return 'unittest';

  if (fs.existsSync(path.join(cwd, 'Cargo.toml')))        return 'cargo test';
  if (fs.existsSync(path.join(cwd, 'go.mod')))            return 'go test';
  if (fs.existsSync(path.join(cwd, 'Gemfile')))           return 'rspec/minitest';

  return null;
}

function detectBuildTool(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };
  if (deps['vite'])        return 'vite';
  if (deps['turbo'])       return 'turbo';
  if (deps['webpack'])     return 'webpack';
  if (deps['rollup'])      return 'rollup';
  if (deps['esbuild'])     return 'esbuild';
  if (deps['parcel'])      return 'parcel';
  if (deps['tsc'] || deps['typescript']) return 'tsc';
  return null;
}

function detectFormatter(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };
  if (deps['prettier'])     return 'prettier';
  if (deps['biome'])        return 'biome';

  const pyproject = readFile(path.join(cwd, 'pyproject.toml')) || '';
  if (pyproject.includes('black'))  return 'black';
  if (pyproject.includes('ruff'))   return 'ruff';

  if (fs.existsSync(path.join(cwd, '.prettierrc')) ||
      fs.existsSync(path.join(cwd, '.prettierrc.json')) ||
      fs.existsSync(path.join(cwd, 'prettier.config.js'))) return 'prettier';

  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) return 'rustfmt';
  if (fs.existsSync(path.join(cwd, 'go.mod')))     return 'gofmt';

  return null;
}

function detectLinter(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };
  if (deps['eslint'])  return 'eslint';
  if (deps['biome'])   return 'biome';
  if (deps['oxlint'])  return 'oxlint';

  const pyproject = readFile(path.join(cwd, 'pyproject.toml')) || '';
  if (pyproject.includes('ruff'))   return 'ruff';
  if (pyproject.includes('flake8')) return 'flake8';
  if (pyproject.includes('pylint')) return 'pylint';

  if (fs.existsSync(path.join(cwd, '.eslintrc.js')) ||
      fs.existsSync(path.join(cwd, '.eslintrc.json')) ||
      fs.existsSync(path.join(cwd, 'eslint.config.js'))) return 'eslint';

  return null;
}

// ─── Scripts extraction ───────────────────────────────────────────────────────

function extractScripts(pkgJson) {
  const scripts = (pkgJson && pkgJson.scripts) || {};
  const result = {};

  const devKeys   = ['dev', 'start', 'develop', 'serve'];
  const buildKeys = ['build', 'compile', 'bundle'];
  const testKeys  = ['test', 'test:unit', 'test:e2e', 'check'];
  const lintKeys  = ['lint', 'lint:fix'];
  const fmtKeys   = ['format', 'fmt', 'prettier'];

  for (const key of devKeys)   { if (scripts[key]) { result.dev   = scripts[key]; break; } }
  for (const key of buildKeys) { if (scripts[key]) { result.build = scripts[key]; break; } }
  for (const key of testKeys)  { if (scripts[key]) { result.test  = scripts[key]; break; } }
  for (const key of lintKeys)  { if (scripts[key]) { result.lint  = scripts[key]; break; } }
  for (const key of fmtKeys)   { if (scripts[key]) { result.format = scripts[key]; break; } }

  return result;
}

// ─── Database / ORM detection ─────────────────────────────────────────────────

function detectDatabase(cwd, pkgJson) {
  const deps = {
    ...((pkgJson && pkgJson.dependencies) || {}),
    ...((pkgJson && pkgJson.devDependencies) || {}),
  };
  const orms = ['prisma', 'drizzle-orm', 'typeorm', 'sequelize', 'mongoose',
                'mikro-orm', 'knex', 'objection', 'bookshelf'];
  for (const orm of orms) {
    if (deps[orm]) return orm;
  }
  if (fs.existsSync(path.join(cwd, 'prisma/schema.prisma'))) return 'prisma';
  return null;
}

// ─── Infrastructure detection ─────────────────────────────────────────────────

function detectInfra(cwd) {
  const infra = [];
  if (fs.existsSync(path.join(cwd, 'Dockerfile')))           infra.push('Docker');
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml')) ||
      fs.existsSync(path.join(cwd, 'docker-compose.yaml')))  infra.push('Docker Compose');
  if (fs.existsSync(path.join(cwd, '.github/workflows')))    infra.push('GitHub Actions');
  if (fs.existsSync(path.join(cwd, '.gitlab-ci.yml')))       infra.push('GitLab CI');
  if (fs.existsSync(path.join(cwd, 'Jenkinsfile')))          infra.push('Jenkins');
  if (fs.existsSync(path.join(cwd, 'terraform')))            infra.push('Terraform');
  if (fs.existsSync(path.join(cwd, 'kubernetes')) ||
      fs.existsSync(path.join(cwd, 'k8s')))                  infra.push('Kubernetes');
  return infra;
}

// ─── Project type ─────────────────────────────────────────────────────────────

function detectProjectType(framework, pkgJson, cwd) {
  if (!framework) {
    // Guess from structure
    if (fs.existsSync(path.join(cwd, 'src/app')) ||
        fs.existsSync(path.join(cwd, 'app')))      return 'web-app';
    if (pkgJson && pkgJson.bin)                    return 'cli-tool';
    if (pkgJson && pkgJson.main && !pkgJson.scripts?.dev) return 'library';
    return 'project';
  }
  const webFrameworks = ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js',
                         'SvelteKit', 'Svelte', 'Astro', 'Gatsby', 'Remix'];
  const apiFrameworks = ['Express', 'Fastify', 'NestJS', 'Hono', 'Django',
                         'FastAPI', 'Flask', 'Gin', 'Fiber', 'Echo', 'Actix Web', 'Axum'];
  if (webFrameworks.includes(framework)) return 'web-app';
  if (apiFrameworks.includes(framework)) return 'api';
  if (framework === 'Electron' || framework === 'Tauri') return 'desktop-app';
  return 'project';
}

// ─── Main analyzer ────────────────────────────────────────────────────────────

function analyze(cwd) {
  const pkgJson   = readJSON(path.join(cwd, 'package.json'));
  const language  = detectLanguage(cwd);
  const framework = detectFramework(cwd, pkgJson);
  const pkgMgr    = detectPackageManager(cwd);
  const testTool  = detectTestTool(cwd, pkgJson);
  const buildTool = detectBuildTool(cwd, pkgJson);
  const formatter = detectFormatter(cwd, pkgJson);
  const linter    = detectLinter(cwd, pkgJson);
  const scripts   = extractScripts(pkgJson);
  const db        = detectDatabase(cwd, pkgJson);
  const infra     = detectInfra(cwd);
  const projectType = detectProjectType(framework, pkgJson, cwd);

  const name = (pkgJson && pkgJson.name) || path.basename(cwd);
  const description = (pkgJson && pkgJson.description) || '';

  // Build smart default commands
  const pm = pkgMgr || 'npm';
  const run = (pm === 'npm') ? 'npm run' : (pm === 'bun' ? 'bun run' : pm + ' run');

  const commands = {
    dev:    scripts.dev    ? `${run} ${Object.keys((pkgJson?.scripts||{})).find(k => (pkgJson?.scripts||{})[k] === scripts.dev) || 'dev'}` : null,
    build:  scripts.build  ? `${run} ${Object.keys((pkgJson?.scripts||{})).find(k => (pkgJson?.scripts||{})[k] === scripts.build) || 'build'}` : null,
    test:   scripts.test   ? `${run} ${Object.keys((pkgJson?.scripts||{})).find(k => (pkgJson?.scripts||{})[k] === scripts.test) || 'test'}` : inferTestCommand(testTool, language),
    lint:   scripts.lint   ? `${run} ${Object.keys((pkgJson?.scripts||{})).find(k => (pkgJson?.scripts||{})[k] === scripts.lint) || 'lint'}` : null,
    format: scripts.format ? `${run} ${Object.keys((pkgJson?.scripts||{})).find(k => (pkgJson?.scripts||{})[k] === scripts.format) || 'format'}` : inferFormatCommand(formatter),
  };

  // Clean up null commands
  Object.keys(commands).forEach(k => { if (!commands[k]) delete commands[k]; });

  return {
    name,
    description,
    language,
    framework,
    projectType,
    packageManager: pkgMgr,
    testTool,
    buildTool,
    formatter,
    linter,
    database: db,
    infra,
    commands,
    hasTypeScript: language === 'TypeScript' ||
      (pkgJson && !!(pkgJson.dependencies?.typescript || pkgJson.devDependencies?.typescript)),
    isMonorepo: fs.existsSync(path.join(cwd, 'packages')) ||
                fs.existsSync(path.join(cwd, 'apps')) ||
                !!(pkgJson && pkgJson.workspaces),
  };
}

function inferTestCommand(testTool, language) {
  if (testTool === 'pytest')      return 'pytest';
  if (testTool === 'cargo test')  return 'cargo test';
  if (testTool === 'go test')     return 'go test ./...';
  if (testTool === 'jest')        return 'jest';
  if (testTool === 'vitest')      return 'vitest';
  return null;
}

function inferFormatCommand(formatter) {
  if (formatter === 'prettier')  return 'prettier --write .';
  if (formatter === 'black')     return 'black .';
  if (formatter === 'ruff')      return 'ruff format .';
  if (formatter === 'rustfmt')   return 'cargo fmt';
  if (formatter === 'gofmt')     return 'gofmt -w .';
  if (formatter === 'biome')     return 'biome format --write .';
  return null;
}

module.exports = { analyze };
