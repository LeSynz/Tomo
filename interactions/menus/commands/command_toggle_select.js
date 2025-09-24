const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'command_toggle_select',
  async execute(interaction) {
    try {
      const selectedCommands = interaction.values;
      
      let toggledOn = [];
      let toggledOff = [];
      
      for (const commandName of selectedCommands) {
        const success = await ConfigModel.toggleCommand(commandName);
        
        if (success) {
          const config = await ConfigModel.getConfig();
          const commandData = config.commands[commandName];
          
          if (commandData && commandData.enabled !== false) {
            toggledOn.push(commandName);
          } else {
            toggledOff.push(commandName);
          }
        }
      }
      
      let description = '';
      if (toggledOn.length > 0) {
        description += `🟢 **Enabled (${toggledOn.length}):**\n${toggledOn.map(cmd => `• \`${cmd}\``).join('\n')}\n\n`;
      }
      if (toggledOff.length > 0) {
        description += `🔴 **Disabled (${toggledOff.length}):**\n${toggledOff.map(cmd => `• \`${cmd}\``).join('\n')}\n\n`;
      }
      
      if (description === '') {
        description = 'No commands were toggled! They might already be in the desired state.';
      }
      
      description += `\nUse **Quick Toggle** again to continue making changes!`;

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🎛️ Commands Toggled!')
        .setDescription(description)
        .setFooter({ text: 'Command states updated successfully! 🌸' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in command_toggle_select:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to toggle commands! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};