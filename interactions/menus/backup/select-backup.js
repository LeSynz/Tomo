const { AttachmentBuilder, MessageFlags } = require('discord.js');
const Backup = require('../../../models/BackupModel');

module.exports = {
    customId: 'select-backup',
    async execute(interaction) {
        const backupId = interaction.values[0];
        const backup = await Backup.getBackupById(backupId);

        if (!backup) {
            return interaction.reply({ content: 'Backup not found.', ephemeral: true });
        }

        const json = JSON.stringify(backup, null, 2);
        const file = new AttachmentBuilder(Buffer.from(json), { name: `${backup.id}.json` });

        await interaction.reply({
            content: `Here is the backup for \`${new Date(backup.createdAt).toLocaleString()}\` (ID: \`${backup.id}\`):`,
            files: [file],
            flags: MessageFlags.Ephemeral
        });
    }
};