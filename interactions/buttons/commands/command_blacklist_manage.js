const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: /^command_blacklist_manage_(.+)$/,
  async execute(interaction) {
    try {
      const match = interaction.customId.match(/^command_blacklist_manage_(.+)$/);
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

      const blacklistedRoles = commandData.blacklist || [];
      const guild = interaction.guild;
      
      let description = `**Blacklist Management for \`${commandName}\`**\n\n`;
      
      if (blacklistedRoles.length === 0) {
        description += '🟢 **No roles blacklisted** - All roles can use this command\n\n';
      } else {
        description += `🚫 **Blacklisted Roles (${blacklistedRoles.length}):**\n`;
        for (const roleId of blacklistedRoles) {
          const role = guild.roles.cache.get(roleId);
          description += `• ${role ? role.name : 'Unknown Role'}\n`;
        }
        description += '\n';
      }
      
      description += 'Use the buttons below to manage blacklist restrictions:';

      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Blacklist Management')
        .setDescription(description)
        .setFooter({ text: 'Blacklisted roles cannot use this command 🌸' });

      const addButton = new ButtonBuilder()
        .setCustomId(`command_blacklist_add_${commandName}`)
        .setLabel('Add Role')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚫');

      const removeButton = new ButtonBuilder()
        .setCustomId(`command_blacklist_remove_${commandName}`)
        .setLabel('Remove Role')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
        .setDisabled(blacklistedRoles.length === 0);

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
      console.error('Error in command_blacklist_manage:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to load blacklist management! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.update({
        embeds: [embed],
        components: []
      });
    }
  }
};