const { EmbedBuilder } = require('discord.js');

module.exports = {
	customId: 'example_modal',
	async execute(interaction) {
		const name = interaction.fields.getTextInputValue('name_input');
		const feedback =
			interaction.fields.getTextInputValue('feedback_input') ||
			'No feedback provided';

		const embed = new EmbedBuilder()
			.setTitle('📝 Modal Submission Received!')
			.setDescription('Thank you for submitting the modal!')
			.addFields(
				{ name: '👤 Name', value: name, inline: true },
				{
					name: '💭 Feedback',
					value: feedback.substring(0, 1024),
					inline: false,
				}
			)
			.setColor('#9B59B6')
			.setTimestamp()
			.setFooter({ text: `Submitted by ${interaction.user.tag}` });

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
