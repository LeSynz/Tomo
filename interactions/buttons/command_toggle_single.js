const ConfigModel = require('../../models/ConfigModel');
const logger = require('../../utils/logger');

module.exports = {
  customId: /^command_toggle_single_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_toggle_single_(.+)$/);
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

      const currentState = command.enabled !== false;
      const newState = !currentState;

      await configModel.setCommandEnabled(commandName, newState);

      logger.info(`Command ${commandName} toggled to ${newState ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);

      await interaction.reply({ 
        content: `✅ Command \`${commandName}\` is now ${newState ? '**enabled**' : '**disabled**'}.\n\nClick "Back to Commands" to return to the main view.`, 
        ephemeral: true 
      });

    } catch (error) {
      logger.error('Error in command_toggle_single:', error);
      
      const errorMessage = 'An error occurred while toggling the command. Please try again.';
      
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