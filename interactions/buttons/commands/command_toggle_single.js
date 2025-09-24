const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: /^command_toggle_single_(.+)$/,
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      const match = interaction.customId.match(/^command_toggle_single_(.+)$/);
      if (!match) {
        return await interaction.reply({ 
          content: 'Invalid command identifier!', 
          ephemeral: true 
        });
      }

      const commandName = match[1];
      const config = await ConfigModel.getConfig();
      const commandData = config.commands[commandName];

      if (!commandData) {
        return await interaction.reply({ 
          content: `Command "${commandName}" not found!`, 
          ephemeral: true 
        });
      }

      const currentState = commandData.enabled !== false;
      const newState = !currentState;
      
      await ConfigModel.setCommandEnabled(commandName, newState);
      
      const updatedConfig = await ConfigModel.getConfig();
      const updatedCommandData = updatedConfig.commands[commandName];

      logger.info(`Command ${commandName} toggled to ${newState ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);

      const statusInfo = updatedCommandData.enabled !== false ? 
        { text: 'Enabled', emoji: '🟢', color: 0x98FB98 } : 
        { text: 'Disabled', emoji: '🔴', color: 0xFFB6C1 };

      const visibilityInfo = updatedCommandData.public ? 
        { text: 'Public', emoji: '🌍' } : 
        { text: 'Private', emoji: '🔒' };

      let description = `**Status:** ${statusInfo.emoji} ${statusInfo.text}\n`;
      description += `**Visibility:** ${visibilityInfo.emoji} ${visibilityInfo.text}\n\n`;
      
      if (updatedCommandData.description) {
        description += `**Description:** ${updatedCommandData.description}\n\n`;
      }
      
      if (updatedCommandData.whitelist && updatedCommandData.whitelist.length > 0) {
        description += `**Whitelisted Roles:** ${updatedCommandData.whitelist.length} role(s)\n`;
      }
      
      if (updatedCommandData.blacklist && updatedCommandData.blacklist.length > 0) {
        description += `**Blacklisted Roles:** ${updatedCommandData.blacklist.length} role(s)\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(statusInfo.color)
        .setTitle(`🛠️ Managing: \`${commandName}\``)
        .setDescription(description)
        .setFooter({ text: 'Use the buttons below to modify this command 🌸' });

      const toggleButton = new ButtonBuilder()
        .setCustomId(`command_toggle_single_${commandName}`)
        .setLabel(updatedCommandData.enabled !== false ? 'Disable' : 'Enable')
        .setStyle(updatedCommandData.enabled !== false ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji(updatedCommandData.enabled !== false ? '🔴' : '🟢');

      const publicButton = new ButtonBuilder()
        .setCustomId(`command_toggle_public_${commandName}`)
        .setLabel(updatedCommandData.public ? 'Make Private' : 'Make Public')
        .setStyle(updatedCommandData.public ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setEmoji(updatedCommandData.public ? '🔒' : '🌍');

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
      logger.error('Error in command_toggle_single:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to toggle command! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.update({
        embeds: [embed],
        components: []
      });
    }
  },
};