const BaseModel = require('./BaseModel');
const UserModel = require('./UserModel');

class ModerationActionModel extends BaseModel {
    constructor() {
        super('moderation_actions');
    }

    async logAction({ type, userId, moderatorId, reason, duration }) {
        const caseId = await this.generateCaseId();

        const action = {
            type,
            userId,
            moderatorId,
            reason: reason || 'No reason provided',
            duration: duration || null,
            caseId,
            timestamp: new Date().toISOString()
        };

        const savedAction = await this.create(action);

        await UserModel.addCase(userId, caseId);

        return savedAction;
    }

    async generateCaseId() {
        const all = await this.find();
        const highestNum = all.reduce((max, action) => {
            const match = action.caseId.match(/^(\d+)$/);
            const num = match ? parseInt(match[1], 10) : -1;
            return Math.max(max, num);
        }, -1);

        const nextNum = highestNum + 1;
        return String(nextNum).padStart(4, '0');
    }

    async getUserCases(userId) {
        return await this.find({ userId });
    }

    async getUserWarnings(userId, guildId) {
        return await this.find({ userId, type: 'warn' });
    }

    async getCase(caseId) {
        return await this.findOne({ caseId });
    }

    async deleteCase(caseId) {
        return await this.delete({ caseId });
    }

    async updateCaseReason(caseId, newReason) {
        return await this.update({ caseId }, { reason: newReason });
    }

    async getStatistics() {
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
    }

    async getModeratorStatistics(moderatorId) {
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
    }
}

module.exports = new ModerationActionModel();