const { RoleSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'staff_add_role',
  async execute(interaction) {
    const roleSelectMenu = new RoleSelectMenuBuilder()
      .setCustomId('staff_add_role_menu')
      .setPlaceholder('Select roles to add as staff roles')
      .setMinValues(1)
      .setMaxValues(25);    
    await interaction.reply({
      content: 'Select the roles you want to add as staff roles:',
      components: [{ type: 1, components: [roleSelectMenu] }],
      ephemeral: true,
    });
  },
};
