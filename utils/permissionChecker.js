const ConfigModel = require('../models/ConfigModel');
const logger = require('./logger');
const { EmbedBuilder } = require('discord.js');


class PermissionChecker {
  async checkCommandPermission(interaction, commandName) {
    try {
      const userRoles = interaction.member?.roles?.cache ? 
        Array.from(interaction.member.roles.cache.keys()) : [];
      
      const isOwner = interaction.guild?.ownerId === interaction.user.id;

      const result = await ConfigModel.checkCommandPermission(commandName, userRoles, isOwner);

      logger.info(`Permission check for ${interaction.user.tag} on command ${commandName}:`, result);

      return result;
    } catch (error) {
      logger.error('Error checking command permission:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  async requirePermission(interaction, commandName) {
    const permission = await this.checkCommandPermission(interaction, commandName);
    
    if (!permission.allowed) {
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1) // cute ahh pink
        .setTitle('🌸 Oops! Access Denied')
        .setDescription(`Sorry ${interaction.user}, you can't use this command right now~`)
        .addFields({
          name: '💭 Reason',
          value: `\`${permission.reason}\``,
          inline: false
        })
        .setFooter({ 
          text: 'Contact staff if you think this is a mistake! 💌',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      if (permission.reason.includes('disabled')) {
        embed.setTitle('🚫 Command Disabled');
        embed.setDescription(`This command is currently disabled~\nAsk an admin to enable it! 🌙`);
      } else if (permission.reason.includes('blacklisted')) {
        embed.setTitle('⛔ Access Restricted');
        embed.setDescription(`You're restricted from using this command~\nContact staff for assistance! 💔`);
      } else if (permission.reason.includes('staff')) {
        embed.setTitle('🛡️ Staff Only');
        embed.setDescription(`This command is for staff members only~\nBecome part of the team! ✨`);
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      return false;
    }
    
    return true;
  }

  async hasPermission(interaction, commandName) {
    const permission = await this.checkCommandPermission(interaction, commandName);
    return permission.allowed;
  }

  async getPermissionDetails(interaction, commandName) {
    try {
      const userRoles = interaction.member?.roles?.cache ? 
        Array.from(interaction.member.roles.cache.keys()) : [];
      const isOwner = interaction.guild?.ownerId === interaction.user.id;
      const config = await ConfigModel.getConfig();
      const command = config.commands?.[commandName];

      return {
        user: interaction.user.tag,
        command: commandName,
        userRoles,
        isOwner,
        commandConfig: command,
        globalStaffRoles: config.staffRoles,
        permission: await ConfigModel.checkCommandPermission(commandName, userRoles, isOwner)
      };
    } catch (error) {
      logger.error('Error getting permission details:', error);
      return null;
    }
  }
}

module.exports = new PermissionChecker();