# 🌸 Tomo's Configuration System

A comprehensive guid## 🎯 Permission Resolution Logic

1. **Owner Check** 👑 → Always allow (server owner bypass)
2. **Command Disabled** ❌ → Deny immediately  
3. **Blacklist Check** 🚫 → Deny if user role is blacklisted
4. **Public Command** 🌍 → Allow if command is marked public
5. **Whitelist Check** ✨ → Allow if user role is whitelisted
6. **Global Staff** 🛡️ → Allow if user has global staff role
7. **Default Deny** 💔 → Deny access

---

## 💖 Additional Configuration Features

### 🎀 Channel Settings
* **Logs Channel:** 📝 Where moderation actions are logged
* **Appeals Channel:** 🆘 Where ban appeals are posted for staff review

### 🌸 Appeal System Settings
* **Appeal URL:** 🔗 Web form URL for banned users
* **Appeal Port:** 🌐 Port for the web server (default: 3000)
* **Rate Limiting:** ⏱️ Prevents spam submissions

### ✨ Auto-Discovery Features
* **Command Registration:** 🔄 Automatically detects new commands
* **Public Detection:** 🌍 Reads `isPublic` property from command files
* **Permission Sync:** 🔧 Updates command permissions automatically

### 🎛️ Interactive Management
* **Config Panel:** 📊 `/config` command opens interactive interface
* **Real-time Updates:** ⚡ Changes take effect immediately
* **Visual Feedback:** 👀 Clear status indicators and confirmations

Example Configuration Structure:

```json
{
  "staffRoles": ["roleId1", "roleId2"],
  "logsChannelId": "channelId",
  "appealsChannelId": "channelId", 
  "commands": {
    "ban": {
      "enabled": true,
      "isPublic": false,
      "whitelist": ["roleId"],
      "blacklist": []
    },
    "help": {
      "enabled": true,
      "isPublic": true,
      "whitelist": [],
      "blacklist": []
    }
  }
}
```

---

## 🌟 Usage Tips

### 🎀 Best Practices
* Use **global staff roles** for most commands 🛡️
* Reserve **whitelists** for sensitive admin commands ✨
* Use **blacklists** for temporary restrictions 🚫
* Mark appropriate commands as **public** 🌍

### 💕 Management Workflow
1. Set up global staff roles first 🛡️
2. Configure logs and appeals channels 📝
3. Review auto-discovered commands 🔍
4. Adjust individual command permissions as needed ⚙️
5. Test with different role combinations ✅

*Made with 💖 by Tomo - Your cute moderation assistant!* 🌸 your cute Discord moderation bot! 💖

## 🛡️ Global Staff Roles

* List of roles considered as **staff** (e.g., moderators, admins) ✨
* Staff roles get default command permissions **unless overridden** 🎀
* **Note:** Per-command blacklist takes priority over global staff roles 🚫

Example:

```yaml
staff_roles:
  - Moderator 🔨
  - Admin 👑
  - Helper 💝
```

---

## ⚙️ Command Configuration

### Per Command Settings 💕

* **Enabled:** 🎛️ Boolean to enable or disable the command
* **Public:** 🌍 Whether the command is available to everyone or staff-only 🛡️
* **Whitelist Roles:** ✨ Roles explicitly allowed to use the command
* **Blacklist Roles:** 🚫 Roles explicitly forbidden to use the command
* **Overrides:** 🎯

  * Blacklist roles override global staff roles 🚫
  * Whitelist roles grant access even if not in staff roles (unless blacklisted) ✨
  * Public commands are available to everyone (unless blacklisted) 🌍

Example:

```yaml
commands:
  ban:
    enabled: true ✅
    isPublic: false 🛡️
    whitelist_roles:
      - Moderator 🔨
      - Admin 👑
    blacklist_roles:
      - Trial-Moderator 🚫
  help:
    enabled: true ✅
    isPublic: true 🌍
    whitelist_roles: []
    blacklist_roles: []
```

---

## 3. Permission Resolution Logic

1. Check if command is enabled.
2. Check if user role is in command’s blacklist → deny immediately.
3. Check if user role is in command’s whitelist → allow.
4. Check if user role is in global staff roles → allow.
5. Else, deny.

---

## 4. Additional Config Ideas (Optional)

* **Command Cooldowns:** Per-command cooldown durations.
* **Command Specific Settings:** E.g., default mute duration, ban reasons.
* **Logging Channels:** For mod actions.
* **Notification Settings:** DM users on mod actions or not.
