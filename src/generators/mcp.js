'use strict';

const MCP_SERVER_CONFIGS = {
  github: (details) => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-github@latest'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: `\${${details.token || 'GITHUB_PERSONAL_ACCESS_TOKEN'}}`,
    },
  }),
  filesystem: () => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-filesystem@latest', '.'],
  }),
  brave: (details) => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-brave-search@latest'],
    env: {
      BRAVE_API_KEY: `\${${details.apiKey || 'BRAVE_API_KEY'}}`,
    },
  }),
  slack: () => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-slack@latest'],
    env: {
      SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}',
      SLACK_TEAM_ID: '${SLACK_TEAM_ID}',
    },
  }),
  postgres: (details) => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-postgres@latest'],
    env: {
      DATABASE_URL: `\${${details.url || 'DATABASE_URL'}}`,
    },
  }),
  playwright: () => ({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
  }),
};

function generate(servers, mcpDetails) {
  if (!servers || servers.length === 0) return null;

  const config = { servers: {} };

  for (const server of servers) {
    if (server === 'none') continue;
    const configFn = MCP_SERVER_CONFIGS[server];
    if (configFn) {
      config.servers[server] = configFn(mcpDetails[server] || {});
    }
  }

  if (Object.keys(config.servers).length === 0) return null;

  return JSON.stringify(config, null, 2);
}

module.exports = { generate };
