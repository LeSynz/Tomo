const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const ConfigModel = require('../models/ConfigModel');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        try {
            if (message.author?.bot) return;
            
            if (message.partial) return;

            const config = await ConfigModel.getConfig();

            if (!config.messageLoggingEnabled) return;

            if (!config.messageLogsChannelId) return;

            const blacklist = config.messageLogsBlacklist || [];
            if (blacklist.includes(message.channel.id)) return;

            const logsChannel = message.guild.channels.cache.get(config.messageLogsChannelId);
            if (!logsChannel) return;

            let deletedBy = null;
            try {
                const auditLogs = await message.guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageDelete,
                    limit: 5
                });

                const auditEntry = auditLogs.entries.find(entry => 
                    entry.target.id === message.author.id &&
                    entry.extra.channel.id === message.channel.id &&
                    Date.now() - entry.createdTimestamp < 5000 // Within 5 seconds
                );

                if (auditEntry) {
                    deletedBy = auditEntry.executor;
                }
            } catch (error) {
            }

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Message Deleted in ${message.channel}`)
                .setTimestamp()
                .setFooter({ text: `User ID: ${message.author.id}` });

            if (deletedBy && deletedBy.id !== message.author.id) {
                embed.setDescription(`Message Deleted in ${message.channel} by ${deletedBy.tag}`);
            }

            if (message.content) {
                const content = message.content.length > 1024 
                    ? message.content.substring(0, 1021) + '...'
                    : message.content;
                embed.addFields({ name: 'Content', value: content || '*No content*', inline: false });
            }

            if (message.attachments.size > 0) {
                const attachments = message.attachments.map(att => att.name).join(', ');
                embed.addFields({ name: 'Attachments', value: attachments, inline: false });
            }

            await logsChannel.send({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in messageDelete event:', error);
        }
    }
};