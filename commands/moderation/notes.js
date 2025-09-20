const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const UserNotesModel = require('../../models/UserNotesModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('Manage staff notes for a user')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a note to a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to add a note to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('note')
            .setDescription('The note to add')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all notes for a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user whose notes to view')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a specific note')
        .addStringOption(option =>
          option.setName('note_id')
            .setDescription('The ID of the note to remove')
            .setRequired(true))),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'notes');
    if (!hasPermission) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      await interaction.deferReply({ ephemeral: true });

      if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user');
        const note = interaction.options.getString('note');

        if (note.length > 1000) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('📝 Note Too Long!')
            .setDescription('Notes must be 1000 characters or less! Please shorten your note~ 💕')
            .setFooter({ text: 'Keep it concise! ✨' });

          return await interaction.editReply({
            embeds: [embed]
          });
        }

        const savedNote = await UserNotesModel.addNote(targetUser.id, interaction.user.id, note);

        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📝 Note Added!')
          .setDescription(`Successfully added a note for **${targetUser.tag}**!`)
          .addFields(
            {
              name: '👤 User',
              value: `${targetUser.tag} (\`${targetUser.id}\`)`,
              inline: false
            },
            {
              name: '📋 Note',
              value: `\`\`\`${note}\`\`\``,
              inline: false
            },
            {
              name: '🆔 Note ID',
              value: `\`${savedNote.id}\``,
              inline: true
            },
            {
              name: '👮 Added by',
              value: `${interaction.user.tag}`,
              inline: true
            }
          )
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: 'Note saved! Only visible to staff~ 🔒' })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed]
        });

      } else if (subcommand === 'view') {
        const targetUser = interaction.options.getUser('user');
        const userNotes = await UserNotesModel.getUserNotes(targetUser.id);

        if (userNotes.length === 0) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('📝 No Notes Found')
            .setDescription(`**${targetUser.tag}** has no staff notes! Clean slate~ ✨`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Nothing to see here! 💖' })
            .setTimestamp();

          return await interaction.editReply({
            embeds: [embed]
          });
        }

        const sortedNotes = userNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const notesToShow = sortedNotes.slice(0, 10);

        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle(`📝 Notes for ${targetUser.tag}`)
          .setDescription(`Found **${userNotes.length}** note${userNotes.length === 1 ? '' : 's'}`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `User ID: ${targetUser.id}` })
          .setTimestamp();

        for (const [index, note] of notesToShow.entries()) {
          const date = new Date(note.timestamp);
          const relativeTime = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
          
          let moderator = 'Unknown Moderator';
          try {
            const mod = await interaction.client.users.fetch(note.moderatorId);
            moderator = mod.tag;
          } catch (error) {
          }

          embed.addFields({
            name: `${index + 1}. Note ID: ${note.id}`,
            value: `**Note:** ${note.note}\n**Added by:** ${moderator}\n**Date:** ${relativeTime}`,
            inline: false
          });
        }

        if (userNotes.length > 10) {
          embed.addFields({
            name: '📋 Additional Notes',
            value: `... and ${userNotes.length - 10} more note${userNotes.length - 10 === 1 ? '' : 's'}`,
            inline: false
          });
        }

        await interaction.editReply({
          embeds: [embed]
        });

      } else if (subcommand === 'remove') {
        const noteId = interaction.options.getString('note_id');

        const allNotes = await UserNotesModel.getAllNotes();
        const noteToRemove = allNotes.find(note => note.id === noteId);

        if (!noteToRemove) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Note Not Found')
            .setDescription(`No note found with ID: \`${noteId}\``)
            .setFooter({ text: 'Please check the note ID and try again! 💔' })
            .setTimestamp();

          return await interaction.editReply({
            embeds: [embed]
          });
        }

        const deleted = await UserNotesModel.deleteNote(noteId);

        if (!deleted) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('❌ Deletion Failed')
            .setDescription(`Failed to delete note \`${noteId}\``)
            .setFooter({ text: 'Please try again or contact support! 💔' })
            .setTimestamp();

          return await interaction.editReply({
            embeds: [embed]
          });
        }

        let targetUser = null;
        try {
          targetUser = await interaction.client.users.fetch(noteToRemove.userId);
        } catch (error) {
        }

        let moderator = 'Unknown Moderator';
        try {
          const mod = await interaction.client.users.fetch(noteToRemove.moderatorId);
          moderator = mod.tag;
        } catch (error) {
        }

        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🗑️ Note Deleted')
          .setDescription(`Successfully deleted note \`${noteId}\`!`)
          .addFields(
            {
              name: '👤 User',
              value: targetUser ? `${targetUser.tag} (\`${targetUser.id}\`)` : `Unknown User (\`${noteToRemove.userId}\`)`,
              inline: false
            },
            {
              name: '📋 Deleted Note',
              value: `\`\`\`${noteToRemove.note}\`\`\``,
              inline: false
            },
            {
              name: '👮 Originally Added by',
              value: moderator,
              inline: true
            },
            {
              name: '🗑️ Deleted by',
              value: `${interaction.user.tag}`,
              inline: true
            }
          )
          .setFooter({ text: 'Note permanently removed! 🧹' })
          .setTimestamp();

        if (targetUser) {
          embed.setThumbnail(targetUser.displayAvatarURL());
        }

        await interaction.editReply({
          embeds: [embed]
        });
      }

    } catch (error) {
      console.error('Error in notes command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Notes Error')
        .setDescription('An error occurred while managing notes! Please try again~')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};