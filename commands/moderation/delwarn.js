const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delwarn')
    .setDescription('Delete a specific warning from a user\'s history')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose warning to delete')
        .setRequired(true)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'delwarn');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');

      await interaction.deferReply({ ephemeral: true });

      const userWarnings = await ModerationActionModel.getUserWarnings(targetUser.id, interaction.guild.id);

      if (userWarnings.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('✨ No Warnings Found')
          .setDescription(`**${targetUser.tag}** has no warnings to delete!`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: 'Clean record! �' })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      const sortedWarnings = userWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const warningsToShow = sortedWarnings.slice(0, 25);

      const selectOptions = warningsToShow.map((warning, index) => {
        const date = new Date(warning.timestamp);
        const formattedDate = date.toLocaleDateString();
        const shortReason = warning.reason.length > 50 
          ? warning.reason.substring(0, 47) + '...' 
          : warning.reason;

        return {
          label: `Case ${warning.caseId} - ${formattedDate}`,
          description: shortReason,
          value: warning.caseId
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('delwarn_select')
        .setPlaceholder('Choose a warning to delete...')
        .addOptions(selectOptions);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(`🗑️ Delete Warning for ${targetUser.tag}`)
        .setDescription(`Found **${userWarnings.length}** warning${userWarnings.length === 1 ? '' : 's'}. Select one to delete:`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `User ID: ${targetUser.id}` })
        .setTimestamp();

      if (userWarnings.length > 25) {
        embed.addFields({
          name: '� Note',
          value: `Showing the 25 most recent warnings. User has ${userWarnings.length} total warnings.`,
          inline: false
        });
      }

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('Error in delwarn command:', error);
      
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