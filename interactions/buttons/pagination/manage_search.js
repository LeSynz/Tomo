const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  customId: 'manage_search',
  async execute(interaction) {
    try {
      const modal = new ModalBuilder()
        .setCustomId('command_search_modal')
        .setTitle('🔍 Search Commands');

      const searchInput = new TextInputBuilder()
        .setCustomId('search_query')
        .setLabel('Search Query')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter command name or partial match...')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(50);

      const firstActionRow = new ActionRowBuilder().addComponents(searchInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in manage_search:', error);
      await interaction.reply({
        content: '❌ Failed to open search modal! Please try again~',
        ephemeral: true
      });
    }
  }
};