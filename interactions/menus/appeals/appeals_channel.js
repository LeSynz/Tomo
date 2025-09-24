const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'appeals_channel_menu',
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      if (!interaction.values || interaction.values.length === 0) {
        return await interaction.reply({ 
          content: 'No channel was selected!', 
          ephemeral: true 
        });
      }

      const channelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return await interaction.reply({ 
          content: 'Invalid channel selected. Please select a text channel.', 
          ephemeral: true 
        });
      }

      
      try {
        await ConfigModel.setAppealsChannel(channelId);
        
        logger.info(`Appeals channel set to ${channel.name} (${channelId}) by ${interaction.user.tag}`);
        
        await interaction.reply({ 
          content: `Successfully set appeals channel to ${channel}. Click section again to see updates.`, 
          ephemeral: true 
        });
      } catch (error) {
        logger.error(`Failed to set appeals channel:`, error);
        await interaction.reply({ 
          content: 'Failed to save appeals channel setting. Please try again.', 
          ephemeral: true 
        });
      }
    } catch (error) {
      logger.error('Error in appeals_channel_menu:', error);
      
      const errorMessage = 'An error occurred while setting the appeals channel. Please try again.';
      
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