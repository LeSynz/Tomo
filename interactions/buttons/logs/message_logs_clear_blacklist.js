const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'message_logs_clear_blacklist',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const blacklistedChannels = config.messageLogsBlacklist || [];
      
      if (blacklistedChannels.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFB6C1)
              .setTitle('🚫 No Blacklisted Channels')
              .setDescription('There are no channels currently blacklisted from message logging.')
              .setFooter({ text: 'Nothing to clear! 🌸' })
          ],
          ephemeral: true
        });
      }

      const updatedConfig = {
        ...config,
        messageLogsBlacklist: [],
        updatedAt: new Date().toISOString()
      };
      
      await ConfigModel.setConfig(updatedConfig);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🗑️ Blacklist Cleared')
            .setDescription(`✅ Successfully cleared all blacklisted channels!\n\n**Removed ${blacklistedChannels.length} channel${blacklistedChannels.length === 1 ? '' : 's'} from blacklist:**\n${blacklistedChannels.map(id => {
              const channel = interaction.guild.channels.cache.get(id);
              return channel ? `• <#${id}>` : `• Unknown Channel (${id})`;
            }).join('\n')}\n\n**Note:** All channels will now have their message events logged.`)
            .setTimestamp()
            .setFooter({ text: 'Blacklist cleared 🌸' })
        ],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error clearing message logs blacklist:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to clear blacklist! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};