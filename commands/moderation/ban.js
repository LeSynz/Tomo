const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');
const ConfigModel = require('../../models/ConfigModel');
const { processBanEmbedTemplate } = require('../../utils/templateProcessor');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('delete_messages')
        .setDescription('Delete messages from the last X days (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'ban');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteMessages = interaction.options.getInteger('delete_messages') || 0;

      if (targetUser.id === interaction.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('You cannot ban yourself, silly! 💕')
          .setFooter({ text: 'Nice try though! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 That\'s not very nice!')
          .setDescription('I cannot ban myself! That would be quite counterproductive~ 💔')
          .setFooter({ text: 'We\'re supposed to be friends! 🥺' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (targetMember) {
        if (targetMember.id === interaction.guild.ownerId) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('👑 Ultimate Power!')
            .setDescription('Cannot ban the server owner! They have ultimate power~ ✨')
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
            .setDescription('You cannot ban someone with equal or higher roles than you!')
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
            .setDescription('I cannot ban someone with equal or higher roles than me! Please move my role higher~')
            .setFooter({ text: 'Help me help you! 💪' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }

        if (!targetMember.bannable) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('🚫 Cannot Ban User')
            .setDescription('I cannot ban this user due to role hierarchy or permissions!')
            .setFooter({ text: 'Discord won\'t let me! 💔' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }
      }

      await interaction.deferReply({ ephemeral: true });

      const dbAction = await ModerationActionModel.logAction({
        type: 'ban',
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason
      });

      const appealInvite = await ConfigModel.getAppealInvite();
      const appealsEnabled = await ConfigModel.isAppealsEnabled();
      const banTemplate = await ConfigModel.getBanEmbedTemplate();
      
      const processedTemplate = processBanEmbedTemplate(banTemplate, {
        user: targetUser,
        server: interaction.guild,
        reason: reason,
        caseId: dbAction.caseId,
        appealInvite: appealInvite,
        moderator: interaction.user
      });
      
      const dmEmbed = new EmbedBuilder()
        .setColor(processedTemplate.color)
        .setTitle(processedTemplate.title)
        .setDescription(processedTemplate.description)
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
          text: processedTemplate.footer,
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      let dmComponents = [];
      if (appealsEnabled && appealInvite) {
        dmEmbed.addFields({
          name: '⚖️ Appeal This Ban',
          value: `If you believe this ban was unfair, you can join our appeal server to submit an appeal.\n\n**📋 Your Case ID:** \`${dbAction.caseId}\`\n**🆔 Your User ID:** \`${targetUser.id}\`\n\nMake sure to provide these details when appealing.`,
          inline: false
        });

        const appealButton = new ButtonBuilder()
          .setLabel('⚖️ Join Appeal Server')
          .setStyle(ButtonStyle.Link)
          .setURL(appealInvite);

        dmComponents.push(new ActionRowBuilder().addComponents(appealButton));
      }

      try {
        const dmOptions = { embeds: [dmEmbed] };
        if (dmComponents.length > 0) {
          dmOptions.components = dmComponents;
        }
        await targetUser.send(dmOptions);
      } catch (dmError) {
        console.log(`Could not DM user ${targetUser.tag} about their ban:`, dmError.message);
      }

      const banOptions = {
        reason: `${reason} | Banned by: ${interaction.user.tag}`,
        deleteMessageSeconds: deleteMessages * 24 * 60 * 60
      };

      await interaction.guild.members.ban(targetUser, banOptions);

      await moderationLogger.logAction(interaction.client, {
        type: 'ban',
        moderator: interaction.user,
        target: targetUser,
        reason: reason,
        caseId: dbAction.caseId
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔨 Ban Successful')
        .setDescription(`Successfully banned **${targetUser.tag}**!`)
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
        .setFooter({ text: 'Moderation action completed! �' })
        .setTimestamp();

      if (deleteMessages > 0) {
        successEmbed.addFields({
          name: '🧹 Messages Deleted',
          value: `From the last ${deleteMessages} day(s)`,
          inline: true
        });
      }

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in ban command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Ban Failed')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (error.code === 10007) {
        errorEmbed.setDescription('User not found! They might have already left the server~');
      } else if (error.code === 10013) {
        errorEmbed.setDescription('User is already banned! 🔨');
      } else {
        errorEmbed.setDescription('An error occurred while trying to ban the user! Please try again~');
      }

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};