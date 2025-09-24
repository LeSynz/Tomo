const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'message_logs_add_blacklist_select',
  async execute(interaction) {
    try {
      const selectedChannelIds = interaction.values;
      
      const config = await ConfigModel.getConfig();
      
      const currentBlacklist = config.messageLogsBlacklist || [];
      const newChannels = selectedChannelIds.filter(id => !currentBlacklist.includes(id));
      const alreadyBlacklisted = selectedChannelIds.filter(id => currentBlacklist.includes(id));
      
      if (newChannels.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFB6C1)
              .setTitle('🚫 Channels Already Blacklisted')
              .setDescription('All selected channels are already blacklisted from message logging.')
              .setFooter({ text: 'No changes made! 🌸' })
          ],
          ephemeral: true
        });
      }

      const updatedBlacklist = [...currentBlacklist, ...newChannels];
      const updatedConfig = {
        ...config,
        messageLogsBlacklist: updatedBlacklist,
        updatedAt: new Date().toISOString()
      };
      
      await ConfigModel.setConfig(updatedConfig);
      
      const addedChannelsText = newChannels.map(id => `<#${id}>`).join(', ');
      const skippedText = alreadyBlacklisted.length > 0 
        ? `\n\n⚠️ **Already blacklisted:** ${alreadyBlacklisted.map(id => `<#${id}>`).join(', ')}`
        : '';
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('➕ Channels Added to Blacklist')
            .setDescription(`✅ Successfully added ${newChannels.length} channel${newChannels.length === 1 ? '' : 's'} to the message logging blacklist!\n\n**Added:** ${addedChannelsText}${skippedText}\n\n**Note:** These channels will no longer have their message events logged.`)
            .setTimestamp()
            .setFooter({ text: 'Blacklist updated 🌸' })
        ],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error adding channels to message logs blacklist:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to add channels to blacklist! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};