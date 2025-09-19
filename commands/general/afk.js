const { SlashCommandBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status to let others know you\'re away.')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for being AFK (optional)')
        .setRequired(false)
    ),

  isPublic: true,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'afk');
    if (!hasPermission) return;

    const reason = interaction.options.getString('reason') || 'AFK';
    
    await interaction.reply({
      content: `🌙 You are now AFK: **${reason}**\nI'll let others know when they mention you! (just for testing, not implemented)`,
      ephemeral: true
    });
  },
};