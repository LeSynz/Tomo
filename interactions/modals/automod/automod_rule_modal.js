const { EmbedBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'automod_rule_modal',
  
  async execute(interaction) {
    try {
      const thresholdStr = interaction.fields.getTextInputValue('automod_threshold');
      const action = interaction.fields.getTextInputValue('automod_action').toLowerCase().trim();
      const duration = interaction.fields.getTextInputValue('automod_duration')?.trim() || null;

      const threshold = parseInt(thresholdStr);
      
      if (isNaN(threshold) || threshold < 1 || threshold > 50) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Invalid Threshold')
          .setDescription('Threshold must be a number between 1 and 50.')
          .setFooter({ text: 'Please try again with a valid number' });

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }

      if (!['mute', 'kick', 'ban'].includes(action)) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Invalid Action')
          .setDescription('Action must be one of: `mute`, `kick`, or `ban`')
          .setFooter({ text: 'Please use exactly those words' });

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }

      if (action === 'mute' && !duration) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Duration Required')
          .setDescription('Mute action requires a duration (e.g., 1h, 30m, 1d)')
          .setFooter({ text: 'Please specify how long to mute users' });

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }

      if (action === 'mute' && duration) {
        const durationRegex = /^(\d+)([mhd])$/;
        if (!durationRegex.test(duration)) {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Invalid Duration Format')
            .setDescription('Duration must be in format: `1m` (minutes), `1h` (hours), or `1d` (days)')
            .setFooter({ text: 'Examples: 30m, 2h, 1d' });

          return await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      await ConfigModel.addAutomodRule(threshold, action, duration);

      const actionText = action === 'mute' ? `Mute for ${duration}` : action === 'kick' ? 'Kick' : 'Ban';
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Automod Rule Added')
        .setDescription(`Successfully added automod rule!\n\n**Threshold:** ${threshold} warnings\n**Action:** ${actionText}`)
        .setFooter({ text: 'Rule will take effect immediately' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Automod rule added by ${interaction.user.tag}: ${threshold} warnings → ${actionText}`);

    } catch (error) {
      logger.error('Error adding automod rule:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to add automod rule. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};