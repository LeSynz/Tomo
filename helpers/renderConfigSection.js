const ConfigModel = require('../models/ConfigModel');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
} = require('discord.js');
const logger = require('../utils/logger');

module.exports = async function renderConfigSection(section, interaction) {
  try {
    const configModel = new ConfigModel();
    const config = await configModel.getConfig();

    const staffRolesText = config.staffRoles.length
      ? config.staffRoles.map(r => `<@&${r}>`).join(', ')
      : 'None set';

    const commandsText = Object.keys(config.commands).length
      ? Object.entries(config.commands)
          .map(([cmd, data]) => `\`${cmd}\`: ${data.enabled !== false ? '✅ Enabled' : '❌ Disabled'}`)
          .join('\n')
      : 'No commands configured';

    const logsChannelText = config.logsChannelId
      ? `<#${config.logsChannelId}>`
      : 'Not set';

    const appealsChannelText = config.appealsChannelId
      ? `<#${config.appealsChannelId}>`
      : 'Not set';

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## ⚙️ Configuration Panel')
    );

    switch (section) {
      case 'staff':
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Staff Roles:** ${staffRolesText}`)
        );

        if (interaction?.guild) {
          const addRoleButton = new ButtonBuilder()
            .setCustomId('staff_add_role')
            .setLabel('Add Staff Role')
            .setStyle(ButtonStyle.Secondary);

          const removeRoleButton = new ButtonBuilder()
            .setCustomId('staff_remove_role')
            .setLabel('Remove Staff Role')
            .setStyle(ButtonStyle.Secondary);

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(addRoleButton, removeRoleButton)
          );

          const quickAddRoleMenu = new RoleSelectMenuBuilder()
            .setCustomId('staff_add_role_menu')
            .setPlaceholder('Quick add: Select roles to add as staff')
            .setMinValues(1)
            .setMaxValues(10);

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(quickAddRoleMenu)
          );

          const staffRoles = config.staffRoles;
          if (staffRoles.length > 0) {
            const removeOptions = staffRoles
              .map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? { label: role.name, value: role.id } : null;
              })
              .filter(Boolean);

            if (removeOptions.length > 0) {
              const quickRemoveRoleMenu = new StringSelectMenuBuilder()
                .setCustomId('staff_remove_role_menu')
                .setPlaceholder('Quick remove: Select roles to remove')
                .setMinValues(1)
                .setMaxValues(Math.min(removeOptions.length, 25))
                .addOptions(removeOptions);

              container.addActionRowComponents(
                new ActionRowBuilder().addComponents(quickRemoveRoleMenu)
              );
            }
          }
        }
        break;

      case 'commands':
        if (Object.keys(config.commands).length > 0) {
          const commandsDetailText = Object.entries(config.commands)
            .map(([cmd, data]) => {
              const status = data.enabled !== false ? '✅ Enabled' : '❌ Disabled';
              const accessType = data.isPublic ? '🌍 Public' : '👑 Staff';
              const whitelist = data.whitelist?.length > 0 
                ? `\n  📝 Whitelist: ${data.whitelist.map(r => `<@&${r}>`).join(', ')}`
                : '';
              const blacklist = data.blacklist?.length > 0 
                ? `\n  🚫 Blacklist: ${data.blacklist.map(r => `<@&${r}>`).join(', ')}`
                : '';
              return `\`${cmd}\`: ${status} | ${accessType}${whitelist}${blacklist}`;
            })
            .join('\n\n');

          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Command Settings:**\n${commandsDetailText}`)
          );

          const commandOptions = Object.entries(config.commands).map(([cmd, data]) => ({
            label: `${cmd} (${data.enabled !== false ? 'Enabled' : 'Disabled'} | ${data.isPublic ? 'Public' : 'Staff'})`,
            value: cmd,
            description: `Manage ${cmd} permissions`,
          }));

          const commandMenu = new StringSelectMenuBuilder()
            .setCustomId('command_manage_menu')
            .setPlaceholder('Select a command to manage')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(commandOptions);

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(commandMenu)
          );

          const quickToggleMenu = new StringSelectMenuBuilder()
            .setCustomId('command_toggle_menu')
            .setPlaceholder('Quick toggle: Select commands to enable/disable')
            .setMinValues(1)
            .setMaxValues(Math.min(commandOptions.length, 25))
            .addOptions(commandOptions.map(opt => ({
              ...opt,
              description: `Toggle ${opt.value} on/off`
            })));

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(quickToggleMenu)
          );

          const refreshButton = new ButtonBuilder()
            .setCustomId('config_refresh_commands')
            .setLabel('🔄 Refresh Commands')
            .setStyle(ButtonStyle.Secondary);

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(refreshButton)
          );
        } else {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**Command Settings:**\nNo commands configured')
          );

          const discoverButton = new ButtonBuilder()
            .setCustomId('config_discover_commands')
            .setLabel('🔍 Discover Commands')
            .setStyle(ButtonStyle.Primary);

          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(discoverButton)
          );
        }
        break;

      case 'logs':
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Logs Channel:** ${logsChannelText}`),
          new TextDisplayBuilder().setContent(`**Appeals Channel:** ${appealsChannelText}`)
        );

        const setLogsChannelButton = new ButtonBuilder()
          .setCustomId('set_logs_channel')
          .setLabel('Set Logs Channel')
          .setStyle(ButtonStyle.Secondary);

        const setAppealsChannelButton = new ButtonBuilder()
          .setCustomId('set_appeals_channel')
          .setLabel('Set Appeals Channel')
          .setStyle(ButtonStyle.Secondary);

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(setLogsChannelButton, setAppealsChannelButton)
        );
        break;

      case 'general':
      default:
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Staff Roles:** ${staffRolesText}`),
          new TextDisplayBuilder().setContent(`**Commands Configured:** ${Object.keys(config.commands).length}`),
          new TextDisplayBuilder().setContent(`**Logs Channel:** ${logsChannelText}`),
          new TextDisplayBuilder().setContent(`**Appeals Channel:** ${appealsChannelText}`)
        );
        break;
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const components = [container];

    const buttons = [
      { id: 'config_general', label: 'General' },
      { id: 'config_staff', label: 'Staff Roles' },
      { id: 'config_commands', label: 'Commands' },
      { id: 'config_logs', label: 'Logs' },
    ];

    const buttonRow = new ActionRowBuilder().addComponents(
      buttons.map(btn =>
        new ButtonBuilder()
          .setCustomId(btn.id)
          .setLabel(btn.label)
          .setStyle(btn.id === `config_${section}` ? ButtonStyle.Primary : ButtonStyle.Secondary)
      )
    );

    components.push(buttonRow);

    return { components };

  } catch (error) {
    logger.error('Error rendering config section:', error);
    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## ⚙️ Configuration Panel'),
      new TextDisplayBuilder().setContent('❌ Error loading configuration. Please try again.')
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_general')
        .setLabel('Retry')
        .setStyle(ButtonStyle.Primary)
    );

    return { components: [container, buttonRow] };
  }
};
