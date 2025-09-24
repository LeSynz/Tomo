const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'manage_automod_rules',
  
  async execute(interaction) {
    try {
      const rules = await ConfigModel.getAutomodRules();

      if (rules.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📋 No Rules Found')
          .setDescription('You haven\'t configured any automod rules yet.\n\nUse the "Add Rule" button to create your first automatic punishment rule!')
          .setFooter({ text: 'Rules help maintain order automatically' });

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }

      const ruleOptions = rules.map(rule => {
        const actionText = rule.action === 'mute' ? `Mute for ${rule.duration}` : rule.action === 'kick' ? 'Kick' : 'Ban';
        return {
          label: `${rule.threshold} warnings → ${actionText}`,
          value: `remove_${rule.threshold}`,
          description: `Remove this automod rule`
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('remove_automod_rule_menu')
        .setPlaceholder('🗑️ Select a rule to remove')
        .addOptions(ruleOptions);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('⚙️ Manage Automod Rules')
        .setDescription(`**Current Rules (${rules.length}):**\n\n${rules.map(rule => {
          const actionText = rule.action === 'mute' ? `Mute for ${rule.duration}` : rule.action === 'kick' ? 'Kick' : 'Ban';
          return `• **${rule.threshold} warnings** → ${actionText}`;
        }).join('\n')}\n\n*Select a rule below to remove it*`)
        .setFooter({ text: 'Rules are applied in order from lowest to highest threshold' });

      await interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      logger.error('Error showing automod rules management:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to load automod rules. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};