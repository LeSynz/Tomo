const { EmbedBuilder } = require('discord.js');
const ModerationActionModel = require('../../../models/ModerationActionModel');

module.exports = {
  customId: 'delwarn_select',
  
  async execute(interaction) {
    try {
      const caseId = interaction.values[0];

      await interaction.deferUpdate();

      const warningCase = await ModerationActionModel.getCase(caseId);

      if (!warningCase) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Warning Not Found')
          .setDescription(`Warning case \`${caseId}\` no longer exists!`)
          .setFooter({ text: 'It may have already been deleted! 💔' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed],
          components: []
        });
      }

      const targetUser = await interaction.client.users.fetch(warningCase.userId).catch(() => null);
      const moderator = await interaction.client.users.fetch(warningCase.moderatorId).catch(() => null);

      const deleted = await ModerationActionModel.deleteCase(caseId);

      if (!deleted) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Deletion Failed')
          .setDescription(`Failed to delete warning case \`${caseId}\``)
          .setFooter({ text: 'Please try again or contact support! 💔' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed],
          components: []
        });
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🗑️ Warning Deleted')
        .setDescription(`Successfully deleted warning case \`${caseId}\`!`)
        .addFields(
          {
            name: '👤 User',
            value: targetUser ? `${targetUser.tag} (\`${targetUser.id}\`)` : `Unknown User (\`${warningCase.userId}\`)`,
            inline: false
          },
          {
            name: '💭 Original Reason',
            value: `\`${warningCase.reason}\``,
            inline: false
          },
          {
            name: '📅 Warning Date',
            value: `<t:${Math.floor(new Date(warningCase.timestamp).getTime() / 1000)}:F>`,
            inline: false
          },
          {
            name: '👮 Original Moderator',
            value: moderator ? `${moderator.tag}` : `Unknown Moderator`,
            inline: true
          },
          {
            name: '🗑️ Deleted By',
            value: `${interaction.user.tag}`,
            inline: true
          }
        )
        .setFooter({ text: 'Warning permanently removed! 🧹' })
        .setTimestamp();

      if (targetUser) {
        successEmbed.setThumbnail(targetUser.displayAvatarURL());
      }

      await interaction.editReply({
        embeds: [successEmbed],
        components: []
      });

    } catch (error) {
      console.error('Error in delwarn select menu:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Deletion Failed')
        .setDescription('An error occurred while trying to delete the warning! Please try again~')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed],
        components: []
      });
    }
  },
};