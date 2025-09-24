const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: /^command_whitelist_manage_(.+)$/,
  async execute(interaction) {
    try {
      const match = interaction.customId.match(/^command_whitelist_manage_(.+)$/);
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

      const whitelistedRoles = commandData.whitelist || [];
      const guild = interaction.guild;
      
      let description = `**Whitelist Management for \`${commandName}\`**\n\n`;
      
      if (whitelistedRoles.length === 0) {
        description += '🔓 **No roles whitelisted** - Command follows general permissions\n\n';
      } else {
        description += `🔒 **Whitelisted Roles (${whitelistedRoles.length}):**\n`;
        for (const roleId of whitelistedRoles) {
          const role = guild.roles.cache.get(roleId);
          description += `• ${role ? role.name : 'Unknown Role'}\n`;
        }
        description += '\n';
      }
      
      description += 'Use the buttons below to manage whitelist access:';

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('✅ Whitelist Management')
        .setDescription(description)
        .setFooter({ text: 'Whitelisted roles bypass other permission checks 🌸' });

      const addButton = new ButtonBuilder()
        .setCustomId(`command_whitelist_add_${commandName}`)
        .setLabel('Add Role')
        .setStyle(ButtonStyle.Success)
        .setEmoji('➕');

      const removeButton = new ButtonBuilder()
        .setCustomId(`command_whitelist_remove_${commandName}`)
        .setLabel('Remove Role')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('➖')
        .setDisabled(whitelistedRoles.length === 0);

      const backButton = new ButtonBuilder()
        .setCustomId(`command_manage_back_${commandName}`)
        .setLabel('← Back to Command')
        .setStyle(ButtonStyle.Secondary);

      const actionRow = new ActionRowBuilder().addComponents(addButton, removeButton, backButton);

      await interaction.update({
        embeds: [embed],
        components: [actionRow]
      });

    } catch (error) {
      console.error('Error in command_whitelist_manage:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load whitelist management! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.update({
        embeds: [embed],
        components: []
      });
    }
  }
};