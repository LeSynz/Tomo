const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel to prevent messages')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to lock (defaults to current channel)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for locking the channel')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'lock');
    if (!hasPermission) return;

    try {
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!targetChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('I can only lock text channels, silly! Voice channels don\'t need locking~ 💕')
          .setFooter({ text: 'Try a text channel instead! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const everyoneRole = interaction.guild.roles.everyone;
      const currentPermissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);

      if (currentPermissions && currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔒 Already Secured!')
          .setDescription(`${targetChannel} is already locked! It's nice and secure~ ✨`)
          .setFooter({ text: 'No need to lock it again! 💫' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false
      }, {
        reason: `Channel locked by ${interaction.user.tag}: ${reason}`
      });

      await ModerationActionModel.logAction({
        type: 'lock',
        userId: null,
        moderatorId: interaction.user.id,
        reason: `${targetChannel.name}: ${reason}`
      });

      const lockEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔒 Channel Secured!')
        .setDescription('This channel has been locked by the moderation team!')
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '👮 Locked by',
            value: `${interaction.user}`,
            inline: true
          }
        )
        .setFooter({ text: 'Please wait for staff to unlock the channel~ 🌸' })
        .setTimestamp();

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔒 Lock Successful')
        .setDescription(`Successfully locked ${targetChannel}!`)
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
        .setFooter({ text: 'Channel is now secure! 🛡️' })
        .setTimestamp();

      await targetChannel.send({ embeds: [lockEmbed] });
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in lock command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Lock Failed')
        .setDescription('An error occurred while trying to lock the channel! Please try again~')
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