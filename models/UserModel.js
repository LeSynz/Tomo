const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
    constructor() {
        super('users');
    }

    async ensureUser(userId) {
        let user = await this.findById(userId);
        if (!user) {
            return this.create({ id: userId, createdAt: new Date().toISOString() });
        }
        return user;
    }

    async addCase(userId, caseId) {
        const user = await this.ensureUser(userId);
        const cases = user.cases || [];
        cases.push(caseId);
        return this.updateById(userId, { cases });
    }
}

module.exports = new UserModel();