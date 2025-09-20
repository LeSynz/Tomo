const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view warnings for')
        .setRequired(true)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'warnings');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');

      await interaction.deferReply({ ephemeral: true });

      const userWarnings = await ModerationActionModel.getUserWarnings(targetUser.id, interaction.guild.id);

      if (userWarnings.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('✨ Clean Record!')
          .setDescription(`**${targetUser.tag}** has no warnings on record!`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: 'Good behavior! 💖' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      const sortedWarnings = userWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
        .setDescription(`Found **${userWarnings.length}** warning${userWarnings.length === 1 ? '' : 's'}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `User ID: ${targetUser.id}` })
        .setTimestamp();

      const warningsToShow = sortedWarnings.slice(0, 10);
      
      warningsToShow.forEach((warning, index) => {
        const date = new Date(warning.timestamp);
        const relativeTime = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
        
        embed.addFields({
          name: `${index + 1}. Case ${warning.caseId}`,
          value: `**Reason:** ${warning.reason}\n**Date:** ${relativeTime}\n**Moderator:** <@${warning.moderatorId}>`,
          inline: false
        });
      });

      if (userWarnings.length > 10) {
        embed.addFields({
          name: '📋 Additional Warnings',
          value: `... and ${userWarnings.length - 10} more warning${userWarnings.length - 10 === 1 ? '' : 's'}`,
          inline: false
        });
      }

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in warnings command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('An error occurred while retrieving warnings! Please try again~')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};