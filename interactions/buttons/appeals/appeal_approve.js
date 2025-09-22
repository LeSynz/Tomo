const { EmbedBuilder } = require('discord.js');
const ModerationActionModel = require('../../../models/ModerationActionModel');
const AppealModel = require('../../../models/AppealModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^appeal_approve_\d+_\d+$/,
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

      const guild = interaction.guild;
      
      try {
        await guild.members.unban(userId, `Appeal approved by ${interaction.user.tag}`);
      } catch (unbanError) {
        if (unbanError.code === 10026) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('ℹ️ User Not Banned')
            .setDescription('This user is not currently banned.')
            .setFooter({ text: 'Appeal processed anyway' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        } else {
          throw unbanError;
        }
      }

      await ModerationActionModel.logAction({
        type: 'unban',
        userId: userId,
        moderatorId: interaction.user.id,
        reason: `Appeal approved for case ${caseId}`
      });

      await AppealModel.updateAppealStatus(caseId, userId, 'approved', interaction.user.id);

      try {
        const user = await interaction.client.users.fetch(userId);
        const dmEmbed = new EmbedBuilder()
          .setColor(0x90EE90) // Light green
          .setTitle('✅ Appeal Approved!')
          .setDescription(`Your ban appeal for case \`${caseId}\` has been approved!`)
          .addFields(
            {
              name: '🎉 Welcome Back!',
              value: `You have been unbanned from **${guild.name}**. Please remember to follow the server rules.`,
              inline: false
            }
          )
          .setFooter({ text: 'Thank you for your patience! 💖' })
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user about appeal approval:`, dmError.message);
      }

      const approvedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0x90EE90)
        .setTitle('✅ Ban Appeal - APPROVED')
        .addFields({
          name: '👮 Approved By',
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: false
        });

      await interaction.update({
        embeds: [approvedEmbed],
        components: []
      });

      logger.info(`Appeal approved by ${interaction.user.tag} for case ${caseId}, user ${userId}`);

    } catch (error) {
      logger.error('Error approving appeal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('An error occurred while approving the appeal. Please try again.')
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