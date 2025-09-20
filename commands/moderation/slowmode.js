const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set or remove slowmode in a channel')
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Slowmode duration in seconds (0-21600, 0 to disable)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to set slowmode in (defaults to current channel)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for setting slowmode')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'slowmode');
    if (!hasPermission) return;

    try {
      const seconds = interaction.options.getInteger('seconds');
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!targetChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('I can only set slowmode in text channels, silly! Voice channels don\'t need slowmode~ 💕')
          .setFooter({ text: 'Try a text channel instead! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      if (targetChannel.rateLimitPerUser === seconds) {
        if (seconds === 0) {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('⚡ Already Fast!')
            .setDescription(`${targetChannel} already has no slowmode! Everyone can chat at full speed~ ✨`)
            .setFooter({ text: 'No need to change anything! 💫' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        } else {
          const embed = new EmbedBuilder()
            .setColor(0xFFB6C1)
            .setTitle('🐌 Already Set!')
            .setDescription(`${targetChannel} already has a ${seconds} second slowmode! It's perfectly paced~ ✨`)
            .setFooter({ text: 'No need to change anything! 💫' });

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }
      }

      await interaction.deferReply({ ephemeral: true });

      await targetChannel.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag}: ${reason}`);

      const actionType = seconds === 0 ? 'slowmode_disable' : 'slowmode_enable';
      const logReason = seconds === 0 
        ? `Disabled slowmode in ${targetChannel.name}: ${reason}`
        : `Set slowmode to ${seconds}s in ${targetChannel.name}: ${reason}`;

      await ModerationActionModel.logAction({
        type: actionType,
        userId: null,
        moderatorId: interaction.user.id,
        reason: logReason,
        duration: seconds > 0 ? seconds * 1000 : null
      });
      
      let channelEmbed, successEmbed;

      if (seconds === 0) {
        channelEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('⚡ Slowmode Disabled!')
          .setDescription('Slowmode has been removed! You can chat at full speed now~ 💨')
          .addFields(
            {
              name: '💭 Reason',
              value: `\`${reason}\``,
              inline: false
            },
            {
              name: '👮 Removed by',
              value: `${interaction.user}`,
              inline: true
            }
          )
          .setFooter({ text: 'Chat away to your heart\'s content! 💬🌸' })
          .setTimestamp();

        successEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('⚡ Slowmode Disabled')
          .setDescription(`Successfully removed slowmode from ${targetChannel}!`)
          .addFields(
            {
              name: '💭 Reason',
              value: `\`${reason}\``,
              inline: false
            },
            {
              name: '📍 Channel',
              value: `${targetChannel}`,
              inline: true
            }
          )
          .setFooter({ text: 'Channel is now at full speed! 💨' })
          .setTimestamp();
      } else {
        const timeFormat = seconds >= 3600 
          ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`
          : seconds >= 60 
          ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
          : `${seconds}s`;

        channelEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🐌 Slowmode Enabled!')
          .setDescription(`Slowmode has been set! Please wait ${timeFormat} between messages~ ⏰`)
          .addFields(
            {
              name: '💭 Reason',
              value: `\`${reason}\``,
              inline: false
            },
            {
              name: '👮 Set by',
              value: `${interaction.user}`,
              inline: true
            },
            {
              name: '⏱️ Duration',
              value: `${timeFormat}`,
              inline: true
            }
          )
          .setFooter({ text: 'Take your time and think before you type! 💭🌸' })
          .setTimestamp();

        successEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🐌 Slowmode Set')
          .setDescription(`Successfully set slowmode to ${timeFormat} in ${targetChannel}!`)
          .addFields(
            {
              name: '💭 Reason',
              value: `\`${reason}\``,
              inline: false
            },
            {
              name: '📍 Channel',
              value: `${targetChannel}`,
              inline: true
            },
            {
              name: '⏱️ Duration',
              value: `${timeFormat}`,
              inline: true
            }
          )
          .setFooter({ text: 'Channel pace has been set! 🐌' })
          .setTimestamp();
      }

      await targetChannel.send({ embeds: [channelEmbed] });
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in slowmode command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Slowmode Failed')
        .setDescription('An error occurred while trying to set slowmode! Please try again~')
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