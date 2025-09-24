const { EmbedBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'toggle_automod_system',
  
  async execute(interaction) {
    try {
      const currentState = await ConfigModel.isAutomodEnabled();
      const newState = !currentState;
      
      await ConfigModel.setAutomodEnabled(newState);

      const embed = new EmbedBuilder()
        .setColor(newState ? 0x00FF00 : 0xFF6B6B)
        .setTitle(`🤖 Automod System ${newState ? 'Enabled' : 'Disabled'}`)
        .setDescription(
          newState 
            ? 'Automatic moderation is now **enabled**! Users will be automatically punished when they reach warning thresholds.'
            : 'Automatic moderation is now **disabled**. Warning thresholds will not trigger automatic punishments.'
        )
        .setFooter({ 
          text: newState ? 'Configure rules to set up automatic punishments' : 'You can re-enable this anytime'
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Automod system ${newState ? 'enabled' : 'disabled'} by ${interaction.user.tag} in ${interaction.guild.name}`);

    } catch (error) {
      logger.error('Error toggling automod system:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to toggle automod system. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};