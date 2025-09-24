const { EmbedBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'remove_automod_rule_menu',
  
  async execute(interaction) {
    try {
      const selectedValue = interaction.values[0];
      const threshold = parseInt(selectedValue.replace('remove_', ''));

      const rules = await ConfigModel.getAutomodRules();
      const ruleToRemove = rules.find(rule => rule.threshold === threshold);

      if (!ruleToRemove) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Rule Not Found')
          .setDescription('The selected rule could not be found.')
          .setFooter({ text: 'It may have already been removed' });

        return await interaction.update({
          embeds: [embed],
          components: []
        });
      }

      await ConfigModel.removeAutomodRule(threshold);

      const actionText = ruleToRemove.action === 'mute' ? `Mute for ${ruleToRemove.duration}` : ruleToRemove.action === 'kick' ? 'Kick' : 'Ban';
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🗑️ Automod Rule Removed')
        .setDescription(`Successfully removed automod rule!\n\n**Removed:** ${threshold} warnings → ${actionText}`)
        .setFooter({ text: 'Changes take effect immediately' })
        .setTimestamp();

      await interaction.update({
        embeds: [embed],
        components: []
      });

      logger.info(`Automod rule removed by ${interaction.user.tag}: ${threshold} warnings → ${actionText}`);

    } catch (error) {
      logger.error('Error removing automod rule:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to remove automod rule. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.update({
        embeds: [errorEmbed],
        components: []
      });
    }
  }
};