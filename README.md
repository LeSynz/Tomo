# 🌸 Tomo - Advanced Discord Moderation Bot

A feature-rich Discord moderation bot with a cute pink aesthetic, built with Discord.js v14. Tomo provides comprehensive moderation tools, appeal systems, and administrative controls with a user-friendly interface.

## ✨ Features

### 🛡️ Moderation System
- **Ban/Unban**: Advanced ban system with case tracking and appeal integration
- **Case Management**: Automatic case ID generation and logging
- **Moderation Statistics**: Detailed stats for individual moderators and servers
- **Case History**: Complete moderation logs with searchable history
- **Role Hierarchy**: Respects Discord's role hierarchy for safety

### 📝 Appeal System
- **Web-Based Appeals**: Beautiful, responsive appeal form with dark theme
- **Security**: Prevents duplicate and fraudulent appeals
- **Discord Integration**: Appeals posted directly to staff channels
- **Status Tracking**: Pending, approved, and denied appeal states
- **Anti-Spam**: Rate limiting and duplicate prevention

### ⚙️ Configuration Management
- **Permission System**: Granular command permissions with whitelist/blacklist
- **Staff Roles**: Global staff role management
- **Channel Settings**: Configurable logs and appeals channels
- **Auto-Discovery**: Automatic command registration and configuration

### 🎨 User Experience
- **Cute Aesthetic**: Pink theme with friendly messages and emojis
- **Interactive UI**: Discord buttons, select menus, and modals
- **Help System**: Comprehensive help with action buttons
- **Error Handling**: Graceful error messages and recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 16.11.0 or higher
- Discord Bot Token
- MongoDB (optional, uses JSON files by default)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tomo-bot.git
   cd tomo-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   APPEAL_URL=http://localhost:3000
   APPEAL_PORT=3000
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Initial Setup**
   - Invite the bot to your server with Administrator permissions
   - Use `/config` to set up staff roles and channels
   - Configure command permissions as needed

## 📚 Commands

### 🛡️ Moderation Commands

#### `/ban <user> [reason] [delete_messages]`
Bans a user from the server with optional message deletion.

**Parameters:**
- `user` - The user to ban (required)
- `reason` - Reason for the ban (optional)
- `delete_messages` - Days of messages to delete (0-7, optional)

**Features:**
- Automatic case ID generation
- DM notification with appeal link
- Comprehensive permission checks
- Moderation logging

#### `/unban <user> [reason]`
Unbans a previously banned user.

**Parameters:**
- `user` - The user to unban (required)
- `reason` - Reason for the unban (optional)

#### `/modstats [moderator]`
View moderation statistics for yourself or another moderator.

**Parameters:**
- `moderator` - Specific moderator to view (optional, defaults to yourself)

**Shows:**
- Actions by type (mutes, bans, kicks, warns)
- Time periods (7 days, 30 days, all time)
- Activity summary and trends

#### `/modlogs [user] [limit]`
View case history for yourself or another user.

**Parameters:**
- `user` - User whose history to view (optional, defaults to yourself)
- `limit` - Number of cases to show (1-20, default: 10)

**Features:**
- Complete case history with details
- Chronological ordering (newest first)
- Pagination for large histories
- Case summary statistics

### ⚙️ Configuration Commands

#### `/config`
Opens the main configuration interface with interactive buttons.

**Sections:**
- **General**: Basic bot settings and information
- **Staff**: Manage staff roles and permissions
- **Commands**: Configure command permissions and access
- **Logs**: Set up logging channels
- **Appeals**: Configure the appeal system

### 💬 General Commands

#### `/help`
Displays comprehensive help information with interactive navigation.

**Features:**
- Categorized command listing
- Interactive button navigation
- Support and refresh options
- Detailed command descriptions

#### `/afk [reason]`
Set yourself as away from keyboard with an optional reason.

**Parameters:**
- `reason` - Why you're going AFK (optional)

## 🔧 Configuration Guide

### Initial Setup

1. **Invite the Bot**
   Generate an invite link with Administrator permissions:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands
   ```

2. **Configure Staff Roles**
   ```
   /config → Staff → Add Role
   ```
   Select roles that should have moderation permissions.

3. **Set Up Channels**
   ```
   /config → Logs → Set Channel (for moderation logs)
   /config → Appeals → Set Channel (for ban appeals)
   ```

4. **Configure Commands**
   ```
   /config → Commands → Manage Commands
   ```
   Set permissions for individual commands.

### Permission System

Tomo uses a comprehensive permission system with multiple layers:

#### Permission Hierarchy (highest to lowest):
1. **Server Owner** - Bypasses all restrictions (temporarily disabled)
2. **Global Staff Roles** - Roles configured in `/config → Staff`
3. **Command Whitelist** - Specific roles allowed for each command
4. **Public Commands** - Commands marked as public access

#### Permission Checks:
- **Blacklist Override** - Users with blacklisted roles are always denied
- **Whitelist Priority** - Staff roles can use whitelisted commands
- **Public Access** - Some commands are available to everyone
- **Default Deny** - Unknown users/roles are denied by default

### Appeal System Configuration

1. **Set Appeals Channel**
   ```
   /config → Appeals → Set Channel
   ```

2. **Configure Web Server**
   Ensure these environment variables are set:
   ```env
   APPEAL_URL=https://yourdomain.com
   APPEAL_PORT=3000
   ```

3. **Appeal Workflow**
   - User gets banned → Receives DM with appeal link
   - User fills appeal form → Posted to appeals channel
   - Staff use buttons to approve/deny → User gets notified

## 🏗️ Project Structure

```
tomo-bot/
├── commands/          # Slash commands
│   ├── general/       # Public commands (help, afk)
│   ├── moderation/    # Mod commands (ban, unban, stats)
│   └── util/          # Utility commands (config)
├── data/              # JSON database files
├── events/            # Discord.js event handlers
├── handlers/          # Component handlers
├── helpers/           # Utility functions
├── interactions/      # Discord interactions
│   ├── buttons/       # Button interactions
│   ├── menus/         # Select menu interactions
│   └── modals/        # Modal form interactions
├── models/            # Data models and database
├── utils/             # Shared utilities
├── web/               # Appeal system web server
│   ├── public/        # Static files (CSS, JS)
│   └── views/         # HTML templates
└── index.js           # Main bot entry point
```

## 🗄️ Database Schema

### Moderation Actions
```json
{
  "type": "ban|unban|mute|unmute|kick|warn",
  "userId": "123456789012345678",
  "moderatorId": "123456789012345678",
  "reason": "Rule violation",
  "duration": "1h|1d|permanent",
  "caseId": "0001",
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

### Appeals
```json
{
  "caseId": "0001",
  "userId": "123456789012345678",
  "reason": "Why ban should be lifted",
  "learned": "What they learned",
  "comments": "Additional comments",
  "contact": "Alternative contact info",
  "status": "pending|approved|denied",
  "submittedAt": "2023-12-01T12:00:00.000Z",
  "processedAt": "2023-12-01T13:00:00.000Z",
  "processedBy": "123456789012345678"
}
```

### Configuration
```json
{
  "id": "global",
  "staffRoles": ["role_id_1", "role_id_2"],
  "logsChannelId": "123456789012345678",
  "appealsChannelId": "123456789012345678",
  "commands": {
    "ban": {
      "enabled": true,
      "isPublic": false,
      "whitelist": [],
      "blacklist": []
    }
  }
}
```

## 🔌 API Reference

### Models

#### ModerationActionModel
- `logAction(data)` - Log a new moderation action
- `getCase(caseId)` - Get a specific case
- `getUserCases(userId)` - Get all cases for a user
- `getStatistics()` - Get server-wide statistics
- `getModeratorStatistics(moderatorId)` - Get moderator statistics

#### AppealModel
- `submitAppeal(data)` - Submit a new appeal
- `hasActivePendingAppeal(caseId, userId)` - Check for existing appeals
- `updateAppealStatus(caseId, userId, status, processedBy)` - Update appeal
- `getAppealHistory(userId)` - Get user's appeal history

#### ConfigModel
- `getConfig()` - Get current configuration
- `setConfig(data)` - Update configuration
- `checkCommandPermission(command, userRoles, isOwner)` - Check permissions
- `registerCommand(name, isPublic, enabled)` - Register new command

### Utilities

#### PermissionChecker
- `requirePermission(interaction, command)` - Enforce command permissions
- `checkCommandPermission(interaction, command)` - Check without enforcing
- `hasPermission(interaction, command)` - Simple boolean check

#### Logger
- `info(message, data)` - Log information
- `error(message, error)` - Log errors
- `warn(message, data)` - Log warnings

## 🎨 Customization

### Theming
The bot uses a consistent pink theme defined in:
- **Color**: `0xFFB6C1` (Light Pink)
- **Emojis**: 🌸, 💖, 💕, ✨, 🎀
- **Tone**: Friendly, cute, supportive

### Adding Commands

1. **Create Command File**
   ```javascript
   // commands/category/newcommand.js
   const { SlashCommandBuilder } = require('discord.js');
   
   module.exports = {
     data: new SlashCommandBuilder()
       .setName('newcommand')
       .setDescription('Description here'),
     isPublic: false, // true for public commands
     
     async execute(interaction) {
       // Command logic here
     }
   };
   ```

2. **Add Permission Check** (for staff commands)
   ```javascript
   const permissionChecker = require('../../utils/permissionChecker');
   
   async execute(interaction) {
     const hasPermission = await permissionChecker.requirePermission(interaction, 'newcommand');
     if (!hasPermission) return;
     
     // Command logic here
   }
   ```

### Adding Interactions

1. **Button Interactions**
   ```javascript
   // interactions/buttons/newbutton.js
   module.exports = {
     customId: 'newbutton', // or regex: /^newbutton_\d+$/
     async execute(interaction) {
       // Button logic here
     }
   };
   ```

2. **Modal Interactions**
   ```javascript
   // interactions/modals/newmodal.js
   module.exports = {
     customId: 'newmodal',
     async execute(interaction) {
       // Modal logic here
     }
   };
   ```

## 🐛 Troubleshooting

### Common Issues

#### Bot Not Responding
1. Check bot token in `.env`
2. Verify bot has necessary permissions
3. Check console for error messages
4. Ensure bot is online in Discord

#### Commands Not Working
1. Check if commands are registered: `/config → Commands`
2. Verify user has required permissions
3. Check if command is enabled in configuration
4. Review blacklist/whitelist settings

#### Appeal System Issues
1. Verify appeals channel is set: `/config → Appeals`
2. Check web server is running (port 3000 by default)
3. Ensure `APPEAL_URL` environment variable is correct
4. Check browser console for JavaScript errors

#### Permission Errors
1. Verify staff roles are configured: `/config → Staff`
2. Check command-specific permissions: `/config → Commands`
3. Ensure user has required Discord permissions
4. Review bot's role hierarchy position

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Coding Standards
- Use consistent indentation (2 spaces)
- Add JSDoc comments for functions
- Follow Discord.js v14 best practices
- Include error handling
- Maintain the cute/friendly tone

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **There is none:** seriously, theres no support.

## 🙏 Acknowledgments

- User who provided feedback
- The Discord community for inspiration lol

---

*Made with 💖 by [Synz](https://synz.xyz/)*
