const { EmbedBuilder } = require('discord.js');
const AppealModel = require('../../models/AppealModel');
const ModerationActionModel = require('../../models/ModerationActionModel');
const logger = require('../../utils/logger');

module.exports = {
  customId: /^appeal_history_\d+$/,
  async execute(interaction) {
    try {
      // Extract user ID from button custom ID
      const userId = interaction.customId.split('_')[2];

      // Get user's case history and appeal history
      const userCases = await ModerationActionModel.getUserCases(userId);
      const appeals = await AppealModel.getAppealHistory(userId);

      if (!userCases || userCases.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📋 User History')
          .setDescription('No moderation history found for this user.')
          .setFooter({ text: 'Clean record! ✨' });

        // Still check for appeals even if no cases
        if (appeals && appeals.length > 0) {
          const pendingAppeals = appeals.filter(a => a.status === 'pending').length;
          const approvedAppeals = appeals.filter(a => a.status === 'approved').length;
          const deniedAppeals = appeals.filter(a => a.status === 'denied').length;
          
          embed.addFields({
            name: '📝 Appeal Statistics',
            value: `**Pending:** ${pendingAppeals} | **Approved:** ${approvedAppeals} | **Denied:** ${deniedAppeals}`,
            inline: false
          });
        }

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // Get user information
      let userTag = 'Unknown User';
      try {
        const user = await interaction.client.users.fetch(userId);
        userTag = user.tag;
      } catch (error) {
        console.log('Could not fetch user for case history:', error.message);
      }

      // Sort cases by timestamp (newest first)
      userCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Create case history embed
      const historyEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('📋 User History & Appeals')
        .setDescription(`**User:** ${userTag}\n**User ID:** ${userId}\n**Total Cases:** ${userCases.length}`)
        .setTimestamp();

      // Add cases to embed (limit to prevent embed size issues)
      const maxCases = 5; // Reduced to make room for appeals
      const casesToShow = userCases.slice(0, maxCases);

      for (const caseData of casesToShow) {
        const date = new Date(caseData.timestamp);
        const timestamp = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
        
        let moderatorInfo = 'Unknown';
        try {
          const moderator = await interaction.client.users.fetch(caseData.moderatorId);
          moderatorInfo = moderator.tag;
        } catch (error) {
          moderatorInfo = `ID: ${caseData.moderatorId}`;
        }

        const fieldValue = `**Type:** ${caseData.type} | **Moderator:** ${moderatorInfo}\n**Reason:** ${caseData.reason}\n**Date:** ${timestamp}`;

        historyEmbed.addFields({
          name: `⚖️ Case ${caseData.caseId}`,
          value: fieldValue,
          inline: false
        });
      }

      // Add appeal history
      if (appeals && appeals.length > 0) {
        const maxAppeals = 3;
        const appealsToShow = appeals
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, maxAppeals);

        for (const appeal of appealsToShow) {
          const date = new Date(appeal.submittedAt);
          const timestamp = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
          const statusEmoji = appeal.status === 'approved' ? '✅' : appeal.status === 'denied' ? '❌' : '⏳';
          
          const appealValue = `**Status:** ${statusEmoji} ${appeal.status}\n**Submitted:** ${timestamp}`;

          historyEmbed.addFields({
            name: `📝 Appeal for Case ${appeal.caseId}`,
            value: appealValue,
            inline: true
          });
        }

        // Add appeal statistics
        const pendingAppeals = appeals.filter(a => a.status === 'pending').length;
        const approvedAppeals = appeals.filter(a => a.status === 'approved').length;
        const deniedAppeals = appeals.filter(a => a.status === 'denied').length;

        historyEmbed.addFields({
          name: '📊 Appeal Statistics',
          value: `**Total Appeals:** ${appeals.length}\n**Pending:** ${pendingAppeals} | **Approved:** ${approvedAppeals} | **Denied:** ${deniedAppeals}`,
          inline: false
        });
      }

      if (userCases.length > maxCases) {
        historyEmbed.setFooter({ 
          text: `Showing ${maxCases} of ${userCases.length} cases | Appeals: ${appeals?.length || 0} | 💖` 
        });
      } else {
        historyEmbed.setFooter({ 
          text: `All ${userCases.length} cases shown | Appeals: ${appeals?.length || 0} | 💖` 
        });
      }

      await interaction.reply({
        embeds: [historyEmbed],
        ephemeral: true
      });

      logger.info(`Case history viewed by ${interaction.user.tag} for user ${userId}`);

    } catch (error) {
      logger.error('Error showing case history:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('An error occurred while fetching case history. Please try again.')
        .setFooter({ text: 'Contact an administrator if this persists 💔' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          embeds: [errorEmbed], 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          embeds: [errorEmbed], 
          ephemeral: true 
        });
      }
    }
  },
};