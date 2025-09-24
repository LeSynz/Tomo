const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_blacklist_remove_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_blacklist_remove_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      const config = await ConfigModel.getConfig();
      const command = config.commands[commandName];

      if (!command || !command.blacklist || command.blacklist.length === 0) {
        return await interaction.reply({ 
          content: `No roles in blacklist for command \`${commandName}\`!`, 
          ephemeral: true 
        });
      }

      const options = command.blacklist
        .map(roleId => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? { label: role.name, value: role.id } : null;
        })
        .filter(Boolean);

      if (options.length === 0) {
        return await interaction.reply({ 
          content: 'No valid roles found in blacklist to remove!', 
          ephemeral: true 
        });
      }

      const roleSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`command_blacklist_remove_menu_${commandName}`)
        .setPlaceholder('Select roles to remove from blacklist')
        .setMinValues(1)
        .setMaxValues(Math.min(options.length, 25))
        .addOptions(options);

      const actionRow = new ActionRowBuilder().addComponents(roleSelectMenu);

      await interaction.reply({
        content: `Select roles to remove from the blacklist for command \`${commandName}\`:`,
        components: [actionRow],
        ephemeral: true,
      });

    } catch (error) {
      logger.error('Error in command_blacklist_remove:', error);
      
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