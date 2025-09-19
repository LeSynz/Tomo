const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View moderation case history for yourself or a specific user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('View case history for a specific user (defaults to yourself)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of cases to show (1-20, default: 10)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'modlogs');
    if (!hasPermission) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const limit = interaction.options.getInteger('limit') || 10;
      
      
      const userCases = await ModerationActionModel.getUserCases(targetUser.id);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('📋 Moderation Case History')
        .setDescription(`**User:** ${targetUser.tag} (<@${targetUser.id}>)\n**User ID:** ${targetUser.id}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag} • ${userCases.length} total cases 💖`,
          iconURL: interaction.user.displayAvatarURL()
        });

      if (!userCases || userCases.length === 0) {
        embed.setDescription(`**${targetUser.tag}** has no moderation history! ✨`)
          .addFields({
            name: '💡 Clean Record',
            value: 'This user has never been warned, muted, banned, or kicked.',
            inline: false
          });

        return await interaction.editReply({ embeds: [embed] });
      }

      userCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const casesToShow = userCases.slice(0, limit);

      const caseTypes = {};
      userCases.forEach(c => {
        const type = c.type.toLowerCase();
        caseTypes[type] = (caseTypes[type] || 0) + 1;
      });

      const summaryText = Object.entries(caseTypes)
        .map(([type, count]) => {
          const emoji = {
            mute: '🔇',
            ban: '🔨',
            kick: '👢',
            warn: '⚠️',
            unban: '🔓',
            unmute: '🔊'
          }[type] || '📋';
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          return `${emoji} ${typeName}s: **${count}**`;
        })
        .join(' • ');

      embed.addFields({
        name: '📊 Case Summary',
        value: summaryText,
        inline: false
      });

      for (const caseData of casesToShow) {
        const date = new Date(caseData.timestamp);
        const timestamp = `<t:${Math.floor(date.getTime() / 1000)}:F>`;
        const relativeTime = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
        
        let moderatorInfo = 'Unknown';
        try {
          const moderator = await interaction.client.users.fetch(caseData.moderatorId);
          moderatorInfo = `${moderator.tag}`;
        } catch (error) {
          moderatorInfo = `Unknown (ID: ${caseData.moderatorId})`;
        }

        const actionEmoji = {
          mute: '🔇',
          ban: '🔨',
          kick: '👢',
          warn: '⚠️',
          unban: '🔓',
          unmute: '🔊'
        }[caseData.type.toLowerCase()] || '📋';

        const fieldValue = [
          `**Type:** ${actionEmoji} ${caseData.type}`,
          `**Moderator:** ${moderatorInfo}`,
          `**Reason:** ${caseData.reason}`,
          `**Date:** ${timestamp} (${relativeTime})`
        ];

        if (caseData.duration) {
          fieldValue.splice(3, 0, `**Duration:** ${caseData.duration}`);
        }

        embed.addFields({
          name: `📋 Case ${caseData.caseId}`,
          value: fieldValue.join('\n'),
          inline: false
        });
      }

      if (userCases.length > limit) {
        embed.addFields({
          name: '📄 Pagination',
          value: `Showing ${limit} of ${userCases.length} total cases. Use \`/modlogs user:${targetUser.tag} limit:${Math.min(userCases.length, 20)}\` to see more.`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in modlogs command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Case History Error')
        .setDescription('An error occurred while fetching case history. Please try again.')
        .setFooter({ text: 'Contact an administrator if this persists 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};