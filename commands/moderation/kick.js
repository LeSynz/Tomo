const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'kick');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (targetUser.id === interaction.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Self-Kick?')
          .setDescription('You cannot kick yourself, silly! Just leave if you want to go~ 💕')
          .setFooter({ text: 'Use the door! 🚪💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 That\'s mean!')
          .setDescription('I cannot kick myself! I\'m just trying to help~ 💔')
          .setFooter({ text: 'Why would you want me to leave? 🥺' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('👻 User Not Found')
          .setDescription('That user is not in this server! They might have already left~')
          .setFooter({ text: 'Can\'t kick someone who isn\'t here! 💫' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetMember.id === interaction.guild.ownerId) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('👑 Ultimate Authority!')
          .setDescription('Cannot kick the server owner! They have ultimate authority~ ✨')
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
          .setDescription('You cannot kick someone with equal or higher roles than you!')
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
          .setDescription('I cannot kick someone with equal or higher roles than me! Please move my role higher~')
          .setFooter({ text: 'Help me help you! 💪' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (!targetMember.kickable) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🚫 Cannot Kick User')
          .setDescription('I cannot kick this user due to role hierarchy or permissions!')
          .setFooter({ text: 'Discord won\'t let me! 💔' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const dbAction = await ModerationActionModel.logAction({
        type: 'kick',
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason
      });

      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('👢 You have been kicked')
        .setDescription(`You have been kicked from **${interaction.guild.name}**`)
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
          text: 'You can rejoin the server if you have an invite',
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user ${targetUser.tag} about their kick:`, dmError.message);
      }

      await targetMember.kick(`${reason} | Kicked by: ${interaction.user.tag}`);

      await moderationLogger.logAction(interaction.client, {
        type: 'kick',
        moderator: interaction.user,
        target: targetUser,
        reason: reason,
        caseId: dbAction.caseId
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('👢 Kick Successful')
        .setDescription(`Successfully kicked **${targetUser.tag}**!`)
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
        .setFooter({ text: 'Moderation action completed! 👋' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in kick command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Kick Failed')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (error.code === 10007) {
        errorEmbed.setDescription('User not found! They might have already left the server~');
      } else if (error.code === 50013) {
        errorEmbed.setDescription('Missing permissions to kick this user!');
      } else {
        errorEmbed.setDescription('An error occurred while trying to kick the user! Please try again~');
      }

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};