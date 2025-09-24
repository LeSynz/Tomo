const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'toggle_logging_system',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const currentStatus = config.loggingEnabled !== false;
      const newStatus = !currentStatus;
      
      await ConfigModel.setLoggingEnabled(newStatus);
      
      const statusText = newStatus ? '✅ Enabled' : '❌ Disabled';
      const embed = new EmbedBuilder()
        .setColor(newStatus ? 0x98FB98 : 0xFFB6C1)
        .setTitle('📝 Logging System Updated')
        .setDescription(`Moderation logging is now **${statusText}**\n\n${newStatus ? 'Moderation actions will be logged to your designated channel.' : 'Moderation actions will no longer be logged.'}`)
        .setFooter({ text: 'Configuration updated successfully! 🌸' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      try {
        const updatedInterface = await renderConfigSection('logs', interaction);
        await interaction.editReply({
          ...updatedInterface,
          embeds: [embed]
        });
      } catch (error) {
        console.error('Error updating interface after logging toggle:', error);
      }

    } catch (error) {
      console.error('Error in toggle_logging_system:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to update logging system! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};