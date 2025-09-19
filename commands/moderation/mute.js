const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user in the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration of the timeout (e.g., 1m, 30m, 2h, 1d, 1w)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'mute');
    if (!hasPermission) return;

    try {
      const targetUser = interaction.options.getUser('user');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (targetUser.id === interaction.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('You cannot mute yourself, silly! 💕')
          .setFooter({ text: 'That would be quite inconvenient! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetUser.id === interaction.client.user.id) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 That\'s not very nice!')
          .setDescription('I cannot mute myself! How would I help you then? 💔')
          .setFooter({ text: 'We\'re supposed to be friends! 🥺' });

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
          .setFooter({ text: 'Maybe they left already? 🥺' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // skill issue?
      if (targetMember.id === interaction.guild.ownerId) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('👑 Ultimate Power!')
          .setDescription('Cannot mute the server owner! They have ultimate power~ ✨')
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
          .setDescription('You cannot mute someone with equal or higher roles than you!')
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
          .setDescription('I cannot mute someone with equal or higher roles than me! Please move my role higher~')
          .setFooter({ text: 'Help me help you! 💪' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetMember.communicationDisabledUntil && targetMember.communicationDisabledUntil > new Date()) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔇 Already Muted!')
          .setDescription(`**${targetUser.tag}** is already timed out!`)
          .addFields({
            name: '⏰ Expires',
            value: `<t:${Math.floor(targetMember.communicationDisabledUntil.getTime() / 1000)}:R>`,
            inline: true
          })
          .setFooter({ text: 'They\'re already quiet! 🤫' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const durationMs = parseDuration(duration);
      if (!durationMs) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Invalid Duration')
          .setDescription('Invalid duration format! Please use formats like:\n`1m` (1 minute), `30m` (30 minutes), `2h` (2 hours), `1d` (1 day), `1w` (1 week)')
          .setFooter({ text: 'Examples: 5m, 1h, 2d, 1w 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // discord said no :(
      const maxDuration = 28 * 24 * 60 * 60 * 1000;
      if (durationMs > maxDuration) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('⏰ Duration Too Long!')
          .setDescription('Discord timeouts can only last up to 28 days maximum!')
          .setFooter({ text: 'That\'s Discord\'s rule, not mine! 🤷‍♀️' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const dbAction = await ModerationActionModel.logAction({
        type: 'mute',
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason,
        duration: duration
      });

      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔇 You have been muted')
        .setDescription(`You have been timed out in **${interaction.guild.name}**`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '⏰ Duration',
            value: `\`${duration}\``,
            inline: true
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          }
        )
        .setFooter({ 
          text: 'You will be able to chat again when the timeout expires',
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM user ${targetUser.tag} about their mute:`, dmError.message);
      }

      await targetMember.timeout(durationMs, `${reason} | Muted by: ${interaction.user.tag}`);

      await moderationLogger.logAction(interaction.client, {
        type: 'mute',
        moderator: interaction.user,
        target: targetUser,
        reason: reason,
        duration: duration,
        caseId: dbAction.caseId
      });

      const expiryTime = new Date(Date.now() + durationMs);

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔇 Mute Successful')
        .setDescription(`Successfully muted **${targetUser.tag}**!`)
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '⏰ Duration',
            value: `\`${duration}\``,
            inline: true
          },
          {
            name: '📋 Case ID',
            value: `\`${dbAction.caseId}\``,
            inline: true
          },
          {
            name: '🕐 Expires',
            value: `<t:${Math.floor(expiryTime.getTime() / 1000)}:R>`,
            inline: true
          }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: 'Moderation action completed! 🌸' })
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });

    } catch (error) {
      console.error('Error in mute command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Mute Failed')
        .setFooter({ text: 'Please try again or contact support! 💔' })
        .setTimestamp();

      if (error.code === 10007) {
        errorEmbed.setDescription('User not found! They might have already left the server~');
      } else if (error.code === 50013) {
        errorEmbed.setDescription('I don\'t have permission to timeout this user! Please check my permissions~');
      } else {
        errorEmbed.setDescription('An error occurred while trying to mute the user! Please try again~');
      }

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

function parseDuration(duration) {
  const match = duration.match(/^(\d+)([mhdw])$/);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    case 'd': return amount * 24 * 60 * 60 * 1000;
    case 'w': return amount * 7 * 24 * 60 * 60 * 1000;
    default: return null;
  }
}