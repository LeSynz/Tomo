module.exports = {
	customId: 'help_support',
	async execute(interaction) {
		await interaction.reply({
			content:
				'💬 For support, please contact the bot developer or check the documentation!',
			ephemeral: true,
		});
	},
};
