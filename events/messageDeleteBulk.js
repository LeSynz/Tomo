const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const ConfigModel = require('../models/ConfigModel');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageBulkDelete,
    async execute(messages) {
        try {
            if (messages.size === 0) return;

            const firstMessage = messages.first();
            const guild = firstMessage.guild;
            const channel = firstMessage.channel;

            const config = await ConfigModel.getConfig();

            if (!config.messageLoggingEnabled) return;

            if (!config.messageLogsChannelId) return;

            const blacklist = config.messageLogsBlacklist || [];
            if (blacklist.includes(channel.id)) return;

            const logsChannel = guild.channels.cache.get(config.messageLogsChannelId);
            if (!logsChannel) return;

            let deletedBy = null;
            try {
                const auditLogs = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageBulkDelete,
                    limit: 1
                });

                const auditEntry = auditLogs.entries.first();
                if (auditEntry && Date.now() - auditEntry.createdTimestamp < 5000) {
                    deletedBy = auditEntry.executor;
                }
            } catch (error) {
                // Ignore audit log errors
            }

            const userMessages = messages.filter(msg => !msg.author?.bot);
            const botMessages = messages.size - userMessages.size;

            const embed = new EmbedBuilder()
                .setColor('#ff9f43')
                .setAuthor({
                    name: deletedBy ? deletedBy.tag : 'Unknown',
                    iconURL: deletedBy ? deletedBy.displayAvatarURL({ dynamic: true }) : null
                })
                .setDescription(`Bulk Messages Deleted in ${channel}`)
                .addFields(
                    { name: 'Total Messages', value: `${messages.size}`, inline: true },
                    { name: 'User Messages', value: `${userMessages.size}`, inline: true }
                )
                .setTimestamp();

            if (botMessages > 0) {
                embed.addFields({ name: 'Bot Messages', value: `${botMessages}`, inline: true });
            }

            const sampleMessages = userMessages
                .filter(msg => msg.content && msg.content.length > 0)
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .first(3);

            if (sampleMessages.length > 0) {
                const samples = sampleMessages.map(msg => {
                    const content = msg.content.length > 100 
                        ? msg.content.substring(0, 97) + '...'
                        : msg.content;
                    return `**${msg.author.tag}:** ${content}`;
                }).join('\n');

                embed.addFields({ name: 'Sample Messages', value: samples, inline: false });
            }

            await logsChannel.send({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in messageDeleteBulk event:', error);
        }
    }
};