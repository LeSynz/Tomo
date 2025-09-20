const BaseModel = require('./BaseModel');

class UserNotesModel extends BaseModel {
    constructor() {
        super('user_notes');
    }

    async addNote(userId, moderatorId, note) {
        const noteData = {
            userId,
            moderatorId,
            note,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        };

        return await this.create(noteData);
    }

    async getUserNotes(userId) {
        return await this.find({ userId });
    }

    async deleteNote(noteId) {
        return await this.delete({ id: noteId });
    }

    async getAllNotes() {
        return await this.find();
    }
}

module.exports = new UserNotesModel();