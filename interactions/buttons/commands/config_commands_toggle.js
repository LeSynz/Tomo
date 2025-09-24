const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'config_commands_toggle',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      
      const commands = Object.entries(config.commands);
      const itemsPerPage = 20;
      
      if (commands.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🎛️ Quick Toggle')
          .setDescription('No commands found! Use the **Discover Commands** button first.')
          .setFooter({ text: 'Tomo Configuration 🌸' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const firstPageCommands = commands.slice(0, itemsPerPage);
      const options = firstPageCommands.map(([cmd, data]) => ({
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

      const totalPages = Math.ceil(commands.length / itemsPerPage);
      if (totalPages > 1) {
        const navigationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_page_prev')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('toggle_page_next')
            .setLabel('▶️ Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(totalPages === 1)
        );
        
        components.push(navigationButtons);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🎛️ Quick Toggle Commands')
        .setDescription(`**Page 1 of ${totalPages}** • Select multiple commands to toggle them on/off\n\n**Legend:**\n🟢 Will turn ON • 🔴 Will turn OFF`)
        .setFooter({ text: 'Select commands below to toggle their status 🌸' });

      await interaction.reply({
        embeds: [embed],
        components: components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in config_commands_toggle:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load command toggle! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};