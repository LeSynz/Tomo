const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_whitelist_remove_menu_(.+)$/,
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

      const match = interaction.customId.match(/^command_whitelist_remove_menu_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      let successCount = 0;
      let failed = [];

      for (const roleId of interaction.values) {
        try {
          await ConfigModel.removeCommandWhitelistRole(commandName, roleId);
          successCount++;
          logger.info(`Removed role ${roleId} from whitelist for command ${commandName} by ${interaction.user.tag}`);
        } catch (error) {
          logger.error(`Failed to remove role ${roleId} from whitelist for command ${commandName}:`, error);
          failed.push(roleId);
        }
      }

      let responseMessage = '';
      if (successCount > 0) {
        responseMessage += `✅ Successfully removed ${successCount} role(s) from the whitelist for command \`${commandName}\`.`;
      }
      if (failed.length > 0) {
        responseMessage += ` ${failed.length} role(s) failed to remove.`;
      }

      await interaction.reply({ 
        content: responseMessage, 
        ephemeral: true 
      });

    } catch (error) {
      logger.error('Error in command_whitelist_remove_menu:', error);
      
      const errorMessage = 'An error occurred while removing roles from whitelist. Please try again.';
      
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