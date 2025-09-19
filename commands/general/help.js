const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help and information about the bot.')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed help for a specific command')
        .setRequired(false)
    ),

  isPublic: true,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'help');
    if (!hasPermission) return;

    const specificCommand = interaction.options.getString('command');
    
    if (specificCommand) {
      await interaction.reply({
        content: `📖 Help for command: \`${specificCommand}\`\n*Detailed help would go here.*`,
        ephemeral: true
      });
    } else {
      const helpEmbed = new EmbedBuilder()
        .setTitle('🌸 Tomu Help')
        .setDescription('Here are the available commands and features:')
        .addFields(
          { name: '📋 Public Commands', value: 'Commands everyone can use', inline: true },
          { name: '🛡️ Staff Commands', value: 'Commands for staff only', inline: true },
          { name: '⚙️ Configuration', value: 'Use `/config` to manage settings', inline: false }
        )
        .setColor(0xFFB6C1);

      await interaction.reply({
        embeds: [helpEmbed],
        ephemeral: true
      });
    }
  },
};