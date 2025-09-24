const { Schema, model } = require('synz-db');

const userNoteSchema = new Schema({
  userId: {
    type: 'string',
    required: true
  },
  moderatorId: {
    type: 'string',
    required: true
  },
  note: {
    type: 'string',
    required: true
  },
  timestamp: {
    type: 'date',
    default: () => new Date()
  },
  noteId: {
    type: 'string',
    unique: true,
    default: () => Date.now().toString()
  }
}, {
  timestamps: true
});

// Static methods
userNoteSchema.statics.addNote = async function(userId, moderatorId, note) {
  const noteData = {
    userId,
    moderatorId,
    note,
    timestamp: new Date(),
    noteId: Date.now().toString()
  };

  return await this.create(noteData);
};

userNoteSchema.statics.getUserNotes = async function(userId) {
  return await this.find({ userId });
};

userNoteSchema.statics.deleteNote = async function(noteId) {
  return await this.deleteMany({ noteId: noteId });
};

userNoteSchema.statics.getAllNotes = async function() {
  return await this.find();
};

const UserNote = model('UserNote', userNoteSchema);

module.exports = UserNote;