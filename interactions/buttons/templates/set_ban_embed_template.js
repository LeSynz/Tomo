const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const ConfigModel = require('../../../models/ConfigModel');
const logger = require('../../../utils/logger');

module.exports = {
  customId: 'set_ban_embed_template',
  
  async execute(interaction) {
    try {
      const configModel = new ConfigModel();
      const currentTemplate = await configModel.getBanEmbedTemplate();

      const colorHex = '#' + currentTemplate.color.toString(16).padStart(6, '0').toUpperCase();

      const modal = new ModalBuilder()
        .setCustomId('ban_embed_template')
        .setTitle('🎨 Customize Ban Embed Template');

      const titleInput = new TextInputBuilder()
        .setCustomId('ban_embed_title')
        .setLabel('Embed Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('🔨 You have been banned')
        .setValue(currentTemplate.title)
        .setMaxLength(256)
        .setRequired(false);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('ban_embed_description')
        .setLabel('Embed Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('You have been banned from **{server}**')
        .setValue(currentTemplate.description)
        .setMaxLength(2000)
        .setRequired(false);

      const colorInput = new TextInputBuilder()
        .setCustomId('ban_embed_color')
        .setLabel('Embed Color (Hex Code)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('#FFB6C1')
        .setValue(colorHex)
        .setMaxLength(7)
        .setRequired(false);

      const footerInput = new TextInputBuilder()
        .setCustomId('ban_embed_footer')
        .setLabel('Embed Footer')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Contact staff if you believe this is a mistake')
        .setValue(currentTemplate.footer)
        .setMaxLength(2048)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(footerInput)
      );

      await interaction.showModal(modal);

      logger.info(`Ban embed template modal opened by ${interaction.user.tag} in ${interaction.guild.name}`);

    } catch (error) {
      logger.error('Error opening ban embed template modal:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to open ban embed customization modal. Please try again.')
        .setFooter({ text: 'Contact support if this persists' });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};