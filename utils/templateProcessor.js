/**
 * Helper function to substitute template variables in embed content
 * @param {string} template - The template string with variables
 * @param {Object} variables - Object containing variable values
 * @returns {string} - Template with variables replaced
 */
function substituteVariables(template, variables) {
  if (!template || typeof template !== 'string') return template;
  
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.split(placeholder).join(replacement);
  }
  
  return result;
}

/**
 * Processes a ban embed template and substitutes all variables
 * @param {Object} template - The ban embed template object
 * @param {Object} context - Context object containing variables
 * @returns {Object} - Processed embed template with variables substituted
 */
function processBanEmbedTemplate(template, context) {
  const {
    user,
    server,
    reason,
    caseId,
    appealInvite,
    moderator
  } = context;

  const variables = {
    user: user?.username || user?.tag || 'Unknown User',
    userId: user?.id || 'Unknown',
    server: server?.name || 'Unknown Server',
    reason: reason || 'No reason provided',
    caseId: caseId || 'Unknown',
    appealInvite: appealInvite || '',
    moderator: moderator?.username || moderator?.tag || 'Unknown Moderator',
    moderatorId: moderator?.id || 'Unknown'
  };

  return {
    title: substituteVariables(template.title, variables),
    description: substituteVariables(template.description, variables),
    color: template.color,
    footer: substituteVariables(template.footer, variables)
  };
}

module.exports = {
  substituteVariables,
  processBanEmbedTemplate
};