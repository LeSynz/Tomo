const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'command_toggle_menu',
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
          content: 'No commands were selected!', 
          ephemeral: true 
        });
      }

      let toggledCommands = [];

      for (const commandName of interaction.values) {
        try {
          const currentConfig = await ConfigModel.getConfig();
          const currentState = currentConfig.commands[commandName]?.enabled !== false;
          
          await ConfigModel.setCommandEnabled(commandName, !currentState);
          toggledCommands.push({
            name: commandName,
            newState: !currentState
          });
          
          logger.info(`Toggled command ${commandName} to ${!currentState ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);
        } catch (error) {
          logger.error(`Failed to toggle command ${commandName}:`, error);
        }
      }

      if (toggledCommands.length === 0) {
        return await interaction.reply({ 
          content: 'No commands could be toggled. Please try again.', 
          ephemeral: true 
        });
      }

      const toggleMessage = toggledCommands
        .map(cmd => `\`${cmd.name}\`: ${cmd.newState ? '✅ Enabled' : '❌ Disabled'}`)
        .join('\n');

      await interaction.reply({ 
        content: `Successfully toggled ${toggledCommands.length} command(s):\n${toggleMessage}\n\nClick section again to see updates.`, 
        ephemeral: true 
      });
    } catch (error) {
      logger.error('Error in command_toggle_menu:', error);
      
      const errorMessage = 'An error occurred while toggling commands. Please try again.';
      
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