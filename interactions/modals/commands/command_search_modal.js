const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'command_search_modal',
  async execute(interaction) {
    try {
      const searchQuery = interaction.fields.getTextInputValue('search_query').toLowerCase().trim();
      
      const config = await ConfigModel.getConfig();
      
      const commands = Object.entries(config.commands);
      
      const filteredCommands = commands.filter(([commandName, data]) => {
        return commandName.toLowerCase().includes(searchQuery);
      });

      if (filteredCommands.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔍 Search Results')
          .setDescription(`No commands found matching **"${searchQuery}"**\n\n💡 Try a different search term or use the full command list.`)
          .setFooter({ text: 'Search completed 🌸' });

        const backButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('config_commands_manage')
            .setLabel('◀️ Back to Command List')
            .setStyle(ButtonStyle.Secondary)
        );

        return await interaction.update({
          embeds: [embed],
          components: [backButton]
        });
      }

      
      const limitedResults = filteredCommands.slice(0, 25);
      const hasMoreResults = filteredCommands.length > 25;

      const options = limitedResults.map(([cmd, data]) => ({
        label: `${cmd}`,
        value: cmd,
        description: `${data.enabled !== false ? '✅' : '❌'} ${data.isPublic ? '🌍' : '🛡️'} Click to manage`,
        emoji: data.enabled !== false ? '✅' : '❌'
      }));

      const commandMenu = new StringSelectMenuBuilder()
        .setCustomId('command_manage_select')
        .setPlaceholder('Select a command from search results')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      const components = [new ActionRowBuilder().addComponents(commandMenu)];

      const navigationButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_commands_back_to_list')
          .setLabel('◀️ Back to Full List')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('manage_search')
          .setLabel('🔍 New Search')
          .setStyle(ButtonStyle.Secondary)
      );
      
      components.push(navigationButtons);

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle(`🔍 Search Results: "${searchQuery}"`)
        .setDescription([
          `Found **${filteredCommands.length}** command${filteredCommands.length === 1 ? '' : 's'}`,
          hasMoreResults ? `Showing first **25** results` : '',
          '',
          '**Legend:**',
          '✅ Enabled • ❌ Disabled',
          '🌍 Public • 🛡️ Staff Only'
        ].filter(Boolean).join('\n'))
        .setFooter({ 
          text: hasMoreResults ? 
            'Tip: Use more specific search terms to narrow results 🌸' : 
            'Select a command below to manage its settings 🌸' 
        });

      await interaction.update({
        embeds: [embed],
        components: components
      });

    } catch (error) {
      console.error('Error in command_search_modal:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Search Error')
        .setDescription('Failed to search commands! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_commands_manage')
          .setLabel('◀️ Back to Command List')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({
        embeds: [embed],
        components: [backButton]
      });
    }
  }
};