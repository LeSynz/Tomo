const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const ModerationActionModel = require('../../../models/ModerationActionModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^appeal_modal_\d+$/,
  async execute(interaction) {
    try {
      const caseId = interaction.customId.split('_')[2];

      const whyBan = interaction.fields.getTextInputValue('why_ban');
      const whyAccept = interaction.fields.getTextInputValue('why_accept');
      const additionalComments = interaction.fields.getTextInputValue('additional_comments') || 'None provided';

      const appealsChannelId = await ConfigModel.getAppealsChannel();

      if (!appealsChannelId) {
        return await interaction.reply({
          content: '🌸 Appeals channel is not configured. Please contact staff directly.',
          ephemeral: true
        });
      }

      const appealsChannel = await interaction.client.channels.fetch(appealsChannelId).catch(() => null);
      
      if (!appealsChannel) {
        return await interaction.reply({
          content: '🌸 Appeals channel not found. Please contact staff directly.',
          ephemeral: true
        });
      }

      const caseData = await ModerationActionModel.getCase(caseId);
      
      if (!caseData) {
        return await interaction.reply({
          content: '🌸 Case not found. Please contact staff with your case ID.',
          ephemeral: true
        });
      }

      const appealEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('📝 New Ban Appeal')
        .setDescription('A user has submitted a ban appeal')
        .addFields(
          {
            name: '👤 User Information',
            value: `**Username:** ${interaction.user.tag}\n**User ID:** ${interaction.user.id}\n**Case ID:** \`${caseId}\``,
            inline: false
          },
          {
            name: '🔨 Original Ban Info',
            value: `**Type:** ${caseData.type}\n**Reason:** \`${caseData.reason}\`\n**Date:** <t:${Math.floor(new Date(caseData.timestamp).getTime() / 1000)}:F>`,
            inline: false
          },
          {
            name: '💭 Why did you get banned?',
            value: whyBan.substring(0, 1000),
            inline: false
          },
          {
            name: '📚 Why should your ban be lifted?',
            value: whyAccept.substring(0, 1000),
            inline: false
          },
          {
            name: '💬 Additional Comments',
            value: additionalComments.substring(0, 1000),
            inline: false
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Appeal submitted' })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`appeal_approve_${caseId}_${interaction.user.id}`)
          .setLabel('✅ Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`appeal_deny_${caseId}_${interaction.user.id}`)
          .setLabel('❌ Deny')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`appeal_history_${interaction.user.id}`)
          .setLabel('📋 Case History')
          .setStyle(ButtonStyle.Secondary)
      );

      await appealsChannel.send({
        embeds: [appealEmbed],
        components: [actionRow]
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('📝 Appeal Submitted!')
        .setDescription('Your ban appeal has been submitted successfully~')
        .addFields(
          {
            name: '📋 Case ID',
            value: `\`${caseId}\``,
            inline: true
          },
          {
            name: '⏰ What happens next?',
            value: 'Staff will review your appeal and respond accordingly. Please be patient!',
            inline: false
          }
        )
        .setFooter({ text: 'Thank you for taking the time to appeal! 💖' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      logger.info(`Ban appeal submitted by ${interaction.user.tag} for case ${caseId}`);

    } catch (error) {
      logger.error('Error processing appeal modal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Appeal Failed')
        .setDescription('An error occurred while submitting your appeal. Please try again or contact staff directly.')
        .setFooter({ text: 'We apologize for the inconvenience 💔' });

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