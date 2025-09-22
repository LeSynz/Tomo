const renderConfigSection = require('../../../helpers/renderConfigSection');

module.exports = {
  customId: 'config_staff',
  async execute(interaction) {
    const { components } = await renderConfigSection('staff', interaction);
    await interaction.update({ components });
  },
};
