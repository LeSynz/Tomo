const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'config_commands',
  async execute(interaction) {
    const { components } = await renderConfigSection('commands', interaction);
    await interaction.update({ components });
  },
};
