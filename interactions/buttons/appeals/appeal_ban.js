const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^appeal_ban_\d+$/,
  async execute(interaction) {
    try {
      const caseId = interaction.customId.split('_')[2];

      const modal = new ModalBuilder()
        .setCustomId(`appeal_modal_${caseId}`)
        .setTitle('🌸 Ban Appeal Form');

      const whyLiftInput = new TextInputBuilder()
        .setCustomId('why_ban')
        .setLabel('Why did you get banned?')
        .setPlaceholder('Explain why you were banned...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const whatLearnedInput = new TextInputBuilder()
        .setCustomId('why_accept')
        .setLabel('Why should your ban be lifted?')
        .setPlaceholder('Explain why you believe the ban should be removed...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const additionalInput = new TextInputBuilder()
        .setCustomId('additional_comments')
        .setLabel('Additional comments')
        .setPlaceholder('Any additional information you would like to provide...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(whyLiftInput),
        new ActionRowBuilder().addComponents(whatLearnedInput),
        new ActionRowBuilder().addComponents(additionalInput)
      );

      await interaction.showModal(modal);

    } catch (error) {
      logger.error('Error in appeal_ban button:', error);
      
      const errorMessage = 'An error occurred while opening the appeal form. Please try again or contact staff directly.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: errorMessage, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          ephemeral: true 
        });
      }
    }
  },
};