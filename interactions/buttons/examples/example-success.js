module.exports = {
	customId: 'example_success',
	async execute(interaction) {
		await interaction.reply({
			content:
				'✅ Success button clicked! Everything is working perfectly.',
			ephemeral: true,
		});
	},
};
