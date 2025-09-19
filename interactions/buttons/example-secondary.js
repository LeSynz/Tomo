module.exports = {
	customId: 'example_secondary',
	async execute(interaction) {
		await interaction.reply({
			content:
				'🔘 Secondary button clicked! This button has a more subtle style.',
			ephemeral: true,
		});
	},
};
