const logger = require('../../../utils/logger');

module.exports = {
  customId: 'example_select',
  async execute(interaction) {
    try {
      if (!interaction.values || interaction.values.length === 0) {
        return await interaction.reply({ 
          content: 'No options were selected!', 
          ephemeral: true 
        });
      }

      const selectedValues = interaction.values.join(', ');
      logger.info(`Example select menu used by ${interaction.user.tag}: ${selectedValues}`);
      
      await interaction.reply({ 
        content: `You selected: ${selectedValues}`, 
        ephemeral: true 
      });
    } catch (error) {
      logger.error('Error in example_select:', error);
      
      const errorMessage = 'An error occurred while processing your selection. Please try again.';
      
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
