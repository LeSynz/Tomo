const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'config_logs',
  async execute(interaction) {
    const { components } = await renderConfigSection('logs', interaction);
    await interaction.update({ components });
  },
};
