const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'add_automod_rule',
  
  async execute(interaction) {
    try {
      const modal = new ModalBuilder()
        .setCustomId('automod_rule_modal')
        .setTitle('🤖 Add Automod Rule');

      const thresholdInput = new TextInputBuilder()
        .setCustomId('automod_threshold')
        .setLabel('Warning Threshold')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Number of warnings (e.g., 3)')
        .setMinLength(1)
        .setMaxLength(2)
        .setRequired(true);

      const actionInput = new TextInputBuilder()
        .setCustomId('automod_action')
        .setLabel('Punishment Action')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('mute, kick, or ban')
        .setMinLength(3)
        .setMaxLength(4)
        .setRequired(true);

      const durationInput = new TextInputBuilder()
        .setCustomId('automod_duration')
        .setLabel('Mute Duration (if action is mute)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('1h, 1d, 30m, etc. (leave empty for kick/ban)')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(thresholdInput),
        new ActionRowBuilder().addComponents(actionInput),
        new ActionRowBuilder().addComponents(durationInput)
      );

      await interaction.showModal(modal);

    } catch (error) {
      logger.error('Error showing automod rule modal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to open automod rule form. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};