const { EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');

module.exports = {
  customId: 'appeal_invite_modal',
  async execute(interaction) {
    try {
      const inviteLink = interaction.fields.getTextInputValue('appeal_invite_input').trim();
      const instructions = interaction.fields.getTextInputValue('appeal_instructions_input')?.trim() || null;

      const inviteRegex = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)([a-zA-Z0-9-]+)$/;
      
      if (!inviteRegex.test(inviteLink)) {
        const embed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('❌ Invalid Invite Link')
          .setDescription('Please provide a valid Discord invite link.\n\n**Valid formats:**\n• `https://discord.gg/example`\n• `discord.gg/example`\n• `https://discord.com/invite/example`')
          .setFooter({ text: 'Please try again with a valid invite link 💔' });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const match = inviteLink.match(inviteRegex);
      const inviteCode = match[1];
      const normalizedInvite = `https://discord.gg/${inviteCode}`;

      await ConfigModel.setAppealInvite(normalizedInvite);

      const embed = new EmbedBuilder()
        .setColor(0x98FB98)
        .setTitle('⚖️ Appeal Server Invite Updated')
        .setDescription(`Appeal server invite has been set successfully!\n\n**Invite Link:** [${normalizedInvite}](${normalizedInvite})\n\nUsers who receive punishments will now see a button to join this server for appeals.`)
        .setFooter({ text: 'Appeal system configured successfully! 🌸' });

      if (instructions) {
        embed.addFields({
          name: '📝 Custom Instructions',
          value: instructions,
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in appeal_invite_modal:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setTitle('❌ Error')
        .setDescription('Failed to save appeal invite! Please try again~')
        .setFooter({ text: 'Something went wrong! 💔' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};