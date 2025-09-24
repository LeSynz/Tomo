const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'toggle_page_next',
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
        label: `${cmd} (${data.enabled !== false ? 'Enabled' : 'Disabled'})`,
        value: cmd,
        description: `Toggle ${cmd} ${data.enabled !== false ? 'OFF' : 'ON'}`,
        emoji: data.enabled !== false ? '🔴' : '🟢'
      }));

      const toggleMenu = new StringSelectMenuBuilder()
        .setCustomId('command_toggle_select')
        .setPlaceholder('Select commands to toggle on/off')
        .setMinValues(1)
        .setMaxValues(Math.min(options.length, 10))
        .addOptions(options);

      const components = [new ActionRowBuilder().addComponents(toggleMenu)];

      if (totalPages > 1) {
        const navigationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_page_prev')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === 1),
          new ButtonBuilder()
            .setCustomId('toggle_page_next')
            .setLabel('▶️ Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPage === totalPages)
        );
        
        components.push(navigationButtons);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🎛️ Quick Toggle Commands')
        .setDescription(`**Page ${newPage} of ${totalPages}** • Select multiple commands to toggle them on/off\n\n**Legend:**\n🟢 Will turn ON • 🔴 Will turn OFF`)
        .setFooter({ text: 'Select commands below to toggle their status 🌸' });

      await interaction.update({
        embeds: [embed],
        components: components
      });

    } catch (error) {
      console.error('Error in toggle_page_next:', error);
      await interaction.reply({
        content: 'Failed to load next page! Please try again~',
        ephemeral: true
      });
    }
  }
};