'use strict';

function generate(answers) {
  const { defaultMode, model, allowedBash, deniedBash } = answers;

  const settings = {
    model,
    defaultMode,
    permissions: {
      allow: [],
      deny:  [],
    },
  };

  // Always allow Read by default
  settings.permissions.allow.push('Read');

  if (Array.isArray(allowedBash)) {
    settings.permissions.allow.push(...allowedBash);
  }
  if (Array.isArray(deniedBash)) {
    settings.permissions.deny.push(...deniedBash);
  }

  return JSON.stringify(settings, null, 2);
}

module.exports = { generate };
