const { Schema, model } = require('synz-db');

const backupSchema = new Schema({
    channels: {
        type: 'array',
        default: [],
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', required: true },
                name: { type: 'string', required: true },
                type: { type: 'number', required: true },
                position: { type: 'number', required: true },
                permissions: {
                    type: 'array',
                    default: [],
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', required: true },
                            type: { type: 'number', required: true },
                            allow: { type: 'string', required: true },
                            deny: { type: 'string', required: true }
                        }
                    }
                },
                parentId: { type: 'string' }
            }
        }
    },
    roles: {
        type: 'array',
        default: [],
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', required: true },
                name: { type: 'string', required: true },
                permissions: { type: 'array', default: [] },
                position: { type: 'number' },
                color: { type: 'number' }
            }
        }
    },
    createdAt: {
        type: 'date',
        default: () => new Date()
    }
}, {
    timestamps: true
});

// static stuff

backupSchema.statics.createBackup = async function (channels, roles) {
    const count = await this.countDocuments();
    if (count >= 3) {
        const oldestArr = await this.find({}, { sort: { createdAt: 1 }, limit: 1 });
        const oldest = oldestArr[0];
        if (oldest) {
            await this.findByIdAndDelete(oldest.id || oldest._id);
        }
    }
    return await this.create({ channels, roles, createdAt: new Date() });
};

backupSchema.statics.getBackups = async function () {
    return await this.find({});
};

backupSchema.statics.getBackupById = async function (backupId) {
    return await this.findById(backupId);
};

backupSchema.statics.deleteBackup = async function (backupId) {
    return await this.findByIdAndDelete(backupId);
};

const Backup = model('Backup', backupSchema);

module.exports = Backup;