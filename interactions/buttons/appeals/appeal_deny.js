const { EmbedBuilder } = require('discord.js');
const AppealModel = require('../../../models/AppealModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^appeal_deny_\d+_\d+$/,
  async execute(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const caseId = parts[2];
      const userId = parts[3];

      const appeal = await AppealModel.getAppeal(caseId, userId);
      if (!appeal || appeal.status !== 'pending') {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Appeal Not Found')
          .setDescription('This appeal has already been processed or does not exist.')
          .setFooter({ text: 'Appeal may have been handled by another staff member' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await AppealModel.updateAppealStatus(caseId, userId, 'denied', interaction.user.id);

      try {
        const user = await interaction.client.users.fetch(userId);
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Appeal Denied')
          .setDescription(`Your ban appeal for case \`${caseId}\` has been denied.`)
          .addFields(
            {
              name: '💭 What this means',
              value: 'Your ban will remain in effect. You may be able to appeal again in the future.',
              inline: false
            },
            {
              name: '📞 Need to contact staff?',
              value: 'If you have questions about this decision, you can reach out to server staff through other means.',
              inline: false
            }
          )
          .setFooter({ text: 'Decision is final for now 💔' })
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user about appeal denial:`, dmError.message);
      }

      const deniedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0xFF6B6B) // Light red
        .setTitle('❌ Ban Appeal - DENIED')
        .addFields({
          name: '👮 Denied By',
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: false
        });

      await interaction.update({
        embeds: [deniedEmbed],
        components: []
      });

      logger.info(`Appeal denied by ${interaction.user.tag} for case ${caseId}, user ${userId}`);

      const confirmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('✅ Appeal Denied')
        .setDescription(`Appeal for case \`${caseId}\` has been denied.`)
        .setFooter({ text: 'User has been notified 💖' });

      await interaction.followUp({
        embeds: [confirmEmbed],
        ephemeral: true
      });

    } catch (error) {
      logger.error('Error denying appeal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('An error occurred while denying the appeal. Please try again.')
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