const { EmbedBuilder } = require('discord.js');

module.exports = {
	customId: 'example_primary',
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('🔵 Primary Button Clicked!')
			.setDescription(
				'You clicked the primary button. This demonstrates how button handlers work.'
			)
			.setColor('#5865F2')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
