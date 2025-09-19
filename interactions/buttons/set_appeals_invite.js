const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'set_appeals_invite',
  async execute(interaction) {
    try {
      const modal = new ModalBuilder()
        .setCustomId('appeal_invite_modal')
        .setTitle('⚖️ Set Appeal Server Invite');

      const inviteInput = new TextInputBuilder()
        .setCustomId('appeal_invite_input')
        .setLabel('Discord Server Invite Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://discord.gg/example or discord.gg/example')
        .setRequired(true)
        .setMaxLength(100);

      const instructionsInput = new TextInputBuilder()
        .setCustomId('appeal_instructions_input')
        .setLabel('Appeal Instructions (Optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Additional instructions for users on how to appeal...')
        .setRequired(false)
        .setMaxLength(500);

      const actionRow1 = new ActionRowBuilder().addComponents(inviteInput);
      const actionRow2 = new ActionRowBuilder().addComponents(instructionsInput);

      modal.addComponents(actionRow1, actionRow2);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in set_appeals_invite:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to open appeal invite setup! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};