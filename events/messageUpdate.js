const { Events, EmbedBuilder } = require('discord.js');
const ConfigModel = require('../models/ConfigModel');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        try {
            if (newMessage.author?.bot) return;
            
            if (oldMessage.partial || newMessage.partial) return;

            if (oldMessage.content === newMessage.content) return;

            const config = await ConfigModel.getConfig();

            if (!config.messageLoggingEnabled) return;

            if (!config.messageLogsChannelId) return;

            const blacklist = config.messageLogsBlacklist || [];
            if (blacklist.includes(newMessage.channel.id)) return;

            const logsChannel = newMessage.guild.channels.cache.get(config.messageLogsChannelId);
            if (!logsChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setAuthor({
                    name: newMessage.author.tag,
                    iconURL: newMessage.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`Message Edited in ${newMessage.channel} [Jump to Message](${newMessage.url})`)
                .setTimestamp()
                .setFooter({ text: `User ID: ${newMessage.author.id}` });

            if (oldMessage.content) {
                const oldContent = oldMessage.content.length > 1024 
                    ? oldMessage.content.substring(0, 1021) + '...'
                    : oldMessage.content;
                embed.addFields({ name: 'Before', value: oldContent || '*No content*', inline: false });
            }

            if (newMessage.content) {
                const newContent = newMessage.content.length > 1024 
                    ? newMessage.content.substring(0, 1021) + '...'
                    : newMessage.content;
                embed.addFields({ name: 'After', value: newContent || '*No content*', inline: false });
            }

            await logsChannel.send({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in messageUpdate event:', error);
        }
    }
};