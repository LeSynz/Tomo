const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'command_manage_select',
  async execute(interaction) {
    try {
      const config = await ConfigModel.getConfig();
      const commandName = interaction.values[0];
      const commandData = config.commands[commandName];
      
      if (!commandData) {
        return await interaction.reply({
          content: `Command \`${commandName}\` not found! Use **Refresh Commands** to rescan.`,
          ephemeral: true
        });
      }

      const statusInfo = commandData.enabled !== false ? 
        { text: 'Enabled', emoji: '🟢', color: 0x98FB98 } : 
        { text: 'Disabled', emoji: '🔴', color: 0xFFB6C1 };

      const visibilityInfo = commandData.public ? 
        { text: 'Public', emoji: '🌍' } : 
        { text: 'Private', emoji: '🔒' };

      let description = `**Status:** ${statusInfo.emoji} ${statusInfo.text}\n`;
      description += `**Visibility:** ${visibilityInfo.emoji} ${visibilityInfo.text}\n\n`;
      
      if (commandData.description) {
        description += `**Description:** ${commandData.description}\n\n`;
      }
      
      if (commandData.whitelist && commandData.whitelist.length > 0) {
        description += `**Whitelisted Roles:** ${commandData.whitelist.length} role(s)\n`;
      }
      
      if (commandData.blacklist && commandData.blacklist.length > 0) {
        description += `**Blacklisted Roles:** ${commandData.blacklist.length} role(s)\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(statusInfo.color)
        .setTitle(`🛠️ Managing: \`${commandName}\``)
        .setDescription(description)
        .setFooter({ text: 'Use the buttons below to modify this command 🌸' });

      const toggleButton = new ButtonBuilder()
        .setCustomId(`command_toggle_single_${commandName}`)
        .setLabel(commandData.enabled !== false ? 'Disable' : 'Enable')
        .setStyle(commandData.enabled !== false ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji(commandData.enabled !== false ? '🔴' : '🟢');

      const publicButton = new ButtonBuilder()
        .setCustomId(`command_toggle_public_${commandName}`)
        .setLabel(commandData.public ? 'Make Private' : 'Make Public')
        .setStyle(commandData.public ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setEmoji(commandData.public ? '🔒' : '🌍');

      const whitelistButton = new ButtonBuilder()
        .setCustomId(`command_whitelist_manage_${commandName}`)
        .setLabel('Whitelist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✅');

      const blacklistButton = new ButtonBuilder()
        .setCustomId(`command_blacklist_manage_${commandName}`)
        .setLabel('Blacklist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌');

      const backButton = new ButtonBuilder()
        .setCustomId('config_commands_back_to_list')
        .setLabel('← Back to List')
        .setStyle(ButtonStyle.Secondary);

      const actionRow1 = new ActionRowBuilder().addComponents(toggleButton, publicButton);
      const actionRow2 = new ActionRowBuilder().addComponents(whitelistButton, blacklistButton, backButton);

      await interaction.update({
        embeds: [embed],
        components: [actionRow1, actionRow2]
      });

    } catch (error) {
      console.error('Error in command_manage_select:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load command details! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.update({
        embeds: [embed],
        components: []
      });
    }
  }
};