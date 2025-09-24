const { Schema, model } = require('synz-db');
const logger = require('../utils/logger');

// Ensure database connection is initialized
require('../database/connection');

const configSchema = new Schema({
  configType: {
    type: 'string',
    required: true,
    unique: true,
    default: 'global'
  },
  guildId: {
    type: 'string',
    required: false,
    default: null
  },
  staffRoles: {
    type: 'array',
    default: []
  },
  commands: {
    type: 'object',
    default: {}
  },
  logsChannelId: {
    type: 'string',
    default: null
  },
  messageLogsChannelId: {
    type: 'string',
    default: null
  },
  appealsChannelId: {
    type: 'string',
    default: null
  },
  messageLoggingEnabled: {
    type: 'boolean',
    default: false
  },
  messageLogsBlacklist: {
    type: 'array',
    default: []
  },
  appealInvite: {
    type: 'string',
    default: null
  },
  loggingEnabled: {
    type: 'boolean',
    default: true
  },
  appealsEnabled: {
    type: 'boolean',
    default: true
  },
  automodEnabled: {
    type: 'boolean',
    default: true
  },
  automodRules: {
    type: 'array',
    default: []
  },
  banEmbed: {
    type: 'object',
    default: {
      title: '🔨 You have been banned',
      description: 'You have been banned from **{server}**',
      color: 0xFFB6C1,
      footer: 'Contact staff if you believe this is a mistake'
    }
  }
}, {
  timestamps: true
});

// Static methods
configSchema.statics.getConfig = async function(guildId = null) {
  try {
    console.log(`Getting config for guild: ${guildId || 'global'}`);
    
    // Look for guild-specific config first, then fall back to global
    let config = null;
    if (guildId) {
      config = await this.findOne({ guildId: guildId });
    }
    
    // If no guild-specific config, try global
    if (!config) {
      config = await this.findOne({ configType: 'global' });
    }
    
    if (config) {
      return config;
    }

    // Create default config for new guilds or global
    console.log(`Creating default config for: ${guildId || 'global'}`);
    const defaultConfig = this.getDefaultConfig(guildId);
    const newConfig = await this.create(defaultConfig);
    
    return newConfig;
  } catch (error) {
    console.error('Error getting config:', error);
    
    // Return fallback config in case of database issues
    console.log('Using fallback config due to error');
    return this.getFallbackConfig(guildId);
  }
};

configSchema.statics.getDefaultConfig = function(guildId = null) {
  return {
    configType: guildId ? 'guild' : 'global',
    guildId: guildId,
    staffRoles: [],
    commands: {},
    logsChannelId: null,
    messageLogsChannelId: null,
    appealsChannelId: null,
    messageLoggingEnabled: false,
    messageLogsBlacklist: [],
    appealInvite: null,
    loggingEnabled: true,
    appealsEnabled: true,
    automodEnabled: true,
    automodRules: [],
    banEmbed: {
      title: '🔨 You have been banned',
      description: 'You have been banned from **{server}**',
      color: 0xFFB6C1,
      footer: 'Contact staff if you believe this is a mistake'
    }
  };
};

configSchema.statics.getFallbackConfig = function(guildId = null) {
  // Return a working config object for fallback
  const fallbackConfig = {
    id: 'fallback',
    configType: guildId ? 'guild' : 'global',
    guildId: guildId,
    staffRoles: [],
    commands: {},
    logsChannelId: null,
    messageLogsChannelId: null,
    appealsChannelId: null,
    messageLoggingEnabled: false,
    messageLogsBlacklist: [],
    appealInvite: null,
    loggingEnabled: true,
    appealsEnabled: true,
    automodEnabled: true,
    automodRules: [],
    banEmbed: {
      title: '🔨 You have been banned',
      description: 'You have been banned from **{server}**',
      color: 0xFFB6C1,
      footer: 'Contact staff if you believe this is a mistake'
    }
  };
  
  // Add methods that other parts of the code expect
  fallbackConfig.save = async function() { return this; };
  fallbackConfig.toObject = function() { return this; };
  
  return fallbackConfig;
};

// Configuration management methods
configSchema.statics.setConfig = async function(configData, guildId = null) {
  const existingConfig = await this.findOne({ 
    configType: guildId ? 'guild' : 'global',
    guildId: guildId 
  });
  
  if (existingConfig) {
    Object.assign(existingConfig, configData);
    return await existingConfig.save();
  } else {
    const newConfigData = {
      ...configData,
      configType: guildId ? 'guild' : 'global',
      guildId: guildId
    };
    return await this.create(newConfigData);
  }
};

configSchema.statics.setLogsChannel = async function(channelId, guildId = null) {
  const config = await this.getConfig(guildId);
  config.logsChannelId = channelId;
  return await config.save();
};

configSchema.statics.getLogsChannel = async function(guildId = null) {
  const config = await this.getConfig(guildId);
  return config.logsChannelId || null;
};

configSchema.statics.setAppealsChannel = async function(channelId, guildId = null) {
  const config = await this.getConfig(guildId);
  config.appealsChannelId = channelId;
  return await config.save();
};

configSchema.statics.getAppealsChannel = async function(guildId = null) {
  const config = await this.getConfig(guildId);
  return config.appealsChannelId || null;
};

configSchema.statics.setAppealInvite = async function(inviteLink, guildId = null) {
  const config = await this.getConfig(guildId);
  config.appealInvite = inviteLink;
  return await config.save();
};

configSchema.statics.getAppealInvite = async function(guildId = null) {
  const config = await this.getConfig(guildId);
  return config.appealInvite || null;
};

configSchema.statics.canRoleUseCommand = function(config, roleId, command) {
  if (!config || !config.commands || !config.commands[command]) {
    return false;
  }
  const cmdConfig = config.commands[command];
  if (cmdConfig.blacklist && cmdConfig.blacklist.includes(roleId)) {
    return false;
  }
  if (cmdConfig.whitelist && cmdConfig.whitelist.includes(roleId)) {
    return true;
  }
  if (config.staffRoles && config.staffRoles.includes(roleId)) {
    return true;
  }
  return false;
};

configSchema.statics.setCommandEnabled = async function(command, enabled, guildId = null) {
  const config = await this.getConfig(guildId);
  if (!config.commands) config.commands = {};
  if (!config.commands[command]) {
    config.commands[command] = {
      enabled: enabled,
      whitelist: [],
      blacklist: []
    };
  } else {
    config.commands[command].enabled = enabled;
  }
  return await config.save();
};

configSchema.statics.setCommandWhitelist = async function(commandName, roleIds, guildId = null) {
  const config = await this.getConfig(guildId);
  if (!config.commands) config.commands = {};
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: true,
      whitelist: roleIds,
      blacklist: []
    };
  } else {
    config.commands[commandName].whitelist = roleIds;
  }
  return await config.save();
};

configSchema.statics.setCommandBlacklist = async function(commandName, roleIds, guildId = null) {
  const config = await this.getConfig(guildId);
  if (!config.commands) config.commands = {};
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: true,
      whitelist: [],
      blacklist: roleIds
    };
  } else {
    config.commands[commandName].blacklist = roleIds;
  }
  return await config.save();
};

configSchema.statics.addCommandWhitelistRole = async function(commandName, roleId) {
  const config = await this.getConfig();
  if (!config.commands) config.commands = {};
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: true,
      whitelist: [roleId],
      blacklist: []
    };
  } else {
    if (!config.commands[commandName].whitelist) {
      config.commands[commandName].whitelist = [];
    }
    if (!config.commands[commandName].whitelist.includes(roleId)) {
      config.commands[commandName].whitelist.push(roleId);
    }
  }
  return await this.setConfig(config);
};

configSchema.statics.removeCommandWhitelistRole = async function(commandName, roleId) {
  const config = await this.getConfig();
  if (config.commands?.[commandName]?.whitelist) {
    config.commands[commandName].whitelist = 
      config.commands[commandName].whitelist.filter(id => id !== roleId);
  }
  return await this.setConfig(config);
};

configSchema.statics.addCommandBlacklistRole = async function(commandName, roleId) {
  const config = await this.getConfig();
  if (!config.commands) config.commands = {};
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: true,
      whitelist: [],
      blacklist: [roleId]
    };
  } else {
    if (!config.commands[commandName].blacklist) {
      config.commands[commandName].blacklist = [];
    }
    if (!config.commands[commandName].blacklist.includes(roleId)) {
      config.commands[commandName].blacklist.push(roleId);
    }
  }
  return await this.setConfig(config);
};

configSchema.statics.removeCommandBlacklistRole = async function(commandName, roleId) {
  const config = await this.getConfig();
  if (config.commands?.[commandName]?.blacklist) {
    config.commands[commandName].blacklist = 
      config.commands[commandName].blacklist.filter(id => id !== roleId);
  }
  return await this.setConfig(config);
};

configSchema.statics.checkCommandPermission = async function(commandName, userRoles, isOwner = false) {
  const config = await this.getConfig();
  const command = config.commands?.[commandName];

  if (!command || command.enabled === false) {
    return { allowed: false, reason: 'Command is disabled' };
  }

  if (commandName === 'config') {
    if (isOwner) return { allowed: true, reason: 'Server owner' };

    if (command.whitelist?.length > 0) {
      const hasWhitelistedRole = command.whitelist.some(roleId => userRoles.includes(roleId));
      if (hasWhitelistedRole) {
        return { allowed: true, reason: 'User has whitelisted role for config command' };
      }
    }

    return { allowed: false, reason: 'Config command is owner-only (unless whitelisted)' };
  }

  if (isOwner) return { allowed: true, reason: 'Owner bypass' };

  if (command.blacklist?.length > 0) {
    const hasBlacklistedRole = command.blacklist.some(roleId => userRoles.includes(roleId));
    if (hasBlacklistedRole) {
      return { allowed: false, reason: 'User has blacklisted role' };
    }
  }

  const isStaff = config.staffRoles?.length > 0 && 
                 config.staffRoles.some(roleId => userRoles.includes(roleId));

  const hasWhitelistedRole = command.whitelist?.length > 0 && 
                            command.whitelist.some(roleId => userRoles.includes(roleId));

  if (command.whitelist?.length > 0) {
    if (isStaff || hasWhitelistedRole) {
      const reason = isStaff ? 'User has global staff role' : 'User has whitelisted role';
      return { allowed: true, reason };
    } else {
      return { allowed: false, reason: 'User lacks required whitelisted role or staff role' };
    }
  }

  if (command.isPublic === true) {
    return { allowed: true, reason: 'Public command' };
  }

  if (isStaff) {
    return { allowed: true, reason: 'User has global staff role' };
  }

  return { allowed: false, reason: 'No permission (command requires staff role)' };
};

configSchema.statics.registerCommand = async function(commandName, isPublic = false, enabled = true) {
  const config = await this.getConfig();
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: enabled,
      isPublic: isPublic,
      whitelist: [],
      blacklist: []
    };
    await this.setConfig(config);
  }
  return config.commands[commandName];
};

configSchema.statics.setCommandPublic = async function(commandName, isPublic) {
  const config = await this.getConfig();
  if (!config.commands[commandName]) {
    config.commands[commandName] = {
      enabled: true,
      isPublic: isPublic,
      whitelist: [],
      blacklist: []
    };
  } else {
    config.commands[commandName].isPublic = isPublic;
  }
  return await this.setConfig(config);
};

configSchema.statics.discoverAndRegisterCommands = async function(client, forceRefresh = false) {
  try {
    const config = await this.getConfig();
    let commandsProcessed = 0;

    if (client.commands) {
      for (const [commandName, commandModule] of client.commands) {
        if (!forceRefresh && config.commands[commandName]) {
          continue;
        }

        const isPublic = commandModule.isPublic === true;
        
        if (!config.commands[commandName]) {
          config.commands[commandName] = {
            enabled: true,
            isPublic: isPublic,
            whitelist: [],
            blacklist: []
          };
        } else {
          config.commands[commandName].isPublic = isPublic;
        }
        
        commandsProcessed++;
        
        const action = forceRefresh ? 'Updated' : 'Auto-registered';
        const type = isPublic ? 'public' : 'staff-only';
        logger.info(`${action} ${type} command: ${commandName}`);
      }
    }

    if (commandsProcessed > 0) {
      await this.setConfig(config);
      const action = forceRefresh ? 'refresh' : 'auto-discovery';
      logger.info(`Command ${action} complete: ${commandsProcessed} commands processed`);
    }

    return commandsProcessed;
  } catch (error) {
    logger.error('Error during command auto-discovery:', error);
    return 0;
  }
};

configSchema.statics.updateCommandRoleList = async function(listType, command, roleId, add = true) {
  if (listType === 'whitelist') {
    return add ? 
      await this.addCommandWhitelistRole(command, roleId) :
      await this.removeCommandWhitelistRole(command, roleId);
  } else if (listType === 'blacklist') {
    return add ?
      await this.addCommandBlacklistRole(command, roleId) :
      await this.removeCommandBlacklistRole(command, roleId);
  }
  return false;
};

configSchema.statics.setStaffRole = async function(roleId, add = true) {
  const config = await this.getConfig();
  if (!config.staffRoles) config.staffRoles = [];
  const index = config.staffRoles.indexOf(roleId);
  if (add) {
    if (index === -1) config.staffRoles.push(roleId);
  } else {
    if (index !== -1) config.staffRoles.splice(index, 1);
  }
  return await this.setConfig(config);
};

configSchema.statics.isCommandEnabled = async function(command) {
  const config = await this.getConfig();
  if (!config || !config.commands || !config.commands[command]) {
    return false;
  }
  return config.commands[command].enabled !== false;
};

configSchema.statics.getCommandConfig = async function(command) {
  const config = await this.getConfig();
  if (!config || !config.commands) return null;
  return config.commands[command] || null;
};

configSchema.statics.canUserUseCommand = async function(userRoles, command) {
  const config = await this.getConfig();
  for (const roleId of userRoles) {
    if (this.canRoleUseCommand(config, roleId, command)) {
      return true;
    }
  }
  return false;
};

configSchema.statics.getStaffRoles = async function() {
  const config = await this.getConfig();
  return config.staffRoles || [];
};

configSchema.statics.getAllCommandSettings = async function() {
  const config = await this.getConfig();
  return config.commands || {};
};

configSchema.statics.resetConfig = async function() {
  return await this.setConfig({ 
    id: 'global', 
    staffRoles: [], 
    commands: {}, 
    logsChannelId: null, 
    appealInvite: null, 
    loggingEnabled: true, 
    appealsEnabled: true 
  });
};

configSchema.statics.setLoggingEnabled = async function(enabled) {
  const config = await this.getConfig();
  config.loggingEnabled = enabled;
  return await this.setConfig(config);
};

configSchema.statics.setAppealsEnabled = async function(enabled) {
  const config = await this.getConfig();
  config.appealsEnabled = enabled;
  return await this.setConfig(config);
};

configSchema.statics.isLoggingEnabled = async function() {
  const config = await this.getConfig();
  return config.loggingEnabled !== false;
};

configSchema.statics.isAppealsEnabled = async function() {
  const config = await this.getConfig();
  return config.appealsEnabled !== false;
};

configSchema.statics.isUserStaff = async function(userRoles) {
  const config = await this.getConfig();
  if (!config || !config.staffRoles) return false;
  return userRoles.some(roleId => config.staffRoles.includes(roleId));
};

configSchema.statics.setBanEmbedTemplate = async function(embedData) {
  const config = await this.getConfig();
  config.banEmbed = {
    title: embedData.title || '🔨 You have been banned',
    description: embedData.description || 'You have been banned from **{server}**',
    color: embedData.color || 0xFFB6C1,
    footer: embedData.footer || 'Contact staff if you believe this is a mistake'
  };
  return await this.setConfig(config);
};

configSchema.statics.getBanEmbedTemplate = async function() {
  const config = await this.getConfig();
  return config.banEmbed || {
    title: '🔨 You have been banned',
    description: 'You have been banned from **{server}**',
    color: 0xFFB6C1,
    footer: 'Contact staff if you believe this is a mistake'
  };
};

configSchema.statics.setAutomodEnabled = async function(enabled) {
  const config = await this.getConfig();
  config.automodEnabled = enabled;
  return await this.setConfig(config);
};

configSchema.statics.isAutomodEnabled = async function() {
  const config = await this.getConfig();
  return config.automodEnabled !== false;
};

configSchema.statics.addAutomodRule = async function(threshold, action, duration = null) {
  const config = await this.getConfig();
  if (!config.automodRules) config.automodRules = [];
  
  const existingIndex = config.automodRules.findIndex(rule => rule.threshold === threshold);
  const newRule = { threshold, action, duration };
  
  if (existingIndex !== -1) {
    config.automodRules[existingIndex] = newRule;
  } else {
    config.automodRules.push(newRule);
  }
  
  config.automodRules.sort((a, b) => a.threshold - b.threshold);
  return await this.setConfig(config);
};

configSchema.statics.removeAutomodRule = async function(threshold) {
  const config = await this.getConfig();
  if (!config.automodRules) return await this.setConfig(config);
  
  config.automodRules = config.automodRules.filter(rule => rule.threshold !== threshold);
  return await this.setConfig(config);
};

configSchema.statics.getAutomodRules = async function() {
  const config = await this.getConfig();
  return config.automodRules || [];
};

configSchema.statics.getAutomodActionForWarnings = async function(warningCount) {
  const config = await this.getConfig();
  if (!config.automodEnabled || !config.automodRules) return null;
  
  const applicableRules = config.automodRules.filter(rule => warningCount >= rule.threshold);
  if (applicableRules.length === 0) return null;
  
  return applicableRules[applicableRules.length - 1];
};

const Config = model('Config', configSchema);

module.exports = Config;