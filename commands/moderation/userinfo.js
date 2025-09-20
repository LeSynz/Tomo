const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationActionModel = require('../../models/ModerationActionModel');
const UserNotesModel = require('../../models/UserNotesModel');
const permissionChecker = require('../../utils/permissionChecker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('📋 Get comprehensive information about a user (Staff only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(true)),
    isPublic: false,

    async execute(interaction) {
        const hasPermission = await permissionChecker.requirePermission(interaction, 'userinfo');
        if (!hasPermission) return;

        await interaction.deferReply({ flags: 64 });

        try {
            const targetUser = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(targetUser.id) || 
                          await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            const userCases = await ModerationActionModel.getUserCases(targetUser.id);
            
            const userNotes = await UserNotesModel.getUserNotes(targetUser.id);

            const caseStats = {
                total: userCases.length,
                warn: userCases.filter(c => c.type === 'warn').length,
                mute: userCases.filter(c => c.type === 'mute').length,
                kick: userCases.filter(c => c.type === 'kick').length,
                ban: userCases.filter(c => c.type === 'ban').length,
                unban: userCases.filter(c => c.type === 'unban').length,
                unmute: userCases.filter(c => c.type === 'unmute').length
            };

            const embed = new EmbedBuilder()
                .setTitle(`📋 User Information: ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setColor('#3498db')
                .setTimestamp();

            const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
            
            embed.addFields({
                name: '👤 Basic Information',
                value: [
                    `**Username:** ${targetUser.tag}`,
                    `**ID:** ${targetUser.id}`,
                    `**Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                    `**Account Age:** ${accountAge} days`,
                    `**Bot:** ${targetUser.bot ? 'Yes' : 'No'}`
                ].join('\n'),
                inline: false
            });

            if (member) {
                const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
                const roles = member.roles.cache
                    .filter(role => role.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString())
                    .slice(0, 10);
                
                embed.addFields({
                    name: '🏠 Server Information',
                    value: [
                        `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                        `**Join Age:** ${joinAge} days`,
                        `**Nickname:** ${member.nickname || 'None'}`,
                        `**Roles (${member.roles.cache.size - 1}):** ${roles.length > 0 ? roles.join(', ') : 'None'}${roles.length === 10 ? '\n*...and more*' : ''}`
                    ].join('\n'),
                    inline: false
                });

                const permissions = [];
                if (member.permissions.has(PermissionFlagsBits.Administrator)) permissions.push('Administrator');
                if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) permissions.push('Moderate Members');
                if (member.permissions.has(PermissionFlagsBits.KickMembers)) permissions.push('Kick Members');
                if (member.permissions.has(PermissionFlagsBits.BanMembers)) permissions.push('Ban Members');
                if (member.permissions.has(PermissionFlagsBits.ManageMessages)) permissions.push('Manage Messages');

                embed.addFields({
                    name: '⚡ Current Status',
                    value: [
                        `**Status:** ${member.presence?.status || 'Offline'}`,
                        `**Timeout:** ${member.isCommunicationDisabled() ? `Until <t:${Math.floor(member.communicationDisabledUntil / 1000)}:F>` : 'None'}`,
                        `**Key Permissions:** ${permissions.length > 0 ? permissions.join(', ') : 'None'}`
                    ].join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🏠 Server Information',
                    value: '❌ **User is not in this server**',
                    inline: false
                });
            }

            const caseStatsText = [];
            if (caseStats.total === 0) {
                caseStatsText.push('🌟 **Clean record!** No cases found.');
            } else {
                caseStatsText.push(`**Total Cases:** ${caseStats.total}`);
                if (caseStats.warn > 0) caseStatsText.push(`**Warnings:** ${caseStats.warn}`);
                if (caseStats.mute > 0) caseStatsText.push(`**Mutes:** ${caseStats.mute}`);
                if (caseStats.kick > 0) caseStatsText.push(`**Kicks:** ${caseStats.kick}`);
                if (caseStats.ban > 0) caseStatsText.push(`**Bans:** ${caseStats.ban}`);
                if (caseStats.unban > 0) caseStatsText.push(`**Unbans:** ${caseStats.unban}`);
                if (caseStats.unmute > 0) caseStatsText.push(`**Unmutes:** ${caseStats.unmute}`);

                const recentCase = userCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                if (recentCase) {
                    const caseTime = Math.floor(new Date(recentCase.timestamp).getTime() / 1000);
                    caseStatsText.push(`**Latest Case:** ${recentCase.type.toUpperCase()} - <t:${caseTime}:R>`);
                }
            }

            embed.addFields({
                name: '⚖️ Moderation History',
                value: caseStatsText.join('\n'),
                inline: false
            });

            if (userNotes.length === 0) {
                embed.addFields({
                    name: '📝 Staff Notes',
                    value: '💭 No notes found.',
                    inline: false
                });
            } else {
                const sortedNotes = userNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const recentNotes = sortedNotes.slice(0, 3);
                
                const notesText = recentNotes.map(note => {
                    const moderator = interaction.client.users.cache.get(note.moderatorId);
                    const noteTime = Math.floor(new Date(note.timestamp).getTime() / 1000);
                    const truncatedNote = note.note.length > 100 ? note.note.substring(0, 100) + '...' : note.note;
                    return `**<t:${noteTime}:d>** by ${moderator ? moderator.tag : 'Unknown'}\n${truncatedNote}`;
                }).join('\n\n');

                embed.addFields({
                    name: `📝 Staff Notes (${userNotes.length} total${userNotes.length > 3 ? ', showing 3 most recent' : ''})`,
                    value: notesText,
                    inline: false
                });

                if (userNotes.length > 3) {
                    embed.addFields({
                        name: '\u200b',
                        value: `💡 *Use \`/notes view user:${targetUser.tag}\` to see all notes*`,
                        inline: false
                    });
                }
            }

            embed.setFooter({
                text: `Use /search user:${targetUser.tag} for detailed case history • Use /notes for note management`,
                iconURL: interaction.client.user.displayAvatarURL()
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in userinfo command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching user information. Please try again.',
            });
        }
    }
};