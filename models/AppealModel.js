const BaseModel = require('./BaseModel');

class AppealModel extends BaseModel {
    constructor() {
        super('appeals');
    }

    async submitAppeal({ caseId, userId, reason, learned, comments, contact }) {
        const appeal = {
            caseId,
            userId,
            reason,
            learned,
            comments: comments || null,
            contact: contact || null,
            status: 'pending', // pending, approved, denied
            submittedAt: new Date().toISOString(),
            processedAt: null,
            processedBy: null
        };

        return await this.create(appeal);
    }

    async hasActivePendingAppeal(caseId, userId) {
        const existingAppeal = await this.findOne({ 
            caseId, 
            userId, 
            status: 'pending' 
        });
        return !!existingAppeal;
    }

    async getAppealHistory(userId) {
        return await this.find({ userId });
    }

    async getAppeal(caseId, userId) {
        return await this.findOne({ caseId, userId });
    }

    async updateAppealStatus(caseId, userId, status, processedBy) {
        return await this.update(
            { caseId, userId, status: 'pending' },
            { 
                status, 
                processedAt: new Date().toISOString(),
                processedBy
            }
        );
    }

    async getAllPendingAppeals() {
        return await this.find({ status: 'pending' });
    }
}

module.exports = new AppealModel();