const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const { processBanEmbedTemplate } = require('../../../utils/templateProcessor');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'ban_embed_template',
  
  async execute(interaction) {
    try {
      const title = interaction.fields.getTextInputValue('ban_embed_title');
      const description = interaction.fields.getTextInputValue('ban_embed_description');
      const colorInput = interaction.fields.getTextInputValue('ban_embed_color');
      const footer = interaction.fields.getTextInputValue('ban_embed_footer');

      let color = 0xFFB6C1; // Default pink
      if (colorInput) {
        const hexMatch = colorInput.match(/^#?([0-9a-fA-F]{6})$/);
        if (hexMatch) {
          color = parseInt(hexMatch[1], 16);
        } else {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Invalid Color')
            .setDescription('Please provide a valid hex color code (e.g., #FF0000 or FF0000)')
            .setFooter({ text: 'Try again with a valid color!' });

          return await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      const configModel = new ConfigModel();
      await configModel.setBanEmbedTemplate({
        title: title || '🔨 You have been banned',
        description: description || 'You have been banned from **{server}**',
        color: color,
        footer: footer || 'Contact staff if you believe this is a mistake'
      });

      const previewContext = {
        user: { username: interaction.user.username, id: interaction.user.id },
        server: interaction.guild,
        reason: 'Example reason',
        caseId: '12345',
        appealInvite: 'https://discord.gg/example',
        moderator: { username: 'ExampleMod', id: '123456789' }
      };

      const processedPreview = processBanEmbedTemplate({
        title: title || '🔨 You have been banned',
        description: description || 'You have been banned from **{server}**',
        color: color,
        footer: footer || 'Contact staff if you believe this is a mistake'
      }, previewContext);

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
        .setTitle('✅ Ban Embed Template Updated')
        .setDescription('Your custom ban embed template has been saved successfully!\n\n**Available Variables:**\n`{user}` - Banned user\'s username\n`{userId}` - Banned user\'s ID\n`{server}` - Server name\n`{reason}` - Ban reason\n`{caseId}` - Case ID number\n`{appealInvite}` - Appeal server invite (if enabled)\n`{moderator}` - Moderator username\n`{moderatorId}` - Moderator ID\n\n**Preview of your template:**')
        .setFooter({ text: 'Users will see this when they are banned' });

      await interaction.reply({
        embeds: [successEmbed, previewEmbed],
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Ban embed template updated by ${interaction.user.tag} in ${interaction.guild.name}`);

    } catch (error) {
      logger.error('Error updating ban embed template:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to update ban embed template. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
    }
  }
};