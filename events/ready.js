const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const ConfigModel = require('../models/ConfigModel');

// Ensure database connection is initialized
// require('../database/connection');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.success(`Ready! Logged in as ${client.user.tag}`);
		logger.info(`Bot is running in ${client.guilds.cache.size} servers`);

		const commandsAdded = await ConfigModel.discoverAndRegisterCommands(client);
		
		if (commandsAdded > 0) {
			logger.info(`🎛️ Auto-registered ${commandsAdded} new commands for configuration`);
		}
		
		logger.info(`Commands loaded: ${client.commands?.size || 0}, Select menus: ${client.selectMenus?.size || 0}`);

		const statuses = [
			{ name: '🍓 Keeping it comfy~', type: ActivityType.Playing },
			{ name: '🌸 Protecting The Server!', type: ActivityType.Watching },
			{ name: '🍰 Serving sweetness & safety', type: ActivityType.Playing },
			{ name: '✨ Moderating with cuteness~', type: ActivityType.Watching },
			{ name: '💌 DMs and dreams~', type: ActivityType.Listening }
		];

		let i = 0;
		setInterval(() => {
			const status = statuses[i];
			client.user.setActivity(status.name, { type: status.type });
			i = (i + 1) % statuses.length;
		}, 15_000); // changes every 15 seconds
	},
};
