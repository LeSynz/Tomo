module.exports = {
	customId: 'example_danger',
	async execute(interaction) {
		await interaction.reply({
			content:
				'🚨 Danger button clicked! This is just a demonstration - nothing dangerous happened.',
			ephemeral: true,
		});
	},
};
