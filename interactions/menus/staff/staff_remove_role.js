const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'staff_remove_role_menu',
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

      let successCount = 0;
      let invalidRoles = [];

      for (const roleId of interaction.values) {
        if (interaction.guild.roles.cache.has(roleId)) {
          try {
            await ConfigModel.setStaffRole(roleId, false);
            successCount++;
            logger.info(`Removed staff role ${roleId} by ${interaction.user.tag}`);
          } catch (error) {
            logger.error(`Failed to remove staff role ${roleId}:`, error);
            invalidRoles.push(roleId);
          }
        } else {
          invalidRoles.push(roleId);
        }
      }

      let responseMessage = '';
      if (successCount > 0) {
        responseMessage += `Successfully removed ${successCount} staff role(s).`;
      }
      if (invalidRoles.length > 0) {
        responseMessage += ` ${invalidRoles.length} role(s) could not be removed (invalid or not found).`;
      }
      responseMessage += ' Click section again to see updates.';

      await interaction.reply({ 
        content: responseMessage, 
        ephemeral: true 
      });
    } catch (error) {
      logger.error('Error in staff_remove_role_menu:', error);
      
      const errorMessage = 'An error occurred while updating staff roles. Please try again.';
      
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
