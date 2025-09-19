const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('User ID or username#discriminator to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the unban')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'unban');
    if (!hasPermission) return;

    try {
      const userInput = interaction.options.getString('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      await interaction.deferReply({ ephemeral: true });

      let userId = null;
      let targetUser = null;

      if (/^\d+$/.test(userInput)) {
        userId = userInput;
        try {
          targetUser = await interaction.client.users.fetch(userId);
        } catch (error) {
          console.log(`Could not fetch user ${userId}, attempting unban anyway`);
        }
      } else {
        const bans = await interaction.guild.bans.fetch();
        const bannedUser = bans.find(ban => 
          ban.user.tag.toLowerCase() === userInput.toLowerCase() ||
          ban.user.username.toLowerCase() === userInput.toLowerCase()
        );

        if (bannedUser) {
          userId = bannedUser.user.id;
          targetUser = bannedUser.user;
        }
      }

      if (!userId) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔍 User Not Found')
          .setDescription('Could not find a banned user with that username or ID!')
          .addFields({
            name: '💡 Tips',
            value: '• Use the full User ID (numbers only)\n• Use exact username#discriminator\n• Make sure the user is actually banned',
            inline: false
          })
          .setFooter({ text: 'Double-check the spelling! 💕' });

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      let isBanned = false;
      try {
        const bans = await interaction.guild.bans.fetch();
        isBanned = bans.has(userId);
      } catch (error) {
        console.log('Error checking ban status:', error);
      }

      if (!isBanned) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('ℹ️ User Not Banned')
          .setDescription(`${targetUser ? targetUser.tag : `User ID: ${userId}`} is not currently banned!`)
          .setFooter({ text: 'Nothing to unban here~ 🌸' });

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      try {
        await interaction.guild.members.unban(userId, `${reason} | Unbanned by: ${interaction.user.tag}`);
      } catch (unbanError) {
        console.error('Unban error:', unbanError);
        
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Unban Failed')
          .setDescription('Failed to unban the user. They might not be banned or there was a permission error.')
          .setFooter({ text: 'Please try again or contact support! 💔' });

        return await interaction.editReply({
          embeds: [errorEmbed]
        });
      }

      const dbAction = await ModerationActionModel.logAction({
        type: 'unban',
        userId: userId,
        moderatorId: interaction.user.id,
        reason: reason
      });

      await moderationLogger.logAction(interaction.client, {
        type: 'unban',
        moderator: interaction.user,
        target: targetUser || { tag: `ID: ${userId}`, id: userId, displayAvatarURL: () => null },
        reason: reason,
        caseId: dbAction.caseId
      });

      if (targetUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x90EE90)
          .setTitle('🎉 You have been unbanned!')
          .setDescription(`You have been unbanned from **${interaction.guild.name}**`)
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
            },
            {
              name: '🌸 Welcome Back!',
              value: 'Please remember to follow the server rules.',
              inline: false
            }
          )
          .setFooter({ 
            text: 'Thank you for your patience! 💖',
            iconURL: interaction.guild.iconURL() 
          })
          .setTimestamp();

        try {
          await targetUser.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not DM user ${targetUser.tag} about their unban:`, dmError.message);
        }
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x90EE90)
        .setTitle('🎉 Unban Successful')
        .setDescription(`Successfully unbanned **${targetUser ? targetUser.tag : `ID: ${userId}`}**!`)
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
        .setThumbnail(targetUser ? targetUser.displayAvatarURL() : null)
        .setFooter({ text: 'Moderation action completed! 💖' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in unban command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Unban Failed')
        .setDescription('An error occurred while trying to unban the user! Please try again~')
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