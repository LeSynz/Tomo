# 🌸 Tomo's Public Commands & Auto-Discovery System

This document explains how Tomo's cute and powerful public command system works! 💖

## ✨ Overview

Tomo supports both **staff-only** 🛡️ and **public** 🌍 commands with automatic discovery and classification. Commands are automatically registered based on their `isPublic` property.

## 🎯 Permission Hierarchy

Tomo's permission system follows this priority order:

1. **Owner** 👑 - Bot owner always has access
2. **Blacklist** 🚫 - Explicitly denied users/roles (overrides everything else)
3. **Whitelist** ✨ - Explicitly allowed users/roles for staff commands
4. **Public** 🌍 - Commands marked as public are available to everyone
5. **Staff** 🛡️ - Default staff permissions apply
6. **Deny** 💔 - Access denied

## 💕 Creating Commands

### Staff-Only Command (Default) 🛡️
```javascript
const { SlashCommandBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('A moderation command for staff only.'),

  // isPublic: false, // Optional - this is the default behavior

  async execute(interaction) {
    // Always check permissions first
    const hasPermission = await permissionChecker.requirePermission(interaction, 'moderation');
    if (!hasPermission) return;

    // Your command logic here
    await interaction.reply('Moderation action completed! 🌸');
  },
};
```

### Public Command 🌍
```javascript
const { SlashCommandBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help information.'),

  // Mark this command as public - available to all users by default
  isPublic: true,

  async execute(interaction) {
    // Still check permissions (allows public access for this command)
    const hasPermission = await permissionChecker.requirePermission(interaction, 'help');
    if (!hasPermission) return;

    // Your command logic here
    await interaction.reply('Here\'s how to use Tomo! 💖');
  },
};
```

## 🔄 Auto-Discovery

Tomo automatically discovers and registers commands when she starts up:

- **New commands** ✨ are automatically detected and registered
- **Public status** 🌍 is determined by the `isPublic` property in the command file
- **Existing commands** 🛡️ are preserved with their current settings

### Manual Command Management 🎛️

Use the `/config` command to access Tomo's configuration panel:

1. **🔄 Refresh Commands** - Re-scan all commands and update their public status
2. **🔍 Discover Commands** - Find and register new commands only
3. **⚙️ Manage Individual Commands** - Toggle enabled/public status and manage permissions

## 💖 Examples

### Public Commands (Everyone Can Use) 🌍
- `/help` 🆘 - Get bot help and information
- `/afk` 😴 - Set AFK status
- `/avatar` 🖼️ - View user avatars
- `/serverinfo` 📊 - Get server information

### Staff Commands (Requires Staff Role) 🛡️
- `/config` ⚙️ - Access configuration panel
- `/moderation` 🔨 - Moderation tools
- `/ban` 🚫 - Ban management
- `/logs` 📝 - View logs

## 🎀 Configuration Interface

Tomo's configuration panel shows:
- ✅ **Enabled** / ❌ **Disabled** status
- 🌍 **Public** / 🛡️ **Staff** access level
- 📝 Command descriptions
- ⚙️ Management buttons for each command

### Per-Command Settings 💕

Each command can be configured individually:
- **Enable/Disable** 🎛️ - Turn the command on or off
- **Public/Staff** 🌍🛡️ - Change access level
- **Whitelist** ✨ - Add specific users/roles who can use staff commands
- **Blacklist** 🚫 - Add specific users/roles who cannot use the command

## 🌸 Best Practices

1. **Always use permissionChecker** 🔧 - Even for public commands
2. **Set isPublic appropriately** 🎯 - Think about who should use each command
3. **Test permission changes** ✅ - Use the config panel to verify settings
4. **Document command purposes** 📝 - Clear descriptions help with management
5. **Regular audits** 🔍 - Review public commands periodically for security

## 💫 Migration Guide

If you have existing commands:

1. **Add `isPublic: true`** ✨ to commands that should be public
2. **Restart Tomo** 🔄 to trigger auto-discovery
3. **Use "Refresh Commands"** 🎛️ in the config panel to update existing commands
4. **Review settings** 👀 in the configuration interface

## 🆘 Troubleshooting

- **Command not appearing?** 🔍 - Check the console for auto-discovery logs
- **Wrong permission level?** 🔄 - Use "Refresh Commands" to update from file
- **Permission denied?** 🚫 - Check blacklist/whitelist settings in config
- **Auto-discovery not working?** 💔 - Ensure the `isPublic` property is set correctly in your command files

## 🔒 Security Notes

- Public commands can still be disabled per-server 🛡️
- Blacklist always overrides public access 🚫
- Staff commands require explicit whitelisting for non-staff users ✨
- Owner always has access to all commands 👑