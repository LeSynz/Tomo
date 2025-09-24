const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'toggle_appeals_system',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const currentStatus = config.appealsEnabled !== false;
      const newStatus = !currentStatus;
      
      await ConfigModel.setAppealsEnabled(newStatus);
      
      const statusText = newStatus ? '✅ Enabled' : '❌ Disabled';
      const embed = new EmbedBuilder()
        .setColor(newStatus ? 0x98FB98 : 0xFFB6C1)
        .setTitle('⚖️ Appeals System Updated')
        .setDescription(`User appeals system is now **${statusText}**\n\n${newStatus ? 'Users will be able to appeal their punishments by joining your appeal server via the invite link you configure.' : 'Users will not be able to submit appeals. Appeal buttons will be hidden from ban messages.'}`)
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
        console.error('Error updating interface after appeals toggle:', error);
      }

    } catch (error) {
      console.error('Error in toggle_appeals_system:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to update appeals system! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};