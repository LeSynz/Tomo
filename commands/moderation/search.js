const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search through moderation logs')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search query (case ID, user ID, username, or reason)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Filter by action type')
        .setRequired(false)
        .addChoices(
          { name: 'All Types', value: 'all' },
          { name: 'Bans', value: 'ban' },
          { name: 'Unbans', value: 'unban' },
          { name: 'Kicks', value: 'kick' },
          { name: 'Mutes', value: 'mute' },
          { name: 'Unmutes', value: 'unmute' },
          { name: 'Warnings', value: 'warn' },
          { name: 'Channel Actions', value: 'channel' }
        ))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum results to show (1-20)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'search');
    if (!hasPermission) return;

    try {
      const query = interaction.options.getString('query').toLowerCase();
      const typeFilter = interaction.options.getString('type') || 'all';
      const limit = interaction.options.getInteger('limit') || 10;

      await interaction.deferReply({ ephemeral: true });

      const allCases = await ModerationActionModel.find();

      if (allCases.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📂 No Cases Found')
          .setDescription('No moderation cases exist yet! The logs are completely clean~ ✨')
          .setFooter({ text: 'A fresh start! 💖' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      let filteredCases = allCases.filter(case_ => {
        const matchesQuery = 
          case_.caseId.toLowerCase().includes(query) ||
          (case_.userId && case_.userId.includes(query)) ||
          case_.moderatorId.includes(query) ||
          case_.reason.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        if (typeFilter === 'all') return true;
        if (typeFilter === 'channel') {
          return ['lock', 'unlock', 'slowmode_enable', 'slowmode_disable'].includes(case_.type);
        }
        return case_.type === typeFilter;
      });

      if (filteredCases.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔍 No Results Found')
          .setDescription(`No cases found matching **"${interaction.options.getString('query')}"**`)
          .addFields({
            name: '💡 Search Tips',
            value: '• Try searching by case ID (e.g., "0001")\n• Search by user ID or username\n• Search by reason keywords\n• Use different filters for better results',
            inline: false
          })
          .setFooter({ text: 'Try a different search term! 💭' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      const sortedCases = filteredCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const casesToShow = sortedCases.slice(0, limit);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(`🔍 Search Results for "${interaction.options.getString('query')}"`)
        .setDescription(`Found **${filteredCases.length}** case${filteredCases.length === 1 ? '' : 's'} ${typeFilter !== 'all' ? `(filtered by ${typeFilter})` : ''}`)
        .setFooter({ text: `Showing ${casesToShow.length} of ${filteredCases.length} results` })
        .setTimestamp();

      for (const case_ of casesToShow) {
        const date = new Date(case_.timestamp);
        const relativeTime = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
        
        let actionEmoji = '📋';
        switch (case_.type) {
          case 'ban': actionEmoji = '🔨'; break;
          case 'unban': actionEmoji = '🔓'; break;
          case 'kick': actionEmoji = '👢'; break;
          case 'mute': actionEmoji = '🔇'; break;
          case 'unmute': actionEmoji = '🔊'; break;
          case 'warn': actionEmoji = '⚠️'; break;
          case 'lock': actionEmoji = '🔒'; break;
          case 'unlock': actionEmoji = '🔓'; break;
          case 'slowmode_enable': actionEmoji = '🐌'; break;
          case 'slowmode_disable': actionEmoji = '⚡'; break;
        }

        let fieldValue = `**Type:** ${actionEmoji} ${case_.type}\n**Reason:** ${case_.reason}\n**Date:** ${relativeTime}`;
        
        if (case_.userId) {
          fieldValue += `\n**User:** <@${case_.userId}> (\`${case_.userId}\`)`;
        }
        
        fieldValue += `\n**Moderator:** <@${case_.moderatorId}>`;

        if (case_.duration) {
          const duration = typeof case_.duration === 'number' 
            ? `${case_.duration / 60000}m`
            : case_.duration;
          fieldValue += `\n**Duration:** ${duration}`;
        }

        embed.addFields({
          name: `Case ${case_.caseId}`,
          value: fieldValue,
          inline: false
        });
      }

      if (filteredCases.length > limit) {
        embed.addFields({
          name: '📋 More Results Available',
          value: `... and ${filteredCases.length - limit} more result${filteredCases.length - limit === 1 ? '' : 's'}. Use a higher limit or be more specific to see more.`,
          inline: false
        });
      }

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in search command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Search Failed')
        .setDescription('An error occurred while searching the logs! Please try again~')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};