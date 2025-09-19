const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('View moderation statistics for yourself or a specific moderator')
    .addUserOption(option =>
      option.setName('moderator')
        .setDescription('View statistics for a specific moderator (defaults to yourself)')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'modstats');
    if (!hasPermission) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      const targetModerator = interaction.options.getUser('moderator') || interaction.user;
      
      const stats = await ModerationActionModel.getModeratorStatistics(targetModerator.id);
      const title = `📊 Moderation Statistics`;
      const description = `**Moderator:** ${targetModerator.tag} (<@${targetModerator.id}>)\n**User ID:** ${targetModerator.id}`;

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(targetModerator.displayAvatarURL())
        .setTimestamp()
        .setFooter({ 
          text: `Requested by ${interaction.user.tag} • Statistics as of now 💖`,
          iconURL: interaction.user.displayAvatarURL()
        });

      const formatStat = (actionType, data) => {
        const emoji = {
          mute: '🔇',
          ban: '🔨',
          kick: '👢',
          warn: '⚠️',
          unban: '🔓',
          unmute: '🔊',
          total: '📈'
        }[actionType] || '📋';

        const name = actionType.charAt(0).toUpperCase() + actionType.slice(1);
        
        return {
          name: `${emoji} ${name}${actionType === 'total' ? '' : 's'}`,
          value: `**Last 7 days:** ${data.last7}\n**Last 30 days:** ${data.last30}\n**All time:** ${data.allTime}`,
          inline: true
        };
      };

      if (stats.total.allTime === 0) {
        const noStatsEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📊 Moderation Statistics')
          .setDescription(`**${targetModerator.tag}** hasn't performed any moderation actions yet! 🌸`)
          .addFields({
            name: '💡 Info',
            value: 'Statistics will appear here once moderation commands are used.',
            inline: false
          })
          .setThumbnail(targetModerator.displayAvatarURL())
          .setFooter({ 
            text: `Requested by ${interaction.user.tag} • Clean slate! 💖`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [noStatsEmbed] });
      }

      const actionTypes = ['mute', 'ban', 'kick', 'warn'];
      
      actionTypes.forEach(type => {
        if (stats[type]) {
          embed.addFields(formatStat(type, stats[type]));
        }
      });

      if (stats.unban && (stats.unban.allTime > 0 || stats.unban.last30 > 0 || stats.unban.last7 > 0)) {
        embed.addFields(formatStat('unban', stats.unban));
      }

      if (stats.unmute && (stats.unmute.allTime > 0 || stats.unmute.last30 > 0 || stats.unmute.last7 > 0)) {
        embed.addFields(formatStat('unmute', stats.unmute));
      }

      embed.addFields(formatStat('total', stats.total));

      const recentActivity = stats.total.last7;
      const olderActivity = stats.total.last30 - stats.total.last7;
      const mostActiveText = recentActivity > olderActivity ? 'Last 7 days' : 
                            olderActivity > recentActivity ? 'Previous 23 days' : 'Consistent activity';

      const actionsByType = Object.entries(stats)
        .filter(([key]) => key !== 'total')
        .filter(([, data]) => data.allTime > 0)
        .sort(([,a], [,b]) => b.allTime - a.allTime);

      const primaryAction = actionsByType.length > 0 ? 
        actionsByType[0][0].charAt(0).toUpperCase() + actionsByType[0][0].slice(1) : 'None';

      const summaryText = [
        `**Most active period:** ${mostActiveText}`,
        `**Primary action:** ${primaryAction}${actionsByType.length > 0 ? `s (${actionsByType[0][1].allTime})` : ''}`
      ].join('\n');

      embed.addFields({
        name: '📋 Summary',
        value: summaryText,
        inline: false
      });

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in modstats command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Statistics Error')
        .setDescription('An error occurred while fetching moderation statistics. Please try again.')
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