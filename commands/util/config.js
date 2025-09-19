const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const renderConfigSection = require('../../helpers/renderConfigSection');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Opens the configuration panel.'),

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'config');
    if (!hasPermission) return;

    const { components } = await renderConfigSection('general', interaction);

    await interaction.reply({
      components,
      flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
