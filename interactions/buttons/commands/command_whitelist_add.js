const { RoleSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_whitelist_add_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_whitelist_add_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];

      const roleSelectMenu = new RoleSelectMenuBuilder()
        .setCustomId(`command_whitelist_add_menu_${commandName}`)
        .setPlaceholder('Select roles to add to whitelist')
        .setMinValues(1)
        .setMaxValues(25);

      const actionRow = new ActionRowBuilder().addComponents(roleSelectMenu);

      await interaction.reply({
        content: `Select roles to add to the whitelist for command \`${commandName}\`:`,
        components: [actionRow],
        ephemeral: true,
      });

    } catch (error) {
      logger.error('Error in command_whitelist_add:', error);
      
      const errorMessage = 'An error occurred while loading role selector. Please try again.';
      
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