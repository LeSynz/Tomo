const { PermissionFlagsBits } = require('discord.js');
const ConfigModel = require('../../models/ConfigModel');
const renderConfigSection = require('../../helpers/renderConfigSection');
const logger = require('../../utils/logger');

module.exports = {
	customId: /^config_discover_commands$/,
	permissions: PermissionFlagsBits.Administrator,
	
	async execute(interaction) {
		try {
			await interaction.deferUpdate();
			
			const configModel = new ConfigModel();
			
			logger.info(`🔍 Admin ${interaction.user.tag} requested command discovery`);
			const discoveredCount = await configModel.discoverAndRegisterCommands(interaction.client, false);
			
			const response = await renderConfigSection('commands', interaction.guild.id);
			
			const message = discoveredCount > 0 
				? `✅ Discovered ${discoveredCount} new commands!`
				: `ℹ️ No new commands found. All commands are already registered.`;
			
			await interaction.editReply({
				content: message,
				embeds: response.embeds,
				components: response.components
			});
			
			logger.success(`🔍 Command discovery completed by ${interaction.user.tag} - ${discoveredCount} new commands found`);
			
		} catch (error) {
			logger.error('❌ Error discovering commands:', error);
			
			const errorMessage = "❌ Failed to discover commands. Check console for details.";
			
			if (interaction.deferred) {
				await interaction.editReply({ content: errorMessage });
			} else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
			}
		}
	}
};