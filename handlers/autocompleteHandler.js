const path = require('path');
const logger = require('../utils/logger');

async function handleAutocomplete(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') {
        logger.warn(`No autocomplete handler for command: ${interaction.commandName}`);
        return;
    }
    try {
        await command.autocomplete(interaction, client);
    } catch (error) {
        logger.error(`Error in autocomplete handler for ${interaction.commandName}:`, error);
    }
}

module.exports = { handleAutocomplete };