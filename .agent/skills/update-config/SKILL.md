---
name: update-config
description: Configure the Claude Code harness via settings.json. Automated behaviors like recurring tasks, hooks, and custom settings require configuration in settings.json.
---

# Update Config

Manage Claude Code settings and configuration through settings.json.

## Common Configurations

- **Hooks** – Automated scripts that run on events
- **Settings** – Custom behavior and preferences
- **Shortcuts** – Keyboard mappings and command aliases
- **MCP servers** – External service integrations
- **Permissions** – Access control and security

## File Location

Configuration lives in `~/.claude/settings.json` and project-specific `settings.local.json`.

## What You Can Configure

```json
{
  "hooks": {
    "before-commit": "npm run lint",
    "after-save": "npm run format"
  },
  "settings": {
    "editor": "vim",
    "shell": "bash"
  },
  "permissions": {
    "bash": true,
    "downloads": false
  }
}
```

## Common Automations

- Run linter before git commits
- Format code after file save
- Deploy on push to main branch
- Run tests on file change

Use this skill to set up your custom Claude Code environment!
