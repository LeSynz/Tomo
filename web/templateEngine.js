const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor(viewsPath) {
    this.viewsPath = viewsPath;
  }

  render(templateName, data = {}) {
    try {
      const templatePath = path.join(this.viewsPath, `${templateName}.html`);
      let template = fs.readFileSync(templatePath, 'utf8');
      
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key] || '');
      });
      
      return template;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      return `<h1>Template Error</h1><p>Could not load template: ${templateName}</p>`;
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
}

module.exports = TemplateEngine;