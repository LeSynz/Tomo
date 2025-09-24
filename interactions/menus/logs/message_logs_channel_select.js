const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'message_logs_channel_select',
  async execute(interaction) {
    try {
      const selectedChannelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(selectedChannelId);
      
      if (!channel) {
        return await interaction.reply({
          content: '❌ Selected channel not found! Please try again.',
          ephemeral: true
        });
      }

      const config = await ConfigModel.getConfig();
      
      
      const updatedConfig = {
        ...config,
        messageLogsChannelId: selectedChannelId,
        updatedAt: new Date().toISOString()
      };
      
      await ConfigModel.setConfig(updatedConfig);
      
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('💬 Message Logs Channel Updated')
            .setDescription(`✅ Message logs channel has been set to ${channel}!\n\n**What happens now:**\n• Message edits and deletions will be logged here\n• Bulk message deletions will be recorded\n• Attachment changes will be tracked\n\n💡 Use the **Configure Message Logging** button to set up blacklisted channels.`)
            .setTimestamp()
            .setFooter({ text: 'Configuration Updated 🌸' })
        ],
        components: []
      });
      
    } catch (error) {
      console.error('Error setting message logs channel:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to set message logs channel! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};