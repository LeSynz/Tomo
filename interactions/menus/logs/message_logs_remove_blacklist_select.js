const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'message_logs_remove_blacklist_select',
  async execute(interaction) {
    try {
      const selectedChannelIds = interaction.values;
      
      const config = await ConfigModel.getConfig();
      
      const currentBlacklist = config.messageLogsBlacklist || [];
      const updatedBlacklist = currentBlacklist.filter(id => !selectedChannelIds.includes(id));
      
      const updatedConfig = {
        ...config,
        messageLogsBlacklist: updatedBlacklist,
        updatedAt: new Date().toISOString()
      };
      
      await ConfigModel.setConfig(updatedConfig);
      
      const removedChannelsText = selectedChannelIds.map(id => {
        const channel = interaction.guild.channels.cache.get(id);
        return channel ? `<#${id}>` : `Unknown Channel (${id})`;
      }).join(', ');
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('➖ Channels Removed from Blacklist')
            .setDescription(`✅ Successfully removed ${selectedChannelIds.length} channel${selectedChannelIds.length === 1 ? '' : 's'} from the message logging blacklist!\n\n**Removed:** ${removedChannelsText}\n\n**Note:** These channels will now have their message events logged again.`)
            .setTimestamp()
            .setFooter({ text: 'Blacklist updated 🌸' })
        ],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error removing channels from message logs blacklist:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to remove channels from blacklist! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};