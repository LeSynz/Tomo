const { Schema, model } = require('synz-db');

const appealSchema = new Schema({
  caseId: {
    type: 'string',
    required: true
  },
  userId: {
    type: 'string',
    required: true
  },
  reason: {
    type: 'string',
    required: true
  },
  learned: {
    type: 'string',
    required: true
  },
  comments: {
    type: 'string',
    default: null
  },
  contact: {
    type: 'string',
    default: null
  },
  status: {
    type: 'string',
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  submittedAt: {
    type: 'date',
    default: () => new Date()
  },
  processedAt: {
    type: 'date',
    default: null
  },
  processedBy: {
    type: 'string',
    default: null
  }
}, {
  timestamps: true
});

// Static methods
appealSchema.statics.submitAppeal = async function({ caseId, userId, reason, learned, comments, contact }) {
  const appeal = {
    caseId,
    userId,
    reason,
    learned,
    comments: comments || null,
    contact: contact || null,
    status: 'pending',
    submittedAt: new Date(),
    processedAt: null,
    processedBy: null
  };

  return await this.create(appeal);
};

appealSchema.statics.hasActivePendingAppeal = async function(caseId, userId) {
  const existingAppeal = await this.findOne({ 
    caseId, 
    userId, 
    status: 'pending' 
  });
  return !!existingAppeal;
};

appealSchema.statics.getAppealHistory = async function(userId) {
  return await this.find({ userId });
};

appealSchema.statics.getAppeal = async function(caseId, userId) {
  return await this.findOne({ caseId, userId });
};

appealSchema.statics.updateAppealStatus = async function(caseId, userId, status, processedBy) {
  const appeal = await this.findOne({ caseId, userId, status: 'pending' });
  if (appeal) {
    appeal.status = status;
    appeal.processedAt = new Date();
    appeal.processedBy = processedBy;
    return await appeal.save();
  }
  return null;
};

appealSchema.statics.getAllPendingAppeals = async function() {
  return await this.find({ status: 'pending' });
};

const Appeal = model('Appeal', appealSchema);

module.exports = Appeal;