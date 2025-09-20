const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const permissionChecker = require('../../utils/permissionChecker');
const moderationLogger = require('../../utils/moderationLogger');
const ModerationActionModel = require('../../models/ModerationActionModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to unlock (defaults to current channel)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unlocking the channel')
        .setRequired(false)),
  isPublic: false,

  async execute(interaction) {
    const hasPermission = await permissionChecker.requirePermission(interaction, 'unlock');
    if (!hasPermission) return;

    try {
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!targetChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🌸 Oops!')
          .setDescription('I can only unlock text channels, silly! Voice channels don\'t need unlocking~ 💕')
          .setFooter({ text: 'Try a text channel instead! 💖' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const everyoneRole = interaction.guild.roles.everyone;
      const currentPermissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);

      if (!currentPermissions || !currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('🔓 Already Open!')
          .setDescription(`${targetChannel} is already unlocked! Everyone can chat freely~ ✨`)
          .setFooter({ text: 'No need to unlock it again! 💫' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      }, {
        reason: `Channel unlocked by ${interaction.user.tag}: ${reason}`
      });

      await ModerationActionModel.logAction({
        type: 'unlock',
        userId: null,
        moderatorId: interaction.user.id,
        reason: `${targetChannel.name}: ${reason}`
      });

      const unlockEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔓 Channel Reopened!')
        .setDescription('This channel has been unlocked! You can chat again~ 💬')
        .addFields(
          {
            name: '💭 Reason',
            value: `\`${reason}\``,
            inline: false
          },
          {
            name: '👮 Unlocked by',
            value: `${interaction.user}`,
            inline: true
          }
        )
        .setFooter({ text: 'Welcome back to chatting! Please follow the rules~ 🌸' })
        .setTimestamp();

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('🔓 Unlock Successful')
        .setDescription(`Successfully unlocked ${targetChannel}!`)
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
        .setFooter({ text: 'Channel is now open for chatting! 💬' })
        .setTimestamp();

      await targetChannel.send({ embeds: [unlockEmbed] });
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in unlock command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Unlock Failed')
        .setDescription('An error occurred while trying to unlock the channel! Please try again~')
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