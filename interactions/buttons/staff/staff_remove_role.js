const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'staff_remove_role',
  async execute(interaction) {
    try {
      const guild = interaction.guild;
      
      if (!guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const staffRoles = await ConfigModel.getStaffRoles();

      const options = staffRoles
          .map(roleId => {
              const role = guild.roles.cache.get(roleId);
              if (role) {
                  return {
                      label: role.name,
                      value: role.id,
                  };
              }
              return null;
          })
          .filter(option => option !== null);

      if (options.length === 0) {
          return await interaction.reply({ 
            content: 'No staff roles to remove.', 
            ephemeral: true 
          });
      }

      const roleSelectMenu = new StringSelectMenuBuilder()
          .setCustomId('staff_remove_role_menu')
          .setPlaceholder('Select roles to remove from staff roles')
          .addOptions(options)
          .setMinValues(1)
          .setMaxValues(Math.min(25, options.length));

      const actionRow = new ActionRowBuilder().addComponents(roleSelectMenu);

      await interaction.reply({
        content: 'Select the roles you want to remove from staff roles:',
        components: [actionRow],
        ephemeral: true,
      });

    } catch (error) {
      logger.error('Error in staff_remove_role button:', error);
      
      const errorMessage = 'An error occurred while loading staff roles. Please try again.';
      
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
