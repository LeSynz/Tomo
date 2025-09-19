const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

class ConfigModel extends BaseModel {
    constructor() {
        super('config');
    }

    async getConfig() {
        let config = await this.findOne({ id: 'global' });
        if (!config) {
            config = { id: 'global', staffRoles: [], commands: {}, logsChannelId: null, appealsChannelId: null };
            await this.create(config);
        }

        if (config.logsChannelId === undefined) {
            config.logsChannelId = null;
            await this.setConfig(config);
        }

        if (config.appealsChannelId === undefined) {
            config.appealsChannelId = null;
            await this.setConfig(config);
        }

        return config;
    }

    async setConfig(configData) {
        return await this.updateOrCreate({ id: 'global' }, configData);
    }

    async setLogsChannel(channelId) {
        const config = await this.getConfig();
        config.logsChannelId = channelId;
        return await this.setConfig(config);
    }

    async getLogsChannel() {
        const config = await this.getConfig();
        return config.logsChannelId || null;
    }
    
    async setAppealsChannel(channelId) {
        const config = await this.getConfig();
        config.appealsChannelId = channelId;
        return await this.setConfig(config);
    }

    async getAppealsChannel() {
        const config = await this.getConfig();
        return config.appealsChannelId || null;
    }

    canRoleUseCommand(config, roleId, command) {
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
    }

    async setCommandEnabled(command, enabled) {
        const config = await this.getConfig();
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
        return await this.setConfig(config);
    }

    async setCommandWhitelist(commandName, roleIds) {
        const config = await this.getConfig();
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
        return await this.setConfig(config);
    }

    async setCommandBlacklist(commandName, roleIds) {
        const config = await this.getConfig();
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
        return await this.setConfig(config);
    }

    async addCommandWhitelistRole(commandName, roleId) {
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
    }

    async removeCommandWhitelistRole(commandName, roleId) {
        const config = await this.getConfig();
        if (config.commands?.[commandName]?.whitelist) {
            config.commands[commandName].whitelist = 
                config.commands[commandName].whitelist.filter(id => id !== roleId);
        }
        return await this.setConfig(config);
    }

    async addCommandBlacklistRole(commandName, roleId) {
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
    }

    async removeCommandBlacklistRole(commandName, roleId) {
        const config = await this.getConfig();
        if (config.commands?.[commandName]?.blacklist) {
            config.commands[commandName].blacklist = 
                config.commands[commandName].blacklist.filter(id => id !== roleId);
        }
        return await this.setConfig(config);
    }

    async checkCommandPermission(commandName, userRoles, isOwner = false) {
        const config = await this.getConfig();
        const command = config.commands?.[commandName];

        if (!command || command.enabled === false) {
            return { allowed: false, reason: 'Command is disabled' };
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
    }

    async registerCommand(commandName, isPublic = false, enabled = true) {
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
    }

    async setCommandPublic(commandName, isPublic) {
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
    }

    async discoverAndRegisterCommands(client, forceRefresh = false) {
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
    }

    async updateCommandRoleList(listType, command, roleId, add = true) {
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
    }

    async setStaffRole(roleId, add = true) {
        const config = await this.getConfig();
        if (!config.staffRoles) config.staffRoles = [];
        const index = config.staffRoles.indexOf(roleId);
        if (add) {
            if (index === -1) config.staffRoles.push(roleId);
        } else {
            if (index !== -1) config.staffRoles.splice(index, 1);
        }
        return await this.setConfig(config);
    }

    async isCommandEnabled(command) {
        const config = await this.getConfig();
        if (!config || !config.commands || !config.commands[command]) {
            return false;
        }
        return config.commands[command].enabled !== false;
    }

    async getCommandConfig(command) {
        const config = await this.getConfig();
        if (!config || !config.commands) return null;
        return config.commands[command] || null;
    }

    async canUserUseCommand(userRoles, command) {
        const config = await this.getConfig();
        for (const roleId of userRoles) {
            if (this.canRoleUseCommand(config, roleId, command)) {
                return true;
            }
        }
        return false;
    }

    async getStaffRoles() {
        const config = await this.getConfig();
        return config.staffRoles || [];
    }

    async getAllCommandSettings() {
        const config = await this.getConfig();
        return config.commands || {};
    }

    async resetConfig() {
        return await this.setConfig({ id: 'global', staffRoles: [], commands: {}, logsChannelId: null, appealsChannelId: null });
    }

    async isUserStaff(userRoles) {
        const config = await this.getConfig();
        if (!config || !config.staffRoles) return false;
        return userRoles.some(roleId => config.staffRoles.includes(roleId));
    }
}

module.exports = ConfigModel;