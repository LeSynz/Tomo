const ConfigModel = require('../../models/ConfigModel');
const logger = require('../../utils/logger');

module.exports = {
  customId: /^command_toggle_public_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_toggle_public_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      const configModel = new ConfigModel();
      const config = await configModel.getConfig();
      const command = config.commands[commandName];

      if (!command) {
        return await interaction.reply({ 
          content: `Command "${commandName}" not found!`, 
          ephemeral: true 
        });
      }

      const currentPublicStatus = command.isPublic === true;
      const newPublicStatus = !currentPublicStatus;

      await configModel.setCommandPublic(commandName, newPublicStatus);

      const statusText = newPublicStatus 
        ? '🌍 **Public** (everyone can use)' 
        : '👑 **Staff Only** (requires staff role or whitelist)';
      
      await interaction.reply({
        content: `✅ Command \`${commandName}\` is now ${statusText}`,
        ephemeral: true
      });

      logger.info(`User ${interaction.user.tag} toggled public status for command ${commandName}: ${newPublicStatus}`);

    } catch (error) {
      logger.error('Error in command_toggle_public:', error);
      
      const errorMessage = 'An error occurred while toggling command access type. Please try again.';
      
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