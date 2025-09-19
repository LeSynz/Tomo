const { PermissionFlagsBits } = require('discord.js');
const ConfigModel = require('../../models/ConfigModel');
const renderConfigSection = require('../../helpers/renderConfigSection');
const logger = require('../../utils/logger');

module.exports = {
	customId: /^config_refresh_commands$/,
	permissions: PermissionFlagsBits.Administrator,
	
	async execute(interaction) {
		try {
			await interaction.deferUpdate();
			
			const configModel = new ConfigModel();
			
			logger.info(`🔄 Admin ${interaction.user.tag} requested command list refresh`);
			const refreshedCount = await configModel.discoverAndRegisterCommands(interaction.client, true);
			
			const response = await renderConfigSection('commands', interaction.guild.id);
			
			await interaction.editReply({
				content: `✅ Refreshed command list! Found and updated ${refreshedCount} commands.`,
				embeds: response.embeds,
				components: response.components
			});
			
			logger.success(`🔄 Command refresh completed by ${interaction.user.tag} - ${refreshedCount} commands updated`);
			
		} catch (error) {
			logger.error('❌ Error refreshing commands:', error);
			
			const errorMessage = "❌ Failed to refresh commands. Check console for details.";
			
			if (interaction.deferred) {
				await interaction.editReply({ content: errorMessage });
			} else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
			}
		}
	}
};