const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'message_logs_remove_blacklist',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const blacklistedChannels = config.messageLogsBlacklist || [];
      
      if (blacklistedChannels.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFB6C1)
              .setTitle('🚫 No Blacklisted Channels')
              .setDescription('There are no channels currently blacklisted from message logging.')
              .setFooter({ text: 'Nothing to remove! 🌸' })
          ],
          ephemeral: true
        });
      }

      const options = blacklistedChannels.map(channelId => {
        const channel = interaction.guild.channels.cache.get(channelId);
        return {
          label: channel ? channel.name : `Unknown Channel`,
          value: channelId,
          description: channel ? `Remove ${channel.name} from blacklist` : `Remove unknown channel (${channelId})`,
          emoji: channel ? '📝' : '❓'
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('message_logs_remove_blacklist_select')
        .setPlaceholder('🗑️ Select channels to remove from blacklist')
        .setMinValues(1)
        .setMaxValues(Math.min(options.length, 25))
        .addOptions(options);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('➖ Remove Channels from Blacklist')
        .setDescription(`Select channels to remove from the message logging blacklist.\n\n**Currently Blacklisted (${blacklistedChannels.length}):**\n${blacklistedChannels.map(id => {
          const channel = interaction.guild.channels.cache.get(id);
          return channel ? `• <#${id}>` : `• Unknown Channel (${id})`;
        }).join('\n')}\n\n**Note:** Removed channels will have their message events logged again.`)
        .setFooter({ text: 'Select channels below 🌸' });

      await interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in message_logs_remove_blacklist:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to load blacklisted channels! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};