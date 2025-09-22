const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'config_automod',
  async execute(interaction) {
    const { components } = await renderConfigSection('automod', interaction);
    await interaction.update({ components });
  },
};
