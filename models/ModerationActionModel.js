const { Schema, model } = require('synz-db');

const moderationActionSchema = new Schema({
  type: {
    type: 'string',
    required: true,
    enum: ['warn', 'mute', 'ban', 'kick', 'unban', 'unmute']
  },
  userId: {
    type: 'string',
    required: true
  },
  moderatorId: {
    type: 'string',
    required: true
  },
  reason: {
    type: 'string',
    default: 'No reason provided'
  },
  duration: {
    type: 'string',
    default: null
  },
  caseId: {
    type: 'string',
    required: true,
    unique: true
  },
  timestamp: {
    type: 'date',
    default: () => new Date()
  }
}, {
  timestamps: true
});

// Static methods
moderationActionSchema.statics.logAction = async function({ type, userId, moderatorId, reason, duration }) {
  const caseId = await this.generateCaseId();

  const action = {
    type,
    userId,
    moderatorId,
    reason: reason || 'No reason provided',
    duration: duration || null,
    caseId,
    timestamp: new Date()
  };

  const savedAction = await this.create(action);

  // Add case to user
  const User = require('./UserModel');
  await User.addCase(userId, caseId);

  return savedAction;
};

moderationActionSchema.statics.generateCaseId = async function() {
  const all = await this.find();
  const highestNum = all.reduce((max, action) => {
    const match = action.caseId.match(/^(\d+)$/);
    const num = match ? parseInt(match[1], 10) : -1;
    return Math.max(max, num);
  }, -1);

  const nextNum = highestNum + 1;
  return String(nextNum).padStart(4, '0');
};

moderationActionSchema.statics.getUserCases = async function(userId) {
  return await this.find({ userId });
};

moderationActionSchema.statics.getUserWarnings = async function(userId, guildId) {
  return await this.find({ userId, type: 'warn' });
};

moderationActionSchema.statics.getCase = async function(caseId) {
  return await this.findOne({ caseId });
};

moderationActionSchema.statics.deleteCase = async function(caseId) {
  return await this.deleteMany({ caseId });
};

moderationActionSchema.statics.updateCaseReason = async function(caseId, newReason) {
  const caseRecord = await this.findOne({ caseId });
  if (caseRecord) {
    caseRecord.reason = newReason;
    return await caseRecord.save();
  }
  return null;
};

moderationActionSchema.statics.getStatistics = async function() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const allActions = await this.find();
  
  const stats = {
    mute: { last7: 0, last30: 0, allTime: 0 },
    ban: { last7: 0, last30: 0, allTime: 0 },
    kick: { last7: 0, last30: 0, allTime: 0 },
    warn: { last7: 0, last30: 0, allTime: 0 },
    unban: { last7: 0, last30: 0, allTime: 0 },
    unmute: { last7: 0, last30: 0, allTime: 0 },
    total: { last7: 0, last30: 0, allTime: 0 }
  };

  allActions.forEach(action => {
    const actionDate = new Date(action.timestamp);
    const type = action.type.toLowerCase();
    
    if (!stats[type]) {
      stats[type] = { last7: 0, last30: 0, allTime: 0 };
    }
    
    stats[type].allTime++;
    stats.total.allTime++;
    
    if (actionDate >= thirtyDaysAgo) {
      stats[type].last30++;
      stats.total.last30++;
    }
    
    if (actionDate >= sevenDaysAgo) {
      stats[type].last7++;
      stats.total.last7++;
    }
  });

  return stats;
};

moderationActionSchema.statics.getModeratorStatistics = async function(moderatorId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const moderatorActions = await this.find({ moderatorId });
  
  const stats = {
    mute: { last7: 0, last30: 0, allTime: 0 },
    ban: { last7: 0, last30: 0, allTime: 0 },
    kick: { last7: 0, last30: 0, allTime: 0 },
    warn: { last7: 0, last30: 0, allTime: 0 },
    unban: { last7: 0, last30: 0, allTime: 0 },
    unmute: { last7: 0, last30: 0, allTime: 0 },
    total: { last7: 0, last30: 0, allTime: 0 }
  };

  moderatorActions.forEach(action => {
    const actionDate = new Date(action.timestamp);
    const type = action.type.toLowerCase();
    
    if (!stats[type]) {
      stats[type] = { last7: 0, last30: 0, allTime: 0 };
    }
    
    stats[type].allTime++;
    stats.total.allTime++;
    
    if (actionDate >= thirtyDaysAgo) {
      stats[type].last30++;
      stats.total.last30++;
    }
    
    if (actionDate >= sevenDaysAgo) {
      stats[type].last7++;
      stats.total.last7++;
    }
  });

  return stats;
};

const ModerationAction = model('ModerationAction', moderationActionSchema);

module.exports = ModerationAction;