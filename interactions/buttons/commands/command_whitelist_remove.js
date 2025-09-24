const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_whitelist_remove_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_whitelist_remove_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      const config = await ConfigModel.getConfig();
      const command = config.commands[commandName];

      if (!command || !command.whitelist || command.whitelist.length === 0) {
        return await interaction.reply({ 
          content: `No roles in whitelist for command \`${commandName}\`!`, 
          ephemeral: true 
        });
      }

      const options = command.whitelist
        .map(roleId => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? { label: role.name, value: role.id } : null;
        })
        .filter(Boolean);

      if (options.length === 0) {
        return await interaction.reply({ 
          content: 'No valid roles found in whitelist to remove!', 
          ephemeral: true 
        });
      }

      const roleSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`command_whitelist_remove_menu_${commandName}`)
        .setPlaceholder('Select roles to remove from whitelist')
        .setMinValues(1)
        .setMaxValues(Math.min(options.length, 25))
        .addOptions(options);

      const actionRow = new ActionRowBuilder().addComponents(roleSelectMenu);

      await interaction.reply({
        content: `Select roles to remove from the whitelist for command \`${commandName}\`:`,
        components: [actionRow],
        ephemeral: true,
      });

    } catch (error) {
      logger.error('Error in command_whitelist_remove:', error);
      
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