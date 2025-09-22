const { ChannelSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  customId: 'set_message_logs_channel',
  async execute(interaction) {
    try {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('message_logs_channel_select')
        .setPlaceholder('💬 Select a channel for message logs')
        .setChannelTypes([ChannelType.GuildText])
        .setMinValues(1)
        .setMaxValues(1);

      const actionRow = new ActionRowBuilder().addComponents(channelSelect);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('💬 Set Message Logs Channel')
        .setDescription('Select the channel where message events (edits, deletions, etc.) should be logged.\n\n**What gets logged:**\n• Message edits and deletions\n• Bulk message deletions\n• Message reactions (optional)\n• Attachment uploads/removals\n\n**Note:** Blacklisted channels will be excluded from logging.')
        .setFooter({ text: 'Choose a channel below 🌸' });

      await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in set_message_logs_channel:', error);
      
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