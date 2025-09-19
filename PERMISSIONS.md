# 🌸 Tomo's Command Permission System Documentation

## 💖 Overview
Tomo uses a cute yet powerful hierarchical permission system that allows for fine-grained control over command access with the following priority order:

1. **Command Blacklist** 🚫 (highest priority - always blocks)
2. **Command Whitelist** ✨ (if exists, only these roles can use)
3. **Global Staff Roles** 🛡️ (fallback if no command-specific rules)
4. **Command Enabled/Disabled** 🎀 (base toggle)

## 🎯 Permission Hierarchy

### 1. Owner Bypass 👑
- Server owners bypass ALL restrictions
- Always allowed to use any command

### 2. Command Blacklist 🚫 (Highest Priority)
- If a user has ANY blacklisted role, they are BLOCKED
- Overrides whitelist and global staff roles
- Use for permanently blocking certain roles

### 3. Command Whitelist ✨ (Overrides Global Staff)
- If whitelist exists and user has ANY whitelisted role, they are ALLOWED
- If whitelist exists and user has NO whitelisted roles, they are BLOCKED
- Completely overrides global staff roles when present

### 4. Global Staff Roles 🛡️ (Fallback)
- If no command-specific whitelist exists, falls back to global staff roles
- Users with global staff roles can use the command
- Default permission system

### 5. Command Disabled 🎀
- If command is disabled, nobody can use it (except owner)

## 💕 Usage Examples

### Example 1: Basic Staff Command 🌸
```javascript
// Command: /moderation
// Global staff: @Moderator, @Admin
// Whitelist: None
// Blacklist: None
// Enabled: Yes

// Result: @Moderator and @Admin can use the command
```

### Example 2: Restricted Command with Whitelist ✨
```javascript
// Command: /admin-panel
// Global staff: @Moderator, @Admin
// Whitelist: @Admin
// Blacklist: None
// Enabled: Yes

// Result: Only @Admin can use (whitelist overrides global staff)
```

### Example 3: Command with Blacklist 🚫
```javascript
// Command: /ban
// Global staff: @Moderator, @Admin
// Whitelist: None
// Blacklist: @Trial-Moderator
// Enabled: Yes

// Result: @Admin and @Moderator can use, but @Trial-Moderator cannot
```

### Example 4: Complex Setup 🎀
```javascript
// Command: /database
// Global staff: @Moderator, @Admin
// Whitelist: @Admin, @Developer
// Blacklist: @Suspended-Staff
// Enabled: Yes

// Results:
// @Admin: ✅ Allowed (in whitelist)
// @Developer: ✅ Allowed (in whitelist)
// @Moderator: ❌ Blocked (not in whitelist)
// @Admin + @Suspended-Staff: ❌ Blocked (blacklist overrides whitelist)
```

## 🔧 Integration in Commands

### Basic Integration 💖
```javascript
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('Your command description'),

  async execute(interaction) {
    // Check permissions first
    const hasPermission = await permissionChecker.requirePermission(interaction, 'yourcommand');
    if (!hasPermission) return; // Permission checker handles the error message

    // Your command logic here
    await interaction.reply('Command executed successfully! 🌸');
  },
};
```

### Advanced Permission Checking ✨
```javascript
// Just check without responding
const hasPermission = await permissionChecker.hasPermission(interaction, 'commandname');

// Get detailed permission info for debugging
const details = await permissionChecker.getPermissionDetails(interaction, 'commandname');
console.log(details);
```

## 🎛️ Configuration Interface

### Management Hierarchy 💕
1. **Commands Section** 📊 - View all commands with their permission status
2. **Command Management** 🔧 - Select specific command for detailed management
3. **Permission Actions** ⚙️ - Add/remove roles from whitelist/blacklist

### Interface Features 🎀
- 📊 **Visual Status**: Clear display of enabled/disabled commands
- 📝 **Whitelist Display**: Shows all whitelisted roles
- 🚫 **Blacklist Display**: Shows all blacklisted roles
- 🎛️ **Quick Toggle**: Enable/disable commands quickly
- 🔧 **Detailed Management**: Per-command role management

## 💖 Management Commands

### Global Staff Roles 🛡️
- Use the Staff Roles section to manage global staff
- These apply to all commands unless overridden

### Command-Specific Permissions ✨
1. Go to Commands section
2. Select "Manage Command" for detailed control
3. Use Add/Remove buttons for whitelist/blacklist
4. Toggle command on/off as needed

## 🌸 Best Practices

### 1. Use Global Staff for Most Commands 💕
- Set up @Moderator, @Admin in global staff
- Only use command-specific permissions when needed

### 2. Whitelist for Sensitive Commands ✨
- Admin-only commands: Add only @Admin to whitelist
- Developer commands: Add @Developer to whitelist

### 3. Blacklist for Temporary Restrictions 🚫
- Suspended staff: Add to blacklist for sensitive commands
- Trial roles: Blacklist from dangerous commands

### 4. Regular Review 🎀
- Periodically review command permissions
- Remove inactive roles from lists
- Update permissions as staff structure changes

## 🆘 Troubleshooting

### "No permission" Error 🚫
1. Check if command is enabled
2. Verify user has required roles
3. Check blacklist doesn't block user
4. Ensure whitelist includes user (if whitelist exists)

### Command Not Working 💔
1. Verify command is enabled
2. Check permission configuration
3. Review logs for permission details
4. Test with server owner account

### Permission Not Taking Effect 🔄
1. Role changes require user to rejoin voice/text channels
2. Check role hierarchy in Discord
3. Verify bot has permission to see roles
4. Check for typos in role configuration

## 🔧 Technical Details

### Data Structure 💾
```json
{
  "commands": {
    "commandname": {
      "enabled": true,
      "whitelist": ["roleId1", "roleId2"],
      "blacklist": ["roleId3"]
    }
  },
  "staffRoles": ["globalRoleId1", "globalRoleId2"]
}
```

### Permission Check Flow 🌸
1. Owner check → Allow 👑
2. Command disabled → Block 🚫
3. Blacklist check → Block if match ❌
4. Whitelist exists → Allow only if match ✨
5. Global staff → Allow if match 🛡️
6. Default → Block 💔

This system provides maximum flexibility while maintaining clear, predictable behavior! 💖✨