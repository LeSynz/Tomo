const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../models/ConfigModel');
const logger = require('./logger');

class ModerationLogger {
  constructor() {
    // No need to instantiate ConfigModel anymore - using static methods
  }

  /**
   * Log a moderation action to the configured logs channel
   * @param {Object} client - Discord client
   * @param {Object} action - Moderation action details
   * @param {string} action.type - Type of action (ban, kick, mute, warn, etc.)
   * @param {Object} action.moderator - User object of the moderator
   * @param {Object} action.target - User object of the target
   * @param {string} action.reason - Reason for the action
   * @param {string} [action.duration] - Duration for temporary actions (mute, tempban)
   * @param {Object} [action.additionalInfo] - Any additional info to include
   * @param {string} [action.caseId] - Case ID from database
   */
  async logAction(client, action) {
    try {
      // Check if logging is enabled
      const isLoggingEnabled = await ConfigModel.isLoggingEnabled();
      if (!isLoggingEnabled) {
        logger.info('Moderation logging is disabled, skipping log');
        return false;
      }

      const logsChannelId = await ConfigModel.getLogsChannel();
      
      if (!logsChannelId) {
        logger.info('No logs channel configured, skipping moderation log');
        return false;
      }

      const logsChannel = await client.channels.fetch(logsChannelId).catch(() => null);
      
      if (!logsChannel) {
        logger.warn(`Logs channel ${logsChannelId} not found or inaccessible`);
        return false;
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setDescription(`${this.getActionEmoji(action.type)} **${this.formatActionTitle(action.type)}** | ${action.target} by ${action.moderator}\n📝 **Reason:** ${action.reason || 'No reason provided'}${action.duration ? `\n⏰ **Duration:** ${action.duration}` : ''}`)
        .setFooter({ 
          text: action.caseId ? `Case ${action.caseId}` : 'No case ID'
        })
        .setTimestamp();

      await logsChannel.send({ embeds: [embed] });
      
      logger.info(`Logged ${action.type} action by ${action.moderator.tag} on ${action.target.tag}`);
      return true;

    } catch (error) {
      logger.error('Error logging moderation action:', error);
      return false;
    }
  }

  /**
   * Get emoji for action type
   * @param {string} type - Action type
   * @returns {string} Emoji
   */
  getActionEmoji(type) {
    const emojis = {
      ban: '🔨',
      tempban: '⏰',
      unban: '🕊️',
      kick: '👢',
      mute: '🔇',
      unmute: '🔊',
      warn: '⚠️',
      timeout: '⏱️',
      untimeout: '✨',
      purge: '🧹',
      lock: '🔒',
      unlock: '🔓',
      slowmode: '🐌',
      note: '📝'
    };
    return emojis[type.toLowerCase()] || '🛡️';
  }

  /**
   * Format action title for display
   * @param {string} type - Action type
   * @returns {string} Formatted title
   */
  formatActionTitle(type) {
    const titles = {
      ban: 'User Banned',
      tempban: 'User Temporarily Banned',
      unban: 'User Unbanned',
      kick: 'User Kicked',
      mute: 'User Muted',
      unmute: 'User Unmuted',
      warn: 'User Warned',
      timeout: 'User Timed Out',
      untimeout: 'User Timeout Removed',
      purge: 'Messages Purged',
      lock: 'Channel Locked',
      unlock: 'Channel Unlocked',
      slowmode: 'Slowmode Updated',
      note: 'Moderation Note Added'
    };
    return titles[type.toLowerCase()] || 'Moderation Action';
  }

  /**
   * Quick logging methods for common actions
   */
  async logBan(client, moderator, target, reason, duration = null) {
    const action = {
      type: duration ? 'tempban' : 'ban',
      moderator,
      target,
      reason,
      duration
    };
    return await this.logAction(client, action);
  }

  async logKick(client, moderator, target, reason) {
    const action = {
      type: 'kick',
      moderator,
      target,
      reason
    };
    return await this.logAction(client, action);
  }

  async logMute(client, moderator, target, reason, duration = null) {
    const action = {
      type: 'mute',
      moderator,
      target,
      reason,
      duration
    };
    return await this.logAction(client, action);
  }

  async logWarn(client, moderator, target, reason) {
    const action = {
      type: 'warn',
      moderator,
      target,
      reason
    };
    return await this.logAction(client, action);
  }

  async logTimeout(client, moderator, target, reason, duration) {
    const action = {
      type: 'timeout',
      moderator,
      target,
      reason,
      duration
    };
    return await this.logAction(client, action);
  }

  async logPurge(client, moderator, reason, messageCount, channel) {
    const action = {
      type: 'purge',
      moderator,
      target: { tag: `#${channel.name}`, id: channel.id }, 
      reason,
      additionalInfo: {
        '📊 Messages Deleted': `${messageCount} messages`,
        '📍 Channel': `<#${channel.id}>`
      }
    };
    return await this.logAction(client, action);
  }

  async logReasonUpdate(client, { caseId, moderator, target, oldReason, newReason, actionType }) {
    try {
      const logsChannelId = await ConfigModel.getLogsChannel();
      
      if (!logsChannelId) {
        logger.info('No logs channel configured, skipping reason update log');
        return false;
      }

      const logsChannel = await client.channels.fetch(logsChannelId).catch(() => null);
      
      if (!logsChannel) {
        logger.warn(`Logs channel ${logsChannelId} not found or inaccessible`);
        return false;
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setDescription(`📝 **Case Reason Updated** | Case ${caseId}\n👤 **Target:** ${target.tag}\n🔨 **Updated by:** ${moderator.tag}\n⚡ **Action Type:** ${actionType}`)
        .addFields(
          {
            name: '📝 Old Reason',
            value: `\`${oldReason}\``,
            inline: false
          },
          {
            name: '✨ New Reason',
            value: `\`${newReason}\``,
            inline: false
          }
        )
        .setFooter({ text: `Case ${caseId} • Reason Updated` })
        .setTimestamp();

      await logsChannel.send({ embeds: [embed] });
      
      logger.info(`Logged reason update for case ${caseId} by ${moderator.tag}`);
      return true;

    } catch (error) {
      logger.error('Error logging reason update:', error);
      return false;
    }
  }

  /**
   * Check if logs channel is configured and accessible
   * @param {Object} client - Discord client
   * @returns {boolean} Whether logging is available
   */
  async isLoggingEnabled(client) {
    try {
      const logsChannelId = await ConfigModel.getLogsChannel();
      if (!logsChannelId) return false;

      const logsChannel = await client.channels.fetch(logsChannelId).catch(() => null);
      return !!logsChannel;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ModerationLogger();