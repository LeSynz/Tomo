const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  customId: 'message_logs_add_blacklist',
  async execute(interaction) {
    try {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('message_logs_add_blacklist_select')
        .setPlaceholder('🚫 Select channels to blacklist from message logging')
        .setChannelTypes([ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildForum, ChannelType.PublicThread, ChannelType.PrivateThread])
        .setMinValues(1)
        .setMaxValues(10);

      const actionRow = new ActionRowBuilder().addComponents(channelSelect);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('➕ Add Channels to Blacklist')
        .setDescription('Select up to 10 channels to exclude from message logging.\n\n**Good candidates for blacklisting:**\n• Bot command channels\n• Spam/meme channels\n• Private staff channels\n• Temporary channels\n• Log channels themselves\n\n**Note:** Selected channels will have their message events ignored by the logging system.')
        .setFooter({ text: 'Select channels below 🌸' });

      await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in message_logs_add_blacklist:', error);
      
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Error')
            .setDescription('Failed to open channel selection! Please try again~')
            .setFooter({ text: 'Something went wrong! 💔' })
        ],
        ephemeral: true
      });
    }
  }
};