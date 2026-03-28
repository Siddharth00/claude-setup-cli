'use strict';

const RULES = {
  'code-style': (detected) => {
    const lang = detected.language || 'JavaScript/TypeScript';
    const isTS = lang.includes('TypeScript') || detected.hasTypeScript;
    const isPy = lang.includes('Python');
    const isRust = lang.includes('Rust');
    const isGo = lang.includes('Go');

    const paths = isTS  ? ['src/**/*.ts', 'src/**/*.tsx'] :
                  isPy  ? ['**/*.py'] :
                  isRust? ['src/**/*.rs'] :
                  isGo  ? ['**/*.go'] :
                          ['src/**/*.js', 'src/**/*.jsx'];

    return `---
paths:
${paths.map(p => `  - "${p}"`).join('\n')}
---

# Code Style Rules

${isTS ? `## TypeScript
- Use \`const\` by default; \`let\` only when reassignment is needed
- Avoid \`any\` — use \`unknown\` or proper types instead
- Prefer interfaces for object shapes, type aliases for unions/primitives
- Use \`readonly\` for immutable properties
- Explicit return types on public functions
- Use \`satisfies\` operator to validate types without widening` : ''}

${isPy ? `## Python
- Follow PEP 8 — 4-space indentation, 79 char line limit
- Use type hints on all function signatures
- Prefer \`pathlib.Path\` over \`os.path\`
- Use f-strings over \`.format()\` or \`%\`
- Use \`dataclasses\` or \`pydantic\` for data models
- Never use bare \`except:\` — always specify the exception type` : ''}

${isGo ? `## Go
- Follow \`gofmt\` conventions
- Error handling must be explicit — never ignore returned errors
- Use short variable names for small scopes, descriptive for package-level
- Prefer table-driven tests
- Document all exported symbols` : ''}

${isRust ? `## Rust
- Follow \`rustfmt\` style (cargo fmt)
- Use \`Result<T, E>\` for recoverable errors; reserve panics for unrecoverable states
- Follow Clippy suggestions
- Prefer iterators over manual loops
- Use \`#[derive]\` for common traits where possible` : ''}

## General
- Keep functions/methods under 50 lines where possible
- One responsibility per function
- Descriptive names over comments (the code should read like documentation)
- Add comments only for non-obvious logic ("why" not "what")
`;
  },

  'testing': (detected) => {
    const testTool = detected.testTool || 'your test framework';
    return `---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "tests/**/*"
  - "__tests__/**/*"
---

# Testing Rules

## Conventions
- Test files: \`*.test.ts\` / \`*.spec.ts\` co-located with source, or in \`__tests__/\`
- Test function naming: \`it('should <do something> when <condition>')\`
- Group related tests under descriptive \`describe\` blocks

## What to Test
- Every exported function/class must have at least one test
- Test the happy path, error paths, and edge cases
- Test behavior (what the function does), not implementation (how it does it)
- Prefer integration tests over mocking internal code

## Tools: ${testTool}
- Run full suite: \`${detected.commands?.test || `${testTool}`}\`
- Run a single file: pass the file path as argument
- Use \`--watch\` mode during development

## What NOT to Do
- Do not test private/internal methods directly
- Do not mock the module under test
- Do not write tests that pass by testing constants
- Do not use \`any\` type in test assertions (TypeScript)
- Avoid snapshot tests for logic — use explicit assertions
`;
  },

  'security': () => `---
paths:
  - "src/**/*"
  - "api/**/*"
  - "server/**/*"
---

# Security Rules

## Input Validation
- Validate and sanitize ALL external inputs (user input, API responses, env vars)
- Use parameterized queries or ORM methods — never string-concatenate SQL
- Validate file paths — prevent directory traversal attacks (\`../\` sequences)

## Secrets
- Never log secrets, tokens, passwords, or PII
- Never hardcode credentials — use environment variables
- Never commit \`.env\` files — commit \`.env.example\` instead
- Rotate credentials if they are accidentally exposed

## Authentication & Authorization
- Authenticate before authorizing
- Use principle of least privilege for database and service accounts
- Validate JWT signatures and expiry; never trust unverified payloads
- Rate-limit authentication endpoints

## Dependencies
- Do not add packages without reviewing their \`npm audit\` / \`cargo audit\` status
- Prefer well-maintained packages with recent security updates
- Pin dependency versions in lockfiles

## HTTP / API
- Set appropriate CORS headers — do not use \`*\` in production
- Always use HTTPS in production
- Set Content-Security-Policy headers for web apps
- Never expose stack traces or internal errors to clients
`,

  'git': () => `# Git & PR Conventions

## Commits
- Use conventional commits format: \`type(scope): description\`
  - Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`
  - Example: \`feat(auth): add OAuth2 login support\`
- Keep commits atomic — one logical change per commit
- Write commit messages in imperative mood ("add feature" not "added feature")
- Reference issue numbers: \`fix(api): correct null handling (#123)\`

## Branches
- Feature branches: \`feat/short-description\`
- Bug fixes: \`fix/short-description\`
- Chores: \`chore/short-description\`
- Never commit directly to \`main\`/\`master\`

## Pull Requests
- PR title follows commit convention
- Include "why" in the description, not just "what"
- Link related issues
- Keep PRs focused — one concern per PR
- All tests must pass before merging
`,

  'framework': (detected) => {
    const fw = detected.framework;
    if (!fw) return null;

    const templates = {
      'Next.js': `# Next.js Rules

## Routing
- Use App Router (\`app/\`) for new features; avoid mixing with Pages Router
- Co-locate page-specific components in the same directory
- Use \`layout.tsx\` for shared UI; \`loading.tsx\` and \`error.tsx\` for states

## Data Fetching
- Prefer Server Components for data fetching — avoid unnecessary client components
- Use \`fetch\` with proper caching options in Server Components
- Use React Query or SWR only for real-time / frequently-updating client data

## Performance
- Use \`next/image\` for all images — never raw \`<img>\` tags
- Use \`next/font\` for fonts
- Mark components \`"use client"\` only when truly needed (event handlers, hooks, browser APIs)
`,
      'React': `# React Rules

## Components
- Prefer functional components with hooks
- Keep components under 200 lines — extract subcomponents when larger
- One component per file
- Use \`React.memo\` only when you measure a performance problem

## State
- Lift state up to the nearest common ancestor
- Use \`useState\` for local UI state, \`useReducer\` for complex state logic
- Avoid prop drilling > 2 levels — use Context or state management

## Hooks
- Custom hooks must start with \`use\`
- Call hooks at the top level — never in conditionals or loops
- Include all dependencies in \`useEffect\` dependency arrays
`,
      'Django': `# Django Rules

## Models
- Keep business logic in models/services, not views
- Always add \`__str__\` methods to models
- Use \`select_related\` / \`prefetch_related\` to avoid N+1 queries

## Views
- Use class-based views for CRUD; function-based for simple endpoints
- Never access \`request.POST\` directly — use Forms or DRF Serializers
- Always validate and clean input before saving

## Security
- Use Django's CSRF protection — never disable it
- Use \`get_object_or_404\` over manual queries in views
- Never render user input directly in templates — use \`|safe\` sparingly
`,
      'FastAPI': `# FastAPI Rules

## Routing
- Group related routes in \`APIRouter\` modules
- Use Pydantic models for all request/response bodies
- Use dependency injection (\`Depends\`) for shared logic like auth and DB sessions

## Performance
- Use \`async\` endpoints for I/O-bound operations
- Use background tasks for fire-and-forget operations
- Index database columns used in queries

## Error Handling
- Raise \`HTTPException\` with appropriate status codes
- Use custom exception handlers for consistent error responses
`,
    };

    const content = templates[fw];
    if (!content) return null;

    return `---
paths:
  - "src/**/*"
  - "app/**/*"
---

${content}`;
  },

  'database': (detected) => {
    const db = detected.database || 'your ORM';
    return `# Database Rules

## ORM: ${db}
- Never write raw SQL unless absolutely necessary — use ORM query builders
- Always use transactions for multi-step writes
- Use migrations for ALL schema changes — never alter the database manually

## Query Performance
- Add indexes for columns used in \`WHERE\`, \`JOIN\`, and \`ORDER BY\` clauses
- Avoid N+1 queries — use \`include\` / \`select_related\` / \`join\` eagerly
- Use \`explain\` / \`EXPLAIN ANALYZE\` to debug slow queries

## Data Integrity
- Enforce constraints at the database level (unique, not null, foreign keys)
- Use soft deletes (\`deleted_at\`) rather than hard deletes where appropriate
- Back up before running destructive migrations

## Prisma-specific (if applicable)
- Run \`prisma generate\` after schema changes
- Use \`prisma migrate dev\` in development, \`prisma migrate deploy\` in production
- Avoid \`prisma.$executeRaw\` unless parameterized
`;
  },
};

function generate(selectedRules, detected) {
  const result = {};
  for (const rule of selectedRules) {
    const gen = RULES[rule];
    if (gen) {
      const content = gen(detected);
      if (content) result[rule] = content;
    }
  }
  return result;
}

module.exports = { generate };
