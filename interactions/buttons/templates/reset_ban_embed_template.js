const { EmbedBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const { processBanEmbedTemplate } = require('../../../utils/templateProcessor');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'reset_ban_embed_template',
  
  async execute(interaction) {
    try {
      const configModel = new ConfigModel();
      
      const defaultTemplate = {
        title: '🔨 You have been banned',
        description: 'You have been banned from **{server}**',
        color: 0xFFB6C1,
        footer: 'Contact staff if you believe this is a mistake'
      };

      await configModel.setBanEmbedTemplate(defaultTemplate);

      const previewContext = {
        user: { username: interaction.user.username, id: interaction.user.id },
        server: interaction.guild,
        reason: 'Example reason',
        caseId: '12345',
        appealInvite: 'https://discord.gg/example',
        moderator: { username: 'ExampleMod', id: '123456789' }
      };

      const processedPreview = processBanEmbedTemplate(defaultTemplate, previewContext);

      const previewEmbed = new EmbedBuilder()
        .setColor(processedPreview.color)
        .setTitle(processedPreview.title)
        .setDescription(processedPreview.description)
        .addFields(
          {
            name: '💭 Reason',
            value: '`Example reason`',
            inline: false
          },
          {
            name: '📋 Case ID',
            value: '`12345`',
            inline: true
          }
        )
        .setFooter({ 
          text: processedPreview.footer,
          iconURL: interaction.guild.iconURL() 
        })
        .setTimestamp();

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🔄 Ban Embed Reset to Default')
        .setDescription('Your ban embed template has been reset to the default Tomo style!\n\n**Default Template Features:**\n• Simple and clean design\n• Pink color scheme (#FFB6C1)\n• Standard moderation format\n• Compatible with all systems\n\n**Preview of the default template:**')
        .setFooter({ text: 'You can customize it again anytime using the customize button' });

      await interaction.reply({
        embeds: [successEmbed, previewEmbed],
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Ban embed template reset to default by ${interaction.user.tag} in ${interaction.guild.name}`);

    } catch (error) {
      logger.error('Error resetting ban embed template:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to reset ban embed template. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};