const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_blacklist_add_menu_(.+)$/,
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
          content: 'No roles were selected!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_blacklist_add_menu_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      let successCount = 0;
      let alreadyAdded = [];

      for (const roleId of interaction.values) {
        try {
          await ConfigModel.addCommandBlacklistRole(commandName, roleId);
          successCount++;
          logger.info(`Added role ${roleId} to blacklist for command ${commandName} by ${interaction.user.tag}`);
        } catch (error) {
          logger.error(`Failed to add role ${roleId} to blacklist for command ${commandName}:`, error);
          alreadyAdded.push(roleId);
        }
      }

      let responseMessage = '';
      if (successCount > 0) {
        responseMessage += `🚫 Successfully added ${successCount} role(s) to the blacklist for command \`${commandName}\`.`;
      }
      if (alreadyAdded.length > 0) {
        responseMessage += ` ${alreadyAdded.length} role(s) were already in the blacklist or failed to add.`;
      }

      await interaction.reply({ 
        content: responseMessage, 
        ephemeral: true 
      });

    } catch (error) {
      logger.error('Error in command_blacklist_add_menu:', error);
      
      const errorMessage = 'An error occurred while adding roles to blacklist. Please try again.';
      
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