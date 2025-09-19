const db = require('../utils/jsonDB');
const { randomUUID } = require('crypto');

class BaseModel {
	constructor(collectionName) {
		this.collection = collectionName;
	}

	async create(data) {
		await this.validate(data);
		if (!data.id) data.id = randomUUID(); // Optional: handled by db too
		if (!data.createdAt) data.createdAt = new Date().toISOString();

		if (typeof this.onBeforeCreate === 'function') {
			await this.onBeforeCreate(data);
		}
		const result = await db.insert(this.collection, data);
		if (typeof this.onAfterCreate === 'function') {
			await this.onAfterCreate(result);
		}
		return result;
	}

	async find(query = {}, options = {}) {
		let results = await db.find(this.collection, query);
		const { limit, offset } = options;
		if (typeof offset === 'number') results = results.slice(offset);
		if (typeof limit === 'number') results = results.slice(0, limit);
		return results;
	}

	async findOne(query) {
		return await db.findOne(this.collection, query);
	}

	async findById(id) {
		return await this.findOne({ id });
	}

	async update(query, updateData) {
		if (typeof this.onBeforeUpdate === 'function') {
			await this.onBeforeUpdate(query, updateData);
		}
		const result = await db.update(this.collection, query, updateData);
		if (typeof this.onAfterUpdate === 'function') {
			await this.onAfterUpdate(result);
		}
		return result;
	}

	async updateById(id, updateData) {
		return await this.update({ id }, updateData);
	}

	async updateOrCreate(query, data) {
		const existing = await this.findOne(query);
		if (existing) return await this.update(query, data);
		return await this.create({ ...query, ...data });
	}

	async delete(query) {
		return await db.delete(this.collection, query);
	}

	async deleteById(id) {
		return await this.delete({ id });
	}

	async exists(query) {
		return await db.exists(this.collection, query);
	}

	async count(query = {}) {
		const results = await db.find(this.collection, query);
		return results.length;
	}

	async validate(_data) {
		// No-op by default; override in subclasses
	}

	get raw() {
		return db;
	}
}

module.exports = BaseModel;
