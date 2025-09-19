const { 
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  RoleSelectMenuBuilder 
} = require('discord.js');
const ConfigModel = require('../../models/ConfigModel');
const logger = require('../../utils/logger');

module.exports = {
  customId: 'command_manage_menu',
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return await interaction.reply({ 
          content: 'This command can only be used in a server!', 
          ephemeral: true 
        });
      }

      if (!interaction.values || interaction.values.length === 0) {
        return await interaction.reply({ 
          content: 'No command was selected!', 
          ephemeral: true 
        });
      }

      const commandName = interaction.values[0];
      const configModel = new ConfigModel();
      const config = await configModel.getConfig();
      const command = config.commands[commandName];

      if (!command) {
        return await interaction.reply({ 
          content: `Command "${commandName}" not found!`, 
          ephemeral: true 
        });
      }

      // Build detailed management interface using v2 components
      const enabledStatus = command.enabled !== false ? '✅ Enabled' : '❌ Disabled';
      const accessType = command.isPublic ? '🌍 Public (Everyone)' : '👑 Staff Only';
      const whitelistText = command.whitelist?.length > 0 
        ? command.whitelist.map(r => `<@&${r}>`).join(', ')
        : 'None';
      const blacklistText = command.blacklist?.length > 0 
        ? command.blacklist.map(r => `<@&${r}>`).join(', ')
        : 'None';

      // Create container with text displays
      const container = new ContainerBuilder();
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 🎛️ Managing Command: \`${commandName}\``),
        new TextDisplayBuilder().setContent(`**Status:** ${enabledStatus}`),
        new TextDisplayBuilder().setContent(`**Access Type:** ${accessType}`),
        new TextDisplayBuilder().setContent(`**Whitelist:** ${whitelistText}`),
        new TextDisplayBuilder().setContent(`**Blacklist:** ${blacklistText}`),
        new TextDisplayBuilder().setContent(`*🌍 Public: usable by everyone | 👑 Staff: requires staff roles*\n*Whitelist overrides access type. Blacklist blocks all access.*`)
      );

      // Toggle buttons
      const toggleButton = new ButtonBuilder()
        .setCustomId(`command_toggle_single_${commandName}`)
        .setLabel(command.enabled !== false ? 'Disable' : 'Enable')
        .setStyle(command.enabled !== false ? ButtonStyle.Danger : ButtonStyle.Success);

      const publicButton = new ButtonBuilder()
        .setCustomId(`command_toggle_public_${commandName}`)
        .setLabel(command.isPublic ? 'Make Staff Only' : 'Make Public')
        .setStyle(command.isPublic ? ButtonStyle.Secondary : ButtonStyle.Success);

      // Whitelist management
      const addWhitelistButton = new ButtonBuilder()
        .setCustomId(`command_whitelist_add_${commandName}`)
        .setLabel('Add to Whitelist')
        .setStyle(ButtonStyle.Secondary);

      const removeWhitelistButton = new ButtonBuilder()
        .setCustomId(`command_whitelist_remove_${commandName}`)
        .setLabel('Remove from Whitelist')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(command.whitelist?.length === 0);

      // Blacklist management
      const addBlacklistButton = new ButtonBuilder()
        .setCustomId(`command_blacklist_add_${commandName}`)
        .setLabel('Add to Blacklist')
        .setStyle(ButtonStyle.Secondary);

      const removeBlacklistButton = new ButtonBuilder()
        .setCustomId(`command_blacklist_remove_${commandName}`)
        .setLabel('Remove from Blacklist')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(command.blacklist?.length === 0);

      // Back button
      const backButton = new ButtonBuilder()
        .setCustomId('config_commands')
        .setLabel('Back to Commands')
        .setStyle(ButtonStyle.Primary);

      // Add action rows to container
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(toggleButton, publicButton, backButton),
        new ActionRowBuilder().addComponents(addWhitelistButton, removeWhitelistButton),
        new ActionRowBuilder().addComponents(addBlacklistButton, removeBlacklistButton)
      );

      // Add separator
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

      await interaction.update({
        components: [container]
      });

      logger.info(`User ${interaction.user.tag} opened management for command: ${commandName}`);

    } catch (error) {
      logger.error('Error in command_manage_menu:', error);
      
      // Fallback minimal interface using V2 components
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ❌ Error'),
        new TextDisplayBuilder().setContent('An error occurred while loading command management. Please try again.')
      );

      const retryButton = new ButtonBuilder()
        .setCustomId('config_commands')
        .setLabel('Back to Commands')
        .setStyle(ButtonStyle.Primary);

      errorContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(retryButton)
      );
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          components: [errorContainer], 
          ephemeral: true 
        });
      } else {
        await interaction.update({ 
          components: [errorContainer]
        });
      }
    }
  },
};