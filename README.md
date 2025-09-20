# 🌸 Tomo - Advanced Discord Moderation Bot

A feature-rich Discord moderation bot with a cute pink aesthetic, built with Discord.js v14. Tomo provides comprehensive moderation tools, appeal systems, and administrative controls with a user-friendly interface.

## ✨ Features

### 🛡️ Moderation System
- **Ban/Unban**: Advanced ban system with case tracking and appeal integration
- **Kick System**: User removal with hierarchy checks and case logging
- **Warning System**: Comprehensive warning management with automated escalation
- **Channel Management**: Lock/unlock channels with permission management
- **Slowmode Control**: Rate limiting with smart duration parsing
- **Automod Integration**: Automatic punishments based on warning thresholds
- **Case Management**: Automatic case ID generation and comprehensive logging
- **Search & Discovery**: Powerful log search with filtering and pagination
- **Staff Notes**: Private annotation system for user tracking
- **User Information**: Comprehensive user profiles with moderation history
- **Moderation Statistics**: Detailed stats for individual moderators and servers
- **Case History**: Complete moderation logs with searchable history
- **Role Hierarchy**: Respects Discord's role hierarchy for safety

### 📝 Appeal System
- **Discord Invite-Based Appeals**: Users join a Discord server to submit appeals
- **Customizable Ban Messages**: Template system with variables for personalized ban notifications
- **Appeal Integration**: Ban messages include direct links to appeal servers when enabled
- **System Toggles**: Enable/disable appeals system server-wide
- **Anti-Spam**: Built-in prevention of duplicate and fraudulent appeals

### ⚙️ Configuration Management
- **Permission System**: Granular command permissions with whitelist/blacklist
- **Staff Roles**: Global staff role management
- **Automod Rules**: Configurable warning thresholds with automatic punishments
- **Channel Settings**: Configurable logs channels and appeal system
- **Auto-Discovery**: Automatic command registration and configuration
- **Scalable Interface**: Paginated command management for unlimited commands

### 🎨 User Experience
- **Cute Aesthetic**: Pink theme with friendly messages and emojis
- **Interactive UI**: Discord buttons, select menus, and modals with seamless navigation
- **Help System**: Comprehensive help with action buttons
- **Customizable Templates**: Personalize ban messages with variables and custom styling
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
- DM notification with custom ban template and appeal link
- Comprehensive permission checks
- Moderation logging
- Customizable ban message with variables

#### `/unban <user> [reason]`
Unbans a previously banned user.

**Parameters:**
- `user` - The user to unban (required)
- `reason` - Reason for the unban (optional)

#### `/warn <user> [reason]`
Issues a warning to a user with automatic automod integration.

**Parameters:**
- `user` - The user to warn (required)
- `reason` - Reason for the warning (optional)

**Features:**
- Automatic case ID generation
- DM notification to warned user
- Automod threshold checking
- Automatic punishment escalation (mute/kick/ban)
- Custom ban embed templates for automod bans
- Comprehensive permission and hierarchy checks

#### `/warnings <user>`
View all warnings for a specific user.

**Parameters:**
- `user` - The user whose warnings to view (required)

**Features:**
- Complete warning history display
- Chronological ordering (newest first)
- Shows up to 10 most recent warnings
- Case details with moderator information
- Clean record celebration for users with no warnings

#### `/delwarn <user>`
Delete a specific warning from a user's history using an interactive menu.

**Parameters:**
- `user` - The user whose warning to delete (required)

**Features:**
- Interactive select menu showing all warnings
- Visual warning preview with dates and reasons
- Confirmation display with full warning details
- Supports up to 25 most recent warnings in menu
- Comprehensive deletion logging

#### `/kick <user> [reason]`
Kicks a user from the server with case tracking.

**Parameters:**
- `user` - The user to kick (required)
- `reason` - Reason for the kick (optional)

**Features:**
- Automatic case ID generation
- DM notification to kicked user
- Role hierarchy verification
- Moderation logging
- Permission checks

#### `/lock [channel] [reason]`
Locks a channel by removing Send Messages permission from @everyone.

**Parameters:**
- `channel` - Channel to lock (optional, defaults to current channel)
- `reason` - Reason for locking (optional)

**Features:**
- Cute lock notification message
- Permission backup and restoration
- Staff-only access during lock
- Comprehensive logging

#### `/unlock [channel] [reason]`
Unlocks a previously locked channel by restoring Send Messages permission.

**Parameters:**
- `channel` - Channel to unlock (optional, defaults to current channel)
- `reason` - Reason for unlocking (optional)

**Features:**
- Cute unlock notification message
- Permission restoration
- Logging and case tracking

#### `/slowmode <duration> [channel] [reason]`
Sets slowmode (rate limit) for a channel.

**Parameters:**
- `duration` - Slowmode duration (0s to disable, max 6h)
- `channel` - Channel to set slowmode (optional, defaults to current channel)
- `reason` - Reason for slowmode (optional)

**Features:**
- Human-readable duration formatting
- Smart duration parsing (5s, 1m, 2h, etc.)
- Automatic disable with 0 duration
- Visual confirmation with duration display

#### `/search <query> [type] [limit]`
Search through moderation logs to find specific cases.

**Parameters:**
- `query` - Search term (user, moderator, reason, or user ID)
- `type` - Filter by action type (warn, ban, kick, mute, etc.) (optional)
- `limit` - Number of results to show (1-20, default: 10) (optional)

**Features:**
- Multi-field search (usernames, moderators, reasons)
- Action type filtering
- Pagination for large result sets
- Case details with timestamps
- Useful for finding related incidents

#### `/notes <subcommand>`
Manage staff notes for users (staff-only visibility).

**Subcommands:**
- `add <user> <note>` - Add a note to a user
- `view <user>` - View all notes for a user  
- `remove <user> <note_id>` - Remove a specific note

**Features:**
- Staff-only visibility (ephemeral responses)
- Unique note IDs for easy management
- Timestamp tracking
- Moderator attribution
- Pagination for users with many notes

#### `/userinfo <user>`
Get comprehensive information about a user (staff-only).

**Parameters:**
- `user` - The user to get information about (required)

**Features:**
- **Basic Info**: Account age, creation date, bot status
- **Server Info**: Join date, roles, nickname, server tenure
- **Current Status**: Online status, timeouts, key permissions
- **Moderation History**: Case counts by type, most recent action
- **Staff Notes**: Recent notes with previews
- **Account Safety**: Handles users not in server
- **Quick Access**: Links to related commands for detailed views

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
- **Commands**: Configure command permissions and access (with search and pagination)
- **Automod**: Configure warning thresholds and automatic punishments
- **Logs**: Set up logging channels and customize ban templates
- **Appeals**: Configure Discord invite-based appeal system

**Command Management Features:**
- **Search Functionality**: Find commands quickly with search modal
- **Pagination**: Navigate through large command lists efficiently
- **Interactive Management**: Click-to-configure with visual status indicators
- **Permission Control**: Granular access control per command

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

3. **Set Up Appeal System**
   ```
   /config → Logs → Set Appeal Server Invite
   /config → Logs → Customize Ban Message
   ```
   Configure Discord server invite for appeals and customize ban message template.

4. **Configure Commands**
   ```
   /config → Commands → Manage Commands
   ```
   Set permissions for individual commands.

5. **Set Up Automod System**
   ```
   /config → Automod → Enable System
   /config → Automod → Add Rule
   ```
   Configure automatic punishments based on warning thresholds.

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

1. **Enable Appeals System**
   ```
   /config → Logs → Enable Appeals
   ```

2. **Set Appeal Server Invite**
   ```
   /config → Logs → Set Appeal Server Invite
   ```

3. **Customize Ban Messages**
   ```
   /config → Logs → Customize Ban Message
   ```
   Create personalized ban notifications with variables like {user}, {server}, {reason}, {caseId}, {appealInvite}

4. **Appeal Workflow**
   - User gets banned → Receives custom DM with appeal server invite
   - User joins appeal server → Submits appeal through Discord
   - Staff review appeals in the appeal server → Take appropriate action

### Automod System Configuration

1. **Enable Automod System**
   ```
   /config → Automod → Enable System
   ```

2. **Add Warning Threshold Rules**
   ```
   /config → Automod → Add Rule
   ```
   Configure automatic punishments:
   - **Threshold**: Number of warnings to trigger (1-50)
   - **Action**: Type of punishment (mute, kick, ban)
   - **Duration**: For mutes only (1m, 1h, 1d, etc.)

3. **Manage Existing Rules**
   ```
   /config → Automod → Manage Rules
   ```
   View, edit, or remove existing automod rules

4. **Automod Features**
   - **Automatic Escalation**: Punishments trigger when warning thresholds are reached
   - **Custom Ban Templates**: Automod bans use the same custom templates as manual bans
   - **Comprehensive Logging**: All automod actions are logged with proper case IDs
   - **DM Notifications**: Users receive appropriate DMs for all automod punishments
   - **Appeal Integration**: Automod bans include full appeal system integration

## 🏗️ Project Structure

```
tomo-bot/
├── commands/          # Slash commands
│   ├── general/       # Public commands (help, afk)
│   ├── moderation/    # Mod commands (ban, unban, warn, warnings, delwarn, kick, lock, unlock, slowmode, search, notes, userinfo)
│   └── util/          # Utility commands (config)
├── data/              # JSON database files
├── events/            # Discord.js event handlers
├── handlers/          # Component handlers
├── helpers/           # Utility functions
├── interactions/      # Discord interactions
│   ├── buttons/       # Button interactions (including search functionality)
│   ├── menus/         # Select menu interactions
│   └── modals/        # Modal form interactions (including search modal)
├── models/            # Data models and database
│   ├── BaseModel.js   # Base database model
│   ├── ConfigModel.js # Configuration management
│   ├── ModerationActionModel.js # Case and action tracking
│   └── UserNotesModel.js # Staff notes system
├── utils/             # Shared utilities
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

### User Notes
```json
{
  "userId": "123456789012345678",
  "moderatorId": "123456789012345678", 
  "note": "User was very cooperative during appeal process",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "id": "1701432000000"
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
```

### Configuration
```json
{
  "id": "global",
  "staffRoles": ["role_id_1", "role_id_2"],
  "logsChannelId": "123456789012345678",
  "appealInvite": "https://discord.gg/appeals",
  "loggingEnabled": true,
  "appealsEnabled": true,
  "automodEnabled": true,
  "automodRules": [
    {
      "threshold": 3,
      "action": "mute",
      "duration": 3600000
    },
    {
      "threshold": 5,
      "action": "kick"
    },
    {
      "threshold": 7,
      "action": "ban"
    }
  ],
  "banEmbed": {
    "title": "🔨 You have been banned",
    "description": "You have been banned from **{server}**",
    "color": 16761769,
    "footer": "Contact staff if you believe this is a mistake"
  },
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
- `deleteCase(caseId)` - Delete a specific case
- `getUserCases(userId)` - Get all cases for a user
- `getUserWarnings(userId, guildId)` - Get all warnings for a user
- `getStatistics()` - Get server-wide statistics
- `getModeratorStatistics(moderatorId)` - Get moderator statistics
- `find(query)` - Search moderation logs with filtering

#### UserNotesModel
- `addNote(userId, moderatorId, note)` - Add a staff note to a user
- `getUserNotes(userId)` - Get all notes for a specific user
- `deleteNote(noteId)` - Remove a specific note by ID
- `getAllNotes()` - Get all notes (admin use)

#### ConfigModel
- `getConfig()` - Get current configuration
- `setConfig(data)` - Update configuration
- `setBanEmbedTemplate(data)` - Set custom ban embed template
- `getBanEmbedTemplate()` - Get current ban embed template
- `setAppealInvite(invite)` - Set Discord appeal server invite
- `setLoggingEnabled(enabled)` - Toggle logging system
- `setAppealsEnabled(enabled)` - Toggle appeals system
- `setAutomodEnabled(enabled)` - Toggle automod system
- `addAutomodRule(threshold, action, duration)` - Add automod rule
- `removeAutomodRule(threshold)` - Remove automod rule
- `getAutomodRules()` - Get all automod rules
- `getAutomodActionForWarnings(count)` - Get applicable automod action
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
1. Verify appeals system is enabled: `/config → Logs → Enable Appeals`
2. Check appeal server invite is set: `/config → Logs → Set Appeal Server Invite`
3. Ensure ban message template includes {appealInvite} variable
4. Test custom ban message template with preview feature

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
