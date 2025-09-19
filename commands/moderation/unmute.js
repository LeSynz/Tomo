const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the unmute')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'unmute');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (targetUser.id === interaction.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('You cannot unmute yourself, silly! 💕')
          .setFooter({ text: 'You\'re probably not even muted! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 That\'s sweet!')
          .setDescription('I appreciate the gesture, but I\'m not muted! 💖')
          .setFooter({ text: 'I\'m always here to help! ✨' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ User Not Found')
          .setDescription('This user is not in the server! 💔')
          .setFooter({ text: 'Can\'t unmute someone who isn\'t here! 🥺' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (!targetMember.communicationDisabledUntil || targetMember.communicationDisabledUntil <= new Date()) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔊 Not Muted!')
          .setDescription(`**${targetUser.tag}** is not currently timed out!`)
          .setFooter({ text: 'They\'re free to chat already! 🗣️' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // something is seriously wrong if the owner is muted.
      if (targetMember.id === interaction.guild.ownerId) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('👑 Ultimate Power!')
          .setDescription('The server owner doesn\'t need to be unmuted! They have ultimate power~ ✨')
          .setFooter({ text: 'They literally own this place! 💫' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const moderatorMember = interaction.member;
      if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position && 
          interaction.user.id !== interaction.guild.ownerId) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('👑 Role Hierarchy')
          .setDescription('You cannot unmute someone with equal or higher roles than you!')
          .setFooter({ text: 'Respect the hierarchy! ✊' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const botMember = interaction.guild.members.me;
      if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🥺 I Need Higher Permissions!')
          .setDescription('I cannot unmute someone with equal or higher roles than me! Please move my role higher~')
          .setFooter({ text: 'Help me help you! 💪' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const dbAction = await ModerationActionModel.logAction({
        type: 'unmute',
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason
      });

      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔊 You have been unmuted')
        .setDescription(`Your timeout has been removed in **${interaction.guild.name}**`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          }
        )
        .setFooter({ 
          text: 'You can now chat freely again!',
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user ${targetUser.tag} about their unmute:`, dmError.message);
      }

      await targetMember.timeout(null, `${reason} | Unmuted by: ${interaction.user.tag}`);

      await moderationLogger.logAction(interaction.client, {
        type: 'unmute',
        moderator: interaction.user,
        target: targetUser,
        reason: reason,
        caseId: dbAction.caseId
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔊 Unmute Successful')
        .setDescription(`Successfully unmuted **${targetUser.tag}**!`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: 'They can speak again! 🌸' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in unmute command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Unmute Failed')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (error.code === 10007) {
        errorEmbed.setDescription('User not found! They might have already left the server~');
      } else if (error.code === 50013) {
        errorEmbed.setDescription('I don\'t have permission to unmute this user! Please check my permissions~');
      } else {
        errorEmbed.setDescription('An error occurred while trying to unmute the user! Please try again~');
      }

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};