const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

class JsonDB {
    constructor(dbPath = './data') {
        this.dbPath = path.resolve(dbPath);
        this.locks = {};
        this.ensureDataDir();
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(this.dbPath, { recursive: true });
        } catch (error) {
            console.error('Failed to create data directory:', error);
        }
    }

    async read(collection) {
        const filePath = path.join(this.dbPath, `${collection}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Read error (${collection}):`, error);
            }
            return [];
        }
    }

    async write(collection, data) {
        const filePath = path.join(this.dbPath, `${collection}.json`);
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
        await fs.rename(tempPath, filePath);
    }

    async withLock(collection, fn) {
        while (this.locks[collection]) {
            await this.locks[collection];
        }
        let resolveLock;
        this.locks[collection] = new Promise((res) => (resolveLock = res));
        try {
            return await fn();
        } finally {
            resolveLock();
            delete this.locks[collection];
        }
    }

    async find(collection, query = {}) {
        const data = await this.read(collection);
        if (Object.keys(query).length === 0) return data;
        return data.filter((item) =>
            Object.keys(query).every((key) => item[key] === query[key])
        );
    }

    async findOne(collection, query) {
        const results = await this.find(collection, query);
        return results[0] || null;
    }

    async insert(collection, document) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            document.id = document.id || randomUUID();
            document.createdAt = new Date().toISOString();
            data.push(document);
            await this.write(collection, data);
            return document;
        });
    }

    async update(collection, query, updateData) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            const index = data.findIndex((item) =>
                Object.keys(query).every((key) => item[key] === query[key])
            );
            if (index !== -1) {
                data[index] = {
                    ...data[index],
                    ...updateData,
                    updatedAt: new Date().toISOString(),
                };
                await this.write(collection, data);
                return data[index];
            }
            return null;
        });
    }

    async delete(collection, query) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            const filteredData = data.filter(
                (item) => !Object.keys(query).every((key) => item[key] === query[key])
            );
            await this.write(collection, filteredData);
            return data.length - filteredData.length;
        });
    }

    async exists(collection, query) {
        const item = await this.findOne(collection, query);
        return item !== null;
    }
}

module.exports = new JsonDB();