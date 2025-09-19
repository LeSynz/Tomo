const { SlashCommandBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('An example command with permission checking.'),
    isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'example');
    if (!hasPermission) return;

    await interaction.reply({
      content: 'Example command executed successfully! You have permission to use this command.',
      ephemeral: true
    });
  },
};