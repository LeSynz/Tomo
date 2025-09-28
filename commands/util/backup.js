const { SlashCommandBuilder, AttachmentBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const Backup = require('../../models/BackupModel');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(seconds) {
    seconds = Math.max(0, Math.round(seconds * 100) / 100);
    if (seconds < 1) return `${seconds.toFixed(2)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = +(seconds % 60).toFixed(2);
    let out = [];
    if (h) out.push(`${h}h`);
    if (m) out.push(`${m}m`);
    if (s || (!h && !m)) out.push(`${s < 10 && (h || m) ? '0' : ''}${s}s`);
    return out.join(' ');
}

const PINK = 0xFFB6C1; // sexy ahh pink

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Creates a backup of the current server state.')
        .addSubcommand(sub =>
            sub.setName('create').setDescription('Create a new backup')
        )
        .addSubcommand(sub =>
            sub.setName('view').setDescription('View all backups')
        )
        .addSubcommand(sub =>
            sub.setName('restore-channels').setDescription('Restore channels from a backup')
                .addStringOption(opt =>
                    opt.setName('backup_id')
                        .setDescription('The backup ID to restore from')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('restore-roles').setDescription('Restore roles from a backup')
                .addStringOption(opt =>
                    opt.setName('backup_id')
                        .setDescription('The backup ID to restore from')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('restore-all').setDescription('Restore roles and channels from a backup')
                .addStringOption(opt =>
                    opt.setName('backup_id')
                        .setDescription('The backup ID to restore from')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    isPublic: false,

    async execute(interaction) {
        const hasPermission = await permissionChecker.requirePermission(interaction, 'backup');
        if (!hasPermission) return;

        if (interaction.options.getSubcommand() === 'create') {
            const roles = interaction.guild.roles.cache
                .filter(role =>
                    role.id !== interaction.guild.id && !role.managed
                )
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    permissions: role.permissions.toArray(),
                    position: role.position,
                    color: role.color
                }));

            const channels = interaction.guild.channels.cache.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parentId: channel.parentId,
                permissions: channel.permissionOverwrites.cache.map(po => ({
                    id: po.id,
                    type: po.type,
                    allow: po.allow.bitfield.toString(),
                    deny: po.deny.bitfield.toString()
                }))
            }));

            const backup = await Backup.createBackup(channels, roles);

            const json = JSON.stringify(backup, null, 2);
            const file = new AttachmentBuilder(Buffer.from(json), { name: `${backup.id}.json` });

            const embed = new EmbedBuilder()
                .setTitle('Backup Created!')
                .setDescription('Your server backup has been saved to the database. The backup file is attached below.')
                .setColor(PINK)
                .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], files: [file] });
        }

        if (interaction.options.getSubcommand() === 'view') {
            const backups = await Backup.getBackups();

            if (!backups.length) {
                const embed = new EmbedBuilder()
                    .setTitle('No Backups Found')
                    .setDescription('You have no backups yet. Use `/backup create` to make one!')
                    .setColor(PINK)
                    .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId('select-backup')
                .setPlaceholder('Select a backup to view')
                .addOptions(
                    backups.map(backup => ({
                        label: new Date(backup.createdAt).toLocaleString(),
                        description: backup.id,
                        value: backup.id
                    }))
                );

            const row = new ActionRowBuilder().addComponents(menu);

            const embed = new EmbedBuilder()
                .setTitle('Your Backups')
                .setDescription('Select a backup from the menu below to view details or restore.')
                .setColor(PINK)
                .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.options.getSubcommand() === 'restore-roles') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const start = Date.now();

            const backupId = interaction.options.getString('backup_id');
            const backup = await Backup.getBackupById(backupId);

            if (!backup) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Backup Not Found')
                    .setDescription('Sorry, I couldn\'t find that backup ID!\nPlease check the ID and try again.')
                    .setColor(PINK)
                    .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const guild = interaction.guild;
            let restored = 0, updated = 0, failed = 0, deleted = 0;
            let positionWarnings = [];

            const backupRoleIds = new Set(backup.roles.map(r => r.id));
            const rolesToDelete = guild.roles.cache.filter(role =>
                !backupRoleIds.has(role.id) &&
                role.id !== guild.id &&
                !role.managed
            );
            for (const role of rolesToDelete.values()) {
                try {
                    await role.delete("Restoring from backup: role not in backup");
                    deleted++;
                    await wait(250);
                } catch (e) {
                    failed++;
                }
            }

            for (const r of backup.roles) {
                if (r.id === guild.id) continue;
                try {
                    const existing = guild.roles.cache.get(r.id);
                    if (existing) {
                        const permsAreDifferent = existing.name !== r.name ||
                            JSON.stringify(existing.permissions.toArray().sort()) !== JSON.stringify(r.permissions.sort()) ||
                            existing.color !== r.color;
                        if (permsAreDifferent) {
                            await existing.edit({
                                name: r.name,
                                permissions: r.permissions,
                                color: r.color
                            });
                        }
                        updated++;
                    } else {
                        await guild.roles.create({
                            name: r.name,
                            permissions: r.permissions,
                            color: r.color,
                            reason: "Restoring from backup"
                        });
                        restored++;
                    }
                } catch (e) {
                    failed++;
                }
                await wait(250);
            }

            try {
                const sorted = [...backup.roles]
                    .filter(r => guild.roles.cache.has(r.id))
                    .sort((a, b) => b.position - a.position);

                for (let i = 0; i < sorted.length; i++) {
                    const role = guild.roles.cache.get(sorted[i].id);
                    if (role) {
                        try {
                            await role.setPosition(sorted[i].position);
                        } catch (err) {
                            positionWarnings.push(`⚠️ Could not move role **${role.name}** (ID: ${role.id}) to position ${sorted[i].position}: ${err.message}`);
                            failed++;
                        }
                        await wait(250);
                    }
                }
            } catch (e) {
                failed++;
            }

            const duration = (Date.now() - start) / 1000;

            const embed = new EmbedBuilder()
                .setTitle('✨ All Roles Restored!')
                .setDescription([
                    'All roles from your backup have been lovingly restored! 💖',
                    '',
                    'Here’s how it went:'
                ].join('\n'))
                .setColor(PINK)
                .addFields(
                    { name: '📝 Updated', value: `\`${updated}\``, inline: true },
                    { name: '🌸 Created', value: `\`${restored}\``, inline: true },
                    { name: '🗑️ Deleted', value: `\`${deleted}\``, inline: true },
                    { name: '⚠️ Failed', value: `\`${failed}\``, inline: true }
                )
                .setFooter({ text: `Tomo Backup System • Time taken: ${formatDuration(duration)}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (positionWarnings.length) {
                embed.addFields({
                    name: '⚠️ Warnings',
                    value: positionWarnings.join('\n') + '\nSome roles could not be moved above bot-managed roles due to Discord restrictions.'
                });
            }

            await interaction.editReply({ embeds: [embed] });
        }

        if (interaction.options.getSubcommand() === 'restore-channels') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const start = Date.now();

            const backupId = interaction.options.getString('backup_id');
            const backup = await Backup.getBackupById(backupId);

            if (!backup) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Backup Not Found')
                    .setDescription('Sorry, I couldn\'t find that backup ID!\nPlease check the ID and try again.')
                    .setColor(PINK)
                    .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const guild = interaction.guild;
            let restored = 0, updated = 0, failed = 0, deleted = 0;

            const backupChannelIds = new Set(backup.channels.map(ch => ch.id));
            const channelsToDelete = guild.channels.cache.filter(ch => !backupChannelIds.has(ch.id));
            for (const channel of channelsToDelete.values()) {
                try {
                    await channel.delete("Restoring from backup: channel not in backup");
                    deleted++;
                    await wait(250);
                } catch (e) {
                    failed++;
                }
            }

            const sortedChannels = [...backup.channels].sort((a, b) => {
                if (a.type === 4 && b.type !== 4) return -1;
                if (a.type !== 4 && b.type === 4) return 1;
                return a.position - b.position;
            });

            for (const ch of sortedChannels) {
                try {
                    const existing = guild.channels.cache.get(ch.id);
                    const overwrites = ch.permissions.map(po => ({
                        id: po.id,
                        type: po.type === 0 ? 'role' : 'member',
                        allow: BigInt(po.allow),
                        deny: BigInt(po.deny)
                    }));

                    if (existing) {
                        await existing.edit({
                            name: ch.name,
                            position: ch.position,
                            parent: ch.parentId || null
                        });

                        const currentOverwrites = existing.permissionOverwrites.cache.map(po => ({
                            id: po.id,
                            type: po.type,
                            allow: po.allow.bitfield.toString(),
                            deny: po.deny.bitfield.toString()
                        }));

                        const arePermsDifferent =
                            JSON.stringify(
                                currentOverwrites.sort((a, b) => a.id.localeCompare(b.id))
                            ) !==
                            JSON.stringify(
                                ch.permissions.sort((a, b) => a.id.localeCompare(b.id))
                            );

                        if (arePermsDifferent) {
                            await existing.permissionOverwrites.set(overwrites);
                        }

                        updated++;
                    } else {
                        await guild.channels.create({
                            name: ch.name,
                            type: ch.type,
                            position: ch.position,
                            parent: ch.parentId || null,
                            permissionOverwrites: overwrites
                        });
                        restored++;
                    }
                } catch (e) {
                    failed++;
                }
                await wait(250);
            }

            const duration = (Date.now() - start) / 1000;

            const embed = new EmbedBuilder()
                .setTitle('✨ All Channels Restored!')
                .setDescription([
                    'All channels from your backup have been restored with extra care! 🎀',
                    '',
                    'Here’s how it went:'
                ].join('\n'))
                .setColor(PINK)
                .addFields(
                    { name: '📝 Updated', value: `\`${updated}\``, inline: true },
                    { name: '🌸 Created', value: `\`${restored}\``, inline: true },
                    { name: '🗑️ Deleted', value: `\`${deleted}\``, inline: true },
                    { name: '⚠️ Failed', value: `\`${failed}\``, inline: true }
                )
                .setFooter({ text: `Tomo Backup System • Time taken: ${formatDuration(duration)}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }

        if (interaction.options.getSubcommand() === 'restore-all') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const start = Date.now();

            const backupId = interaction.options.getString('backup_id');
            const backup = await Backup.getBackupById(backupId);

            if (!backup) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Backup Not Found')
                    .setDescription('Sorry, I couldn\'t find that backup ID!\nPlease check the ID and try again.')
                    .setColor(PINK)
                    .setFooter({ text: 'Tomo Backup System', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const guild = interaction.guild;
            let roleRestored = 0, roleUpdated = 0, roleFailed = 0, roleDeleted = 0;
            let channelRestored = 0, channelUpdated = 0, channelFailed = 0, channelDeleted = 0;
            let positionWarnings = [];

            const backupRoleIds = new Set(backup.roles.map(r => r.id));
            const rolesToDelete = guild.roles.cache.filter(role =>
                !backupRoleIds.has(role.id) &&
                role.id !== guild.id &&
                !role.managed
            );
            for (const role of rolesToDelete.values()) {
                try {
                    await role.delete("Restoring from backup: role not in backup");
                    roleDeleted++;
                    await wait(250);
                } catch (e) {
                    roleFailed++;
                }
            }

            for (const r of backup.roles) {
                if (r.id === guild.id) continue;
                try {
                    const existing = guild.roles.cache.get(r.id);
                    if (existing) {
                        const permsAreDifferent = existing.name !== r.name ||
                            JSON.stringify(existing.permissions.toArray().sort()) !== JSON.stringify(r.permissions.sort()) ||
                            existing.color !== r.color;
                        if (permsAreDifferent) {
                            await existing.edit({
                                name: r.name,
                                permissions: r.permissions,
                                color: r.color
                            });
                        }
                        roleUpdated++;
                    } else {
                        await guild.roles.create({
                            name: r.name,
                            permissions: r.permissions,
                            color: r.color,
                            reason: "Restoring from backup"
                        });
                        roleRestored++;
                    }
                } catch (e) {
                    roleFailed++;
                }
                await wait(250);
            }

            try {
                const sorted = [...backup.roles]
                    .filter(r => guild.roles.cache.has(r.id))
                    .sort((a, b) => b.position - a.position);

                for (let i = 0; i < sorted.length; i++) {
                    const role = guild.roles.cache.get(sorted[i].id);
                    if (role) {
                        try {
                            await role.setPosition(sorted[i].position);
                        } catch (err) {
                            positionWarnings.push(`⚠️ Could not move role **${role.name}** (ID: ${role.id}) to position ${sorted[i].position}: ${err.message}`);
                            roleFailed++;
                        }
                        await wait(250);
                    }
                }
            } catch (e) {
                roleFailed++;
            }

            const backupChannelIds = new Set(backup.channels.map(ch => ch.id));
            const channelsToDelete = guild.channels.cache.filter(ch => !backupChannelIds.has(ch.id));
            for (const channel of channelsToDelete.values()) {
                try {
                    await channel.delete("Restoring from backup: channel not in backup");
                    channelDeleted++;
                    await wait(250);
                } catch (e) {
                    channelFailed++;
                }
            }

            const sortedChannels = [...backup.channels].sort((a, b) => {
                if (a.type === 4 && b.type !== 4) return -1;
                if (a.type !== 4 && b.type === 4) return 1;
                return a.position - b.position;
            });

            for (const ch of sortedChannels) {
                try {
                    const existing = guild.channels.cache.get(ch.id);
                    const overwrites = ch.permissions.map(po => ({
                        id: po.id,
                        type: po.type === 0 ? 'role' : 'member',
                        allow: BigInt(po.allow),
                        deny: BigInt(po.deny)
                    }));

                    if (existing) {
                        await existing.edit({
                            name: ch.name,
                            position: ch.position,
                            parent: ch.parentId || null
                        });

                        const currentOverwrites = existing.permissionOverwrites.cache.map(po => ({
                            id: po.id,
                            type: po.type,
                            allow: po.allow.bitfield.toString(),
                            deny: po.deny.bitfield.toString()
                        }));

                        const arePermsDifferent =
                            JSON.stringify(
                                currentOverwrites.sort((a, b) => a.id.localeCompare(b.id))
                            ) !==
                            JSON.stringify(
                                ch.permissions.sort((a, b) => a.id.localeCompare(b.id))
                            );

                        if (arePermsDifferent) {
                            await existing.permissionOverwrites.set(overwrites);
                        }

                        channelUpdated++;
                    } else {
                        await guild.channels.create({
                            name: ch.name,
                            type: ch.type,
                            position: ch.position,
                            parent: ch.parentId || null,
                            permissionOverwrites: overwrites
                        });
                        channelRestored++;
                    }
                } catch (e) {
                    channelFailed++;
                }
                await wait(250);
            }

            const duration = (Date.now() - start) / 1000;

            const embed = new EmbedBuilder()
                .setTitle('🌸 Server Restore Complete!')
                .setDescription([
                    'Your server has been restored from backup! Everything should be just the way you like it. ✨',
                    '',
                    'Here’s a friendly summary of what I did:'
                ].join('\n'))
                .setColor(PINK)
                .addFields(
                    { name: '📝 Roles Updated', value: `\`${roleUpdated}\``, inline: true },
                    { name: '🌸 Roles Created', value: `\`${roleRestored}\``, inline: true },
                    { name: '🗑️ Roles Deleted', value: `\`${roleDeleted}\``, inline: true },
                    { name: '⚠️ Roles Failed', value: `\`${roleFailed}\``, inline: true },
                    { name: '📝 Channels Updated', value: `\`${channelUpdated}\``, inline: true },
                    { name: '🌸 Channels Created', value: `\`${channelRestored}\``, inline: true },
                    { name: '🗑️ Channels Deleted', value: `\`${channelDeleted}\``, inline: true },
                    { name: '⚠️ Channels Failed', value: `\`${channelFailed}\``, inline: true }
                )
                .setFooter({ text: `Tomo Backup System • Time taken: ${formatDuration(duration)}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (positionWarnings.length) {
                embed.addFields({
                    name: '⚠️ Warnings',
                    value: positionWarnings.join('\n') + '\nSome roles could not be moved above bot-managed roles due to Discord restrictions.'
                });
            }

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async autocomplete(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub !== 'restore-channels' && sub !== 'restore-roles' && sub !== 'restore-all') return;
        const focused = interaction.options.getFocused();
        const backups = await Backup.getBackups();
        const filtered = backups
            .filter(b => b.id.startsWith(focused))
            .slice(0, 25)
            .map(b => ({
                name: `${new Date(b.createdAt).toLocaleString()} (${b.id})`,
                value: b.id
            }));
        await interaction.respond(filtered);
    },
};
