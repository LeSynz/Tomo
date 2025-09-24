const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'config_commands_back_to_list',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const commands = Object.entries(config.commands);
      const itemsPerPage = 20;
      
      if (commands.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🛠️ Manage Commands')
          .setDescription('No commands found! Use the **Discover Commands** button first.')
          .setFooter({ text: 'Tomo Configuration 🌸' });

        return await interaction.update({
          embeds: [embed],
          components: []
        });
      }

      const firstPageCommands = commands.slice(0, itemsPerPage);
      const options = firstPageCommands.map(([cmd, data]) => ({
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

      const totalPages = Math.ceil(commands.length / itemsPerPage);
      if (totalPages > 1) {
        const navigationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('manage_page_prev')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('manage_page_next')
            .setLabel('▶️ Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(totalPages === 1)
        );
        
        components.push(navigationButtons);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🛠️ Manage Commands')
        .setDescription(`**Page 1 of ${totalPages}** • Select a command below to manage its settings\n\n**Legend:**\n🟢 Enabled • 🔴 Disabled\n✅ Working • ❌ Issues`)
        .setFooter({ text: 'Select a command to view detailed management options 🌸' });

      await interaction.update({
        embeds: [embed],
        components: components
      });

    } catch (error) {
      console.error('Error in config_commands_back_to_list:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load command list! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.update({
        embeds: [embed],
        components: []
      });
    }
  }
};