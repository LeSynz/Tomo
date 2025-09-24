const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'config_message_logs',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const blacklistedChannels = config.messageLogsBlacklist || [];
      const blacklistText = blacklistedChannels.length > 0
        ? blacklistedChannels.map(id => {
            const channel = interaction.guild.channels.cache.get(id);
            return channel ? `<#${id}>` : `Unknown Channel (${id})`;
          }).join(', ')
        : '❌ No channels blacklisted';

      const messageLogsChannel = config.messageLogsChannelId
        ? `<#${config.messageLogsChannelId}>`
        : '❌ No message logs channel set';

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('⚙️ Message Logging Configuration')
        .setDescription('Configure which channels should be excluded from message logging.')
        .addFields(
          {
            name: '💬 Current Message Logs Channel',
            value: messageLogsChannel,
            inline: false
          },
          {
            name: '🚫 Blacklisted Channels',
            value: blacklistText,
            inline: false
          },
          {
            name: '💡 How it works',
            value: 'Blacklisted channels will have their message events (edits, deletions) ignored by the logging system. This is useful for excluding bot channels, spam channels, or private staff channels.',
            inline: false
          }
        )
        .setFooter({ text: 'Configure message logging settings 🌸' });

      const addChannelsButton = new ButtonBuilder()
        .setCustomId('message_logs_add_blacklist')
        .setLabel('➕ Add Channels to Blacklist')
        .setStyle(ButtonStyle.Secondary);

      const removeChannelsButton = new ButtonBuilder()
        .setCustomId('message_logs_remove_blacklist')
        .setLabel('➖ Remove Channels from Blacklist')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(blacklistedChannels.length === 0);

      const clearBlacklistButton = new ButtonBuilder()
        .setCustomId('message_logs_clear_blacklist')
        .setLabel('🗑️ Clear All Blacklisted')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(blacklistedChannels.length === 0);

      const components = [
        new ActionRowBuilder().addComponents(addChannelsButton, removeChannelsButton, clearBlacklistButton)
      ];

      await interaction.reply({
        embeds: [embed],
        components: components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in config_message_logs:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to load message logging configuration! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};