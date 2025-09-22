const { ChannelSelectMenuBuilder, ChannelType, ActionRowBuilder } = require('discord.js');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'set_logs_channel',
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const channelSelectMenu = new ChannelSelectMenuBuilder()
        .setCustomId('logs_channel_menu')
        .setPlaceholder('Select a channel for logs')
        .setChannelTypes(ChannelType.GuildText);

      const actionRow = new ActionRowBuilder().addComponents(channelSelectMenu);

      await interaction.reply({
        content: 'Select the channel where you want logs to be sent:',
        components: [actionRow],
        ephemeral: true,
      });

    } catch (error) {
      logger.error('Error in set_logs_channel button:', error);
      
      const errorMessage = 'An error occurred while loading channel selector. Please try again.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: errorMessage, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          ephemeral: true 
        });
      }
    }
  },
};