const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'config_general',
  async execute(interaction) {
    const { components } = await renderConfigSection('general', interaction);
    await interaction.update({ components });
  },
};
