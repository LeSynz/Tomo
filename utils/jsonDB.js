const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

class JsonDB {
    constructor(dbPath = './data') {
        this.dbPath = path.resolve(dbPath);
        this.locks = {};
        this.cache = new Map();
        this.cacheTimeout = 30000;
        this.indexes = new Map();
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
        const cacheKey = collection;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return [...cached.data];
        }

        const filePath = path.join(this.dbPath, `${collection}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            this.cache.set(cacheKey, {
                data: parsed,
                timestamp: Date.now()
            });
            
            return parsed;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Read error (${collection}):`, error);
            }
            
            const emptyData = [];
            this.cache.set(cacheKey, {
                data: emptyData,
                timestamp: Date.now()
            });
            
            return emptyData;
        }
    }

    async write(collection, data) {
        const filePath = path.join(this.dbPath, `${collection}.json`);
        const tempPath = filePath + '.tmp';
        
        await fs.mkdir(this.dbPath, { recursive: true });
        
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
        await fs.rename(tempPath, filePath);
        
        this.cache.set(collection, {
            data: [...data],
            timestamp: Date.now()
        });
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
        
        const queryKeys = Object.keys(query);
        if (queryKeys.length === 1) {
            const key = queryKeys[0];
            const value = query[key];
            const indexKey = `${collection}:${key}`;
            
            if (this.indexes.has(indexKey)) {
                const index = this.indexes.get(indexKey);
                const results = index.get(value) || [];
                return results.filter(item => item[key] === value);
            }
        }
        
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

    async insertMany(collection, documents) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            const timestamp = new Date().toISOString();
            const newDocuments = documents.map(doc => ({
                ...doc,
                id: doc.id || randomUUID(),
                createdAt: timestamp
            }));
            data.push(...newDocuments);
            await this.write(collection, data);
            return newDocuments;
        });
    }

    async updateMany(collection, query, updateData) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            let updatedCount = 0;
            const timestamp = new Date().toISOString();
            
            for (let i = 0; i < data.length; i++) {
                const matches = Object.keys(query).every((key) => data[i][key] === query[key]);
                if (matches) {
                    data[i] = {
                        ...data[i],
                        ...updateData,
                        updatedAt: timestamp,
                    };
                    updatedCount++;
                }
            }
            
            if (updatedCount > 0) {
                await this.write(collection, data);
            }
            return updatedCount;
        });
    }

    clearCache(collection = null) {
        if (collection) {
            this.cache.delete(collection);
        } else {
            this.cache.clear();
        }
    }

    getCacheStats() {
        const stats = {
            size: this.cache.size,
            collections: Array.from(this.cache.keys()),
            memory: 0
        };
        
        for (const [key, value] of this.cache) {
            stats.memory += JSON.stringify(value.data).length;
        }
        
        return stats;
    }

    createIndex(collection, field) {
        return this.withLock(collection, async () => {
            const data = await this.read(collection);
            const indexKey = `${collection}:${field}`;
            const index = new Map();
            
            for (const item of data) {
                const value = item[field];
                if (value !== undefined) {
                    if (!index.has(value)) {
                        index.set(value, []);
                    }
                    index.get(value).push(item);
                }
            }
            
            this.indexes.set(indexKey, index);
            return index.size;
        });
    }

    dropIndex(collection, field) {
        const indexKey = `${collection}:${field}`;
        return this.indexes.delete(indexKey);
    }

    updateIndexes(collection, oldData, newData) {
        for (const [indexKey, index] of this.indexes) {
            if (indexKey.startsWith(`${collection}:`)) {
                const field = indexKey.split(':')[1];
                
                if (oldData && oldData[field] !== undefined) {
                    const oldItems = index.get(oldData[field]) || [];
                    const filteredItems = oldItems.filter(item => item.id !== oldData.id);
                    if (filteredItems.length === 0) {
                        index.delete(oldData[field]);
                    } else {
                        index.set(oldData[field], filteredItems);
                    }
                }
                
                if (newData && newData[field] !== undefined) {
                    if (!index.has(newData[field])) {
                        index.set(newData[field], []);
                    }
                    index.get(newData[field]).push(newData);
                }
            }
        }
    }
}

module.exports = new JsonDB();