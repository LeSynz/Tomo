module.exports = {
	customId: 'help_refresh',
	async execute(interaction) {
		await interaction.reply({
			content: '🔄 Help information refreshed!',
			ephemeral: true,
		});
	},
};
