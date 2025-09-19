const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

async function loadModals(client) {
	const modalsPath = path.join(__dirname, '..', 'interactions', 'modals');

	try {
		await fs.access(modalsPath);

		const modalFiles = await fs.readdir(modalsPath);
		const jsFiles = modalFiles.filter((file) => file.endsWith('.js'));

		logger.info(`Found ${jsFiles.length} modal handler files`);

		for (const file of jsFiles) {
			const filePath = path.join(modalsPath, file);

			try {
				delete require.cache[require.resolve(filePath)];

				const modal = require(filePath);

				if (!modal.customId || !modal.execute) {
					logger.warn(
						`Modal file ${file} is missing required properties (customId or execute)`
					);
					continue;
				}

				client.modals.set(modal.customId, modal);

				logger.success(`Loaded modal: ${modal.customId} (${file})`);
			} catch (error) {
				logger.error(`Error loading modal from ${file}:`, error);
			}
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			logger.warn('Modals directory not found, creating it...');
			await fs.mkdir(modalsPath, { recursive: true });
		} else {
			logger.error('Error loading modals:', error);
		}
	}
}

async function handleModalInteraction(interaction) {
	const modal = interaction.client.modals.get(interaction.customId);

	if (!modal) {
		logger.warn(
			`No modal handler found for customId: ${interaction.customId}`
		);
		return;
	}

	try {
		await modal.execute(interaction);
		logger.info(
			`Modal executed: ${interaction.customId} by ${interaction.user.tag}`
		);
	} catch (error) {
		logger.error(`Error executing modal ${interaction.customId}:`, error);

		const errorMessage = 'There was an error while processing this modal!';

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: errorMessage,
				ephemeral: true,
			});
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: true });
		}
	}
}

async function reloadModal(client, customId) {
	const modalsPath = path.join(__dirname, '..', 'interactions', 'modals');

	try {
		const modalFiles = await fs.readdir(modalsPath);
		const jsFiles = modalFiles.filter((file) => file.endsWith('.js'));

		for (const file of jsFiles) {
			const filePath = path.join(modalsPath, file);

			try {
				delete require.cache[require.resolve(filePath)];
				const modal = require(filePath);

				if (modal.customId === customId) {
					client.modals.set(modal.customId, modal);
					logger.success(`Reloaded modal: ${customId}`);
					return true;
				}
			} catch (error) {
				logger.error(`Error reloading modal ${customId}:`, error);
			}
		}

		return false;
	} catch (error) {
		logger.error(`Error reloading modal ${customId}:`, error);
		return false;
	}
}

module.exports = {
	loadModals,
	handleModalInteraction,
	reloadModal,
};
