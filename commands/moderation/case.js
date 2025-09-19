const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('View details of a specific moderation case')
    .addStringOption(option =>
      option.setName('case_id')
        .setDescription('The case ID to look up')
        .setRequired(true)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'case');
    if (!hasPermission) return;

    try {
      const caseId = interaction.options.getString('case_id');

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

      const targetUser = await interaction.client.users.fetch(caseData.userId).catch(() => null);
      const moderatorUser = await interaction.client.users.fetch(caseData.moderatorId).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(`📋 Case ${caseData.caseId}`)
        .setDescription(`**${caseData.type.charAt(0).toUpperCase() + caseData.type.slice(1)}** action details`)
        .addFields(
          {
            name: '👤 Target User',
            value: targetUser ? `${targetUser.tag} (\`${targetUser.id}\`)` : `Unknown User (\`${caseData.userId}\`)`,
            inline: true
          },
          {
            name: '🔨 Moderator',
            value: moderatorUser ? `${moderatorUser.tag} (\`${moderatorUser.id}\`)` : `Unknown Moderator (\`${caseData.moderatorId}\`)`,
            inline: true
          },
          {
            name: '⚡ Action Type',
            value: `\`${caseData.type}\``,
            inline: true
          },
          {
            name: '💭 Reason',
            value: `\`${caseData.reason}\``,
            inline: false
          },
          {
            name: '🕐 Timestamp',
            value: `<t:${Math.floor(new Date(caseData.timestamp).getTime() / 1000)}:F>`,
            inline: true
          }
        )
        .setFooter({ text: 'Case details retrieved! 🌸' })
        .setTimestamp();

      if (caseData.duration) {
        embed.addFields({
          name: '⏰ Duration',
          value: `\`${caseData.duration}\``,
          inline: true
        });
      }

      if (targetUser) {
        embed.setThumbnail(targetUser.displayAvatarURL());
      }

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in case command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Case Lookup Failed')
        .setDescription('An error occurred while looking up the case! Please try again~')
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