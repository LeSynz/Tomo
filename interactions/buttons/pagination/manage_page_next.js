const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'manage_page_next',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const commands = Object.entries(config.commands);
      const itemsPerPage = 20;
      const totalPages = Math.ceil(commands.length / itemsPerPage);
      
      const currentEmbed = interaction.message.embeds[0];
      const currentPageMatch = currentEmbed.description.match(/Page (\d+) of/);
      const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) : 1;
      const newPage = Math.min(totalPages, currentPage + 1);
      
      const startIndex = (newPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageCommands = commands.slice(startIndex, endIndex);
      
      const options = pageCommands.map(([cmd, data]) => ({
        label: cmd,
        value: cmd,
        description: `${data.enabled !== false ? '✅' : '❌'} ${data.public ? 'Public' : 'Private'} • Click to manage`,
        emoji: data.enabled !== false ? '🟢' : '🔴'
      }));

      const commandMenu = new StringSelectMenuBuilder()
        .setCustomId('command_manage_select')
        .setPlaceholder('Select a command to manage')
        .addOptions(options);

      const components = [new ActionRowBuilder().addComponents(commandMenu)];

      if (totalPages > 1) {
        const navigationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('manage_page_prev')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === 1),
          new ButtonBuilder()
            .setCustomId('manage_page_next')
            .setLabel('▶️ Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === totalPages)
        );
        
        components.push(navigationButtons);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🛠️ Manage Commands')
        .setDescription(`**Page ${newPage} of ${totalPages}** • Select a command below to manage its settings\n\n**Legend:**\n🟢 Enabled • 🔴 Disabled\n✅ Working • ❌ Issues`)
        .setFooter({ text: 'Select a command to view detailed management options 🌸' });

      await interaction.update({
        embeds: [embed],
        components: components
      });

    } catch (error) {
      console.error('Error in manage_page_next:', error);
      await interaction.reply({
        content: 'Failed to load next page! Please try again~',
        ephemeral: true
      });
    }
  }
};