const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'toggle_message_logging_system',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const currentStatus = config.messageLoggingEnabled !== false;
      const newStatus = !currentStatus;
      
      const updatedConfig = {
        ...config,
        messageLoggingEnabled: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      await ConfigModel.setConfig(updatedConfig);
      
      const { components } = await renderConfigSection('logs', interaction);
      
      await interaction.update({ components });
      
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(newStatus ? 0x00FF00 : 0xFF6B6B)
            .setTitle(`💬 Message Logging ${newStatus ? 'Enabled' : 'Disabled'}`)
            .setDescription(newStatus 
              ? '✅ Message logging is now **enabled**!\n\n💡 Don\'t forget to set a message logs channel and configure blacklisted channels.'
              : '❌ Message logging is now **disabled**.\n\nMessage edits, deletions, and other events will no longer be logged.')
            .setTimestamp()
            .setFooter({ text: 'Configuration Updated 🌸' })
        ],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error toggling message logging system:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to toggle message logging system! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};