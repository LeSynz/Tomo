const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');
const moderationLogger = require('../../utils/moderationLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reason')
    .setDescription('Update the reason for a moderation case')
    .addStringOption(option =>
      option.setName('case_id')
        .setDescription('The case ID to update')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('new_reason')
        .setDescription('The new reason for this case')
        .setRequired(true)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'reason');
    if (!hasPermission) return;

    try {
      const caseId = interaction.options.getString('case_id');
      const newReason = interaction.options.getString('new_reason');

      await interaction.deferReply({ ephemeral: true });

      const caseData = await ModerationActionModel.getCase(caseId);

      if (!caseData) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Case Not Found')
          .setDescription(`No case found with ID: \`${caseId}\``)
          .setFooter({ text: 'Double-check that case ID! 🔍' });

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      const oldReason = caseData.reason;
      
      const updated = await ModerationActionModel.updateCaseReason(caseId, newReason);

      if (!updated) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Update Failed')
          .setDescription('Failed to update the case reason! Please try again~')
          .setFooter({ text: 'Something went wrong! 💔' });

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      const targetUser = await interaction.client.users.fetch(caseData.userId).catch(() => null);

      // Updating the reason, because apparently the first one wasn't good enough.
      await moderationLogger.logReasonUpdate(interaction.client, {
        caseId: caseId,
        moderator: interaction.user,
        target: targetUser || { tag: 'Unknown User', id: caseData.userId },
        oldReason: oldReason,
        newReason: newReason,
        actionType: caseData.type
      });

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('✅ Reason Updated')
        .setDescription(`Successfully updated reason for case \`${caseId}\``)
        .addFields(
          {
            name: '📝 Old Reason',
            value: `\`${oldReason}\``,
            inline: false
          },
          {
            name: '✨ New Reason',
            value: `\`${newReason}\``,
            inline: false
          },
          {
            name: '👤 Target User',
            value: targetUser ? `${targetUser.tag}` : `Unknown User (\`${caseData.userId}\`)`,
            inline: true
          },
          {
            name: '⚡ Action Type',
            value: `\`${caseData.type}\``,
            inline: true
          }
        )
        .setFooter({ text: 'Case reason updated! 🌸' })
        .setTimestamp();

      if (targetUser) {
        embed.setThumbnail(targetUser.displayAvatarURL());
      }

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in reason command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Reason Update Failed')
        .setDescription('An error occurred while updating the case reason! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};