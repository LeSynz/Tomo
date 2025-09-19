const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ModerationActionModel = require('../models/ModerationActionModel');
const AppealModel = require('../models/AppealModel');
const ConfigModel = require('../models/ConfigModel');
const TemplateEngine = require('./templateEngine');

class AppealServer {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.templateEngine = new TemplateEngine(path.join(__dirname, 'views'));
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extaended: true }));
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: 'Too many appeal attempts. Please wait before trying again.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    
    this.app.use('/appeal', limiter);
  }

  setupRoutes() {
    this.app.get('/appeal', (req, res) => {
      const { caseId, userId } = req.query;
      
      const html = this.templateEngine.render('appeal', {
        caseId: caseId || '',
        userId: userId || ''
      });
      
      res.send(html);
    });

    this.app.post('/appeal', async (req, res) => {
      try {
        const { caseId, userId, reason, learned, comments, contact } = req.body;
        
        if (!caseId || !userId || !reason || !learned) {
          return this.sendErrorPage(res, 'Missing Required Fields', 'Please fill in all required fields and try again.');
        }
        
        if (!/^\d{1,6}$/.test(caseId)) {
          return this.sendErrorPage(res, 'Invalid Case ID', 'Please enter a valid case ID (numbers only, up to 6 digits).');
        }
        
        if (!/^\d{17,19}$/.test(userId)) {
          return this.sendErrorPage(res, 'Invalid User ID', 'Please enter a valid Discord User ID (17-19 digits).');
        }
        
        if (reason.trim().length < 50) {
          return this.sendErrorPage(res, 'Appeal Too Short', 'Please provide a more detailed explanation (minimum 50 characters) for why your ban should be lifted.');
        }
        
        if (learned.trim().length < 30) {
          return this.sendErrorPage(res, 'Response Too Short', 'Please provide a more detailed response (minimum 30 characters) about what you learned.');
        }
        
        const moderationCase = await ModerationActionModel.getCase(caseId);
        if (!moderationCase) {
          return this.sendErrorPage(res, 'Case Not Found', 'The provided case ID was not found. Please check your case ID and try again.');
        }
        
        if (moderationCase.userId !== userId) {
          return this.sendErrorPage(res, 'Invalid Case', 'This case ID does not belong to the provided user ID. Please verify both your case ID and user ID are correct.');
        }
        
        const hasActivePendingAppeal = await AppealModel.hasActivePendingAppeal(caseId, userId);
        if (hasActivePendingAppeal) {
          return this.sendErrorPage(res, 'Appeal Already Submitted', 'You already have a pending appeal for this case. Please wait for staff to review your existing appeal.');
        }
        
        const configModel = new ConfigModel();
        const appealsChannelId = await configModel.getAppealsChannel();
        
        if (!appealsChannelId) {
          return this.sendErrorPage(res, 'Appeals Not Available', 'Appeals are not currently configured on this server.');
        }
        
        const appealsChannel = await this.bot.channels.fetch(appealsChannelId).catch(() => null);
        if (!appealsChannel) {
          return this.sendErrorPage(res, 'System Error', 'Appeals channel not found. Please contact staff directly.');
        }
        
        let user;
        try {
          user = await this.bot.users.fetch(userId);
        } catch {
          user = { tag: 'Unknown User', id: userId, displayAvatarURL: () => null };
        }
        
        const appealEmbed = new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setTitle('📝 New Ban Appeal')
          .setDescription(`**User:** ${user.tag} (<@${userId}>)\n**User ID:** ${userId}\n**Case ID:** \`${caseId}\``)
          .addFields(
            { 
              name: '📋 Original Ban Details', 
              value: `**Type:** ${moderationCase.type}\n**Reason:** ${moderationCase.reason}\n**Date:** <t:${Math.floor(new Date(moderationCase.timestamp).getTime() / 1000)}:F>`,
              inline: false
            },
            { 
              name: '❓ Why should the ban be lifted?', 
              value: reason.length > 1024 ? reason.substring(0, 1021) + '...' : reason,
              inline: false
            },
            { 
              name: '🎓 What did they learn?', 
              value: learned.length > 1024 ? learned.substring(0, 1021) + '...' : learned,
              inline: false
            }
          )
          .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL() : null)
          .setFooter({ text: 'Appeal submitted via web form • Click buttons below to respond' })
          .setTimestamp();

        if (comments && comments.trim()) {
          appealEmbed.addFields({
            name: '💬 Additional Comments',
            value: comments.length > 1024 ? comments.substring(0, 1021) + '...' : comments,
            inline: false
          });
        }

        if (contact && contact.trim()) {
          appealEmbed.addFields({
            name: '📧 Contact Information',
            value: contact,
            inline: true
          });
        }

        const approveButton = new ButtonBuilder()
          .setCustomId(`appeal_approve_${caseId}_${userId}`)
          .setLabel('✅ Approve Appeal')
          .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
          .setCustomId(`appeal_deny_${caseId}_${userId}`)
          .setLabel('❌ Deny Appeal')
          .setStyle(ButtonStyle.Danger);

        const historyButton = new ButtonBuilder()
          .setCustomId(`appeal_history_${userId}`)
          .setLabel('📋 View History')
          .setStyle(ButtonStyle.Secondary);

        const actionRow = new ActionRowBuilder().addComponents(approveButton, denyButton, historyButton);

        await appealsChannel.send({
          content: '🔔 **New ban appeal received!**',
          embeds: [appealEmbed],
          components: [actionRow]
        });

        await AppealModel.submitAppeal({
          caseId,
          userId,
          reason,
          learned,
          comments,
          contact
        });

        this.sendSuccessPage(res, caseId, user.tag);

      } catch (error) {
        console.error('Error handling appeal submission:', error);
        this.sendErrorPage(res, 'Submission Failed', 'An error occurred while submitting your appeal. Please try again.');
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  sendSuccessPage(res, caseId, userTag) {
    const html = this.templateEngine.render('success', {
      userTag: this.templateEngine.escapeHtml(userTag),
      caseId: this.templateEngine.escapeHtml(caseId),
      submissionTime: new Date().toLocaleString()
    });
    
    res.send(html);
  }

  sendErrorPage(res, title, message) {
    const html = this.templateEngine.render('error', {
      title: this.templateEngine.escapeHtml(title),
      message: this.templateEngine.escapeHtml(message)
    });
    
    res.status(400).send(html);
  }

  start(port = 3000) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`🌸 Tomo Appeal Server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = AppealServer;