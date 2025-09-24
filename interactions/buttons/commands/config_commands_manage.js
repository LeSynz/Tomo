const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'config_commands_manage',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const commands = Object.entries(config.commands);
      const itemsPerPage = 20;
      const totalPages = Math.ceil(commands.length / itemsPerPage);
      
      if (commands.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📋 Command Management')
          .setDescription('No commands found! Use the **Discover Commands** button first.')
          .setFooter({ text: 'Tomo Configuration 🌸' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const firstPageCommands = commands.slice(0, itemsPerPage);
      const options = firstPageCommands.map(([cmd, data]) => ({
        label: `${cmd}`,
        value: cmd,
        description: `${data.enabled !== false ? '✅' : '❌'} ${data.isPublic ? '🌍' : '🛡️'} Click to manage`,
        emoji: data.enabled !== false ? '✅' : '❌'
      }));

      const commandMenu = new StringSelectMenuBuilder()
        .setCustomId('command_manage_select')
        .setPlaceholder('Select a command to manage its settings')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      const components = [new ActionRowBuilder().addComponents(commandMenu)];

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
            .setDisabled(totalPages === 1),
          new ButtonBuilder()
            .setCustomId('manage_search')
            .setLabel('🔍 Search')
            .setStyle(ButtonStyle.Secondary)
        );
        
        components.push(navigationButtons);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('📋 Command Management')
        .setDescription(`**Page 1 of ${totalPages}** • Showing ${firstPageCommands.length} of ${commands.length} commands\n\n**Legend:**\n✅ Enabled • ❌ Disabled\n🌍 Public • 🛡️ Staff Only`)
        .setFooter({ text: 'Select a command below to manage its settings 🌸' });

      await interaction.reply({
        embeds: [embed],
        components: components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in config_commands_manage:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load command management! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};