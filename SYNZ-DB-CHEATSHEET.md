# synz-db Complete Cheat Sheet

🚀 **The Ultimate Reference for synz-db v1.2.0** - A lightweight JSON database with MongoDB-style queries and zero dependencies.

## Table of Contents

- [🚀 Quick Start](#-quick-start)
- [📋 Schema Definition](#-schema-definition)
- [🎭 Model Creation](#-model-creation)
- [📊 Basic Operations](#-basic-operations)
- [🔍 MongoDB-Style Queries](#-mongodb-style-queries)
- [🛠️ Query Builder](#️-query-builder)
- [⚡ Advanced Features](#-advanced-features)
- [🏃‍♂️ Performance Tips](#️-performance-tips)
- [💡 Real-World Examples](#-real-world-examples)
- [🛡️ Best Practices](#️-best-practices)

---

## 🚀 Quick Start

```javascript
const { JsonDB, Model, Schema, QueryBuilder } = require('synz-db');

// Initialize database
const db = new JsonDB('./data');

// Define schema with validation
const userSchema = new Schema({
  username: { type: 'string', required: true, unique: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true, minLength: 8 },
  age: { type: 'number', min: 0, max: 120 },
  role: { type: 'string', enum: ['user', 'admin', 'moderator'], default: 'user' },
  tags: { type: 'array', maxLength: 10 },
  profile: {
    type: 'object',
    properties: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true }
    }
  },
  isActive: { type: 'boolean', default: true },
  createdAt: { type: 'date', default: () => new Date() }
});

// Create model
const User = new Model('User', userSchema, db);

// Basic operations
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secure123',
  age: 25,
  profile: { firstName: 'John', lastName: 'Doe' }
});

// MongoDB-style queries
const adults = await User.find({ age: { $gte: 18 } });
const admins = await User.find({ role: { $in: ['admin', 'moderator'] } });

// Query Builder (fluent API)
const query = QueryBuilder.create()
  .gte('age', 18)
  .in('role', ['user', 'premium'])
  .exists('email')
  .contains('tags', 'developer')
  .build();

const results = await User.find(query);
```

---

## 📋 Schema Definition

### Field Types & Validation

```javascript
const schema = new Schema({
  // String field with validation
  username: {
    type: 'string',
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 20
  },
  
  // Number field with constraints
  age: {
    type: 'number',
    min: 0,
    max: 120,
    required: true
  },
  
  // Boolean field with default
  isActive: {
    type: 'boolean',
    default: true
  },
  
  // Array field with constraints
  tags: {
    type: 'array',
    minLength: 1,
    maxLength: 10,
    default: []
  },
  
  // Date field with default
  createdAt: {
    type: 'date',
    default: () => new Date()
  },
  
  // Enum field
  role: {
    type: 'string',
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  // Nested object with properties
  profile: {
    type: 'object',
    properties: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
      bio: { type: 'string', maxLength: 500 },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string', default: 'US' }
        }
      }
    }
  }
});
```

### All Validation Options

```javascript
{
  // Basic validation
  type: 'string|number|boolean|array|object|date',
  required: true,
  unique: true,
  default: value | () => value,
  
  // String validation
  minLength: 3,
  maxLength: 100,
  
  // Number validation  
  min: 0,
  max: 100,
  
  // Array validation
  minLength: 1,    // minimum array length
  maxLength: 10,   // maximum array length
  
  // Enum validation
  enum: ['value1', 'value2', 'value3']
}
```

---

## 🎭 Model Creation

```javascript
// Basic model creation
const User = new Model('User', userSchema, db);

// Model with custom data directory
const Post = new Model('Post', postSchema, db, './custom-data');

// Multiple models sharing same database
const Product = new Model('Product', productSchema, db);
const Order = new Model('Order', orderSchema, db);
```

---

## 📊 Basic Operations

### Create Operations

```javascript
// Create single document
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secure123',
  age: 25
});

// Create multiple documents
const users = await User.createMany([
  { username: 'alice', email: 'alice@example.com', password: 'pass123', age: 30 },
  { username: 'bob', email: 'bob@example.com', password: 'pass456', age: 22 },
  { username: 'charlie', email: 'charlie@example.com', password: 'pass789', age: 28 }
]);

// Insert with batch operations (alias for createMany)
const moreUsers = await User.insertMany(userData);
```

### Find Operations

```javascript
// Find all documents
const allUsers = await User.find();

// Find with simple query
const activeUsers = await User.find({ isActive: true });

// Find with MongoDB-style operators
const adults = await User.find({ age: { $gte: 18 } });

// Find with multiple conditions
const adminUsers = await User.find({
  role: 'admin',
  isActive: true,
  age: { $gte: 21 }
});

// Find one document
const user = await User.findOne({ username: 'john_doe' });

// Find by ID
const user = await User.findById('user123');

// Check if document exists
const exists = await User.exists({ email: 'john@example.com' });

// Count documents
const userCount = await User.count({ isActive: true });
```

### Update Operations

```javascript
// Update single document
const result = await User.updateOne(
  { username: 'john_doe' },
  { $set: { age: 26, lastLogin: new Date() } }
);

// Update multiple documents
const result = await User.updateMany(
  { role: 'user' },
  { $set: { isActive: false } }
);

// Find and update (returns updated document)
const user = await User.findOneAndUpdate(
  { username: 'john_doe' },
  { $inc: { loginCount: 1 } },
  { returnNew: true }
);

// Increment/decrement values
await User.updateOne(
  { _id: userId },
  { $inc: { score: 10, attempts: 1 } }
);

// Array operations
await User.updateOne(
  { _id: userId },
  { 
    $push: { tags: 'new-tag' },
    $pull: { tags: 'old-tag' }
  }
);
```

### Delete Operations

```javascript
// Delete single document
const result = await User.deleteOne({ username: 'john_doe' });

// Delete multiple documents
const result = await User.deleteMany({ isActive: false });

// Find and delete (returns deleted document)
const deletedUser = await User.findOneAndDelete({ username: 'john_doe' });

// Delete all documents (careful!)
await User.deleteMany({});
```

### Query Options

```javascript
// Pagination
const users = await User.find(
  { isActive: true },
  { 
    limit: 20,      // Limit results
    offset: 40,     // Skip first 40 results
    sort: { age: -1, username: 1 }  // Sort by age desc, then username asc
  }
);

// Field projection
const users = await User.find(
  { role: 'user' },
  { 
    projection: { 
      username: 1,
      email: 1,
      password: 0    // Exclude password field
    }
  }
);

// Combined options
const results = await User.find(
  { isActive: true },
  { 
    limit: 50,
    offset: 0,
    sort: { createdAt: -1 },
    projection: { password: 0, internalNotes: 0 }
  }
);
```

---

## 🔍 MongoDB-Style Queries

### Comparison Operators

```javascript
// Equality
await User.find({ age: 25 });                    // age equals 25
await User.find({ age: { $eq: 25 } });          // explicit equality

// Inequality  
await User.find({ age: { $ne: 25 } });          // age not equal to 25

// Numeric comparisons
await User.find({ age: { $gt: 18 } });          // age greater than 18
await User.find({ age: { $gte: 18 } });         // age greater than or equal to 18
await User.find({ age: { $lt: 65 } });          // age less than 65
await User.find({ age: { $lte: 65 } });         // age less than or equal to 65

// Range queries
await User.find({ 
  age: { $gte: 18, $lte: 65 }                   // age between 18 and 65
});

// Array membership
await User.find({ role: { $in: ['admin', 'moderator'] } });      // role in array
await User.find({ status: { $nin: ['banned', 'suspended'] } });  // role not in array
```

### Logical Operators

```javascript
// AND (implicit - all conditions must match)
await User.find({ 
  age: { $gte: 18 }, 
  isActive: true,
  role: 'user'
});

// AND (explicit)
await User.find({
  $and: [
    { age: { $gte: 18 } },
    { isActive: true },
    { role: { $ne: 'banned' } }
  ]
});

// OR (any condition can match)
await User.find({
  $or: [
    { role: 'admin' },
    { age: { $gte: 65 } },
    { isVip: true }
  ]
});

// NOR (none of the conditions should match)
await User.find({
  $nor: [
    { role: 'banned' },
    { isActive: false },
    { age: { $lt: 13 } }
  ]
});

// NOT (negates the condition)
await User.find({
  age: { $not: { $lt: 18 } }    // age is NOT less than 18 (so >= 18)
});

// Complex logical combinations
await User.find({
  $and: [
    {
      $or: [
        { role: 'admin' },
        { role: 'moderator' }
      ]
    },
    { isActive: true },
    { 
      $nor: [
        { status: 'suspended' },
        { status: 'banned' }
      ]
    }
  ]
});
```

### Field Operators

```javascript
// Field existence
await User.find({ email: { $exists: true } });      // has email field
await User.find({ phone: { $exists: false } });     // no phone field

// Type checking
await User.find({ age: { $type: 'number' } });      // age is a number
await User.find({ tags: { $type: 'array' } });      // tags is an array
await User.find({ profile: { $type: 'object' } });  // profile is an object

// Regular expressions
await User.find({ email: { $regex: '^admin@' } });              // starts with admin@
await User.find({ username: { $regex: 'test', $options: 'i' } }); // case insensitive

// Array operations
await User.find({ tags: { $size: 3 } });                        // exactly 3 tags
await User.find({ skills: { $all: ['javascript', 'nodejs'] } }); // has all skills

// Element matching (for arrays of objects)
await User.find({
  projects: {
    $elemMatch: {
      status: 'completed',
      priority: 'high'
    }
  }
});
```

### Nested Field Queries

```javascript
// Dot notation for nested fields
await User.find({ 'profile.firstName': 'John' });
await User.find({ 'profile.address.city': 'New York' });
await User.find({ 'settings.theme': 'dark' });

// Nested object queries
await User.find({
  'profile.address': {
    city: 'New York',
    state: 'NY'
  }
});

// Multiple nested conditions
await User.find({
  'profile.verified': true,
  'profile.address.country': 'US',
  'settings.notifications.email': true
});
```

### Advanced Query Patterns

```javascript
// Complex business logic queries
const eligibleUsers = await User.find({
  $and: [
    // Must be active adult
    { isActive: true },
    { age: { $gte: 18 } },
    
    // Must have verified contact
    {
      $or: [
        { 'profile.emailVerified': true },
        { 'profile.phoneVerified': true }
      ]
    },
    
    // Must not be restricted
    {
      $nor: [
        { status: 'banned' },
        { status: 'suspended' },
        { 'flags.restricted': true }
      ]
    },
    
    // Additional criteria
    { role: { $in: ['user', 'premium', 'vip'] } },
    { lastActivity: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Last 30 days
  ]
});

// Search patterns
const searchQuery = await User.find({
  $or: [
    { username: { $regex: searchTerm, $options: 'i' } },
    { 'profile.firstName': { $regex: searchTerm, $options: 'i' } },
    { 'profile.lastName': { $regex: searchTerm, $options: 'i' } },
    { email: { $regex: searchTerm, $options: 'i' } }
  ]
});
```

---

## 🛠️ Query Builder

The QueryBuilder provides a fluent, chainable API for building complex queries programmatically.

### Basic Usage

```javascript
const { QueryBuilder } = require('synz-db');

// Simple query
const query = QueryBuilder.create()
  .where('age', 25)
  .where('isActive', true)
  .build();

// Equivalent to: { age: 25, isActive: true }
const users = await User.find(query);
```

### Comparison Methods

```javascript
const qb = QueryBuilder.create();

// Equality methods
qb.eq('name', 'John');           // { name: { $eq: 'John' } }
qb.where('name', 'John');        // Alias for eq()

// Inequality
qb.ne('status', 'deleted');      // { status: { $ne: 'deleted' } }

// Numeric comparisons
qb.gt('age', 18);               // { age: { $gt: 18 } }
qb.gte('age', 18);              // { age: { $gte: 18 } }
qb.lt('age', 65);               // { age: { $lt: 65 } }
qb.lte('age', 65);              // { age: { $lte: 65 } }

// Array membership
qb.in('role', ['admin', 'mod']); // { role: { $in: ['admin', 'mod'] } }
qb.nin('status', ['banned']);    // { status: { $nin: ['banned'] } }
```

### Field Operations

```javascript
const qb = QueryBuilder.create();

// Field existence
qb.exists('email');              // { email: { $exists: true } }
qb.exists('phone', false);       // { phone: { $exists: false } }

// Type checking  
qb.type('age', 'number');        // { age: { $type: 'number' } }

// Regular expressions
qb.regex('username', '^admin');   // { username: { $regex: '^admin' } }
qb.regex('email', '@gmail', 'i'); // { email: { $regex: '@gmail', $options: 'i' } }

// Array operations
qb.size('tags', 3);              // { tags: { $size: 3 } }
qb.all('skills', ['js', 'node']); // { skills: { $all: ['js', 'node'] } }

// Element matching
qb.elemMatch('projects', {        // { projects: { $elemMatch: {...} } }
  status: 'active',
  priority: 'high'
});
```

### Convenience Methods

```javascript
const qb = QueryBuilder.create();

// Range queries
qb.between('age', 18, 65);       // { age: { $gte: 18, $lte: 65 } }
qb.between('score', 80, 100);

// Text search helpers
qb.contains('bio', 'developer');  // { bio: { $regex: 'developer', $options: 'i' } }
qb.startsWith('name', 'John');    // { name: { $regex: '^John', $options: 'i' } }
qb.endsWith('email', '@gmail');   // { email: { $regex: '@gmail$', $options: 'i' } }

// Case-insensitive matching
qb.icontains('description', 'JavaScript');  // Case insensitive contains
qb.istartsWith('username', 'admin');        // Case insensitive starts with
qb.iendsWith('domain', '.com');             // Case insensitive ends with
```

### Logical Operations

```javascript
const qb = QueryBuilder.create();

// AND operations (default behavior)
qb.where('age', 25)
  .where('isActive', true);      // { age: 25, isActive: true }

// Explicit AND
qb.and([
  { age: { $gte: 18 } },
  { role: 'user' }
]);                              // { $and: [...] }

// OR operations
qb.or([
  { role: 'admin' },
  { age: { $gte: 65 } }
]);                              // { $or: [...] }

// NOR operations
qb.nor([
  { status: 'banned' },
  { isActive: false }
]);                              // { $nor: [...] }

// NOT operations
qb.not('age', { $lt: 18 });      // { age: { $not: { $lt: 18 } } }
```

### Method Chaining

```javascript
// Build complex queries with method chaining
const complexQuery = QueryBuilder.create()
  .gte('age', 18)                                    // Age >= 18
  .lte('age', 65)                                    // Age <= 65
  .in('role', ['user', 'premium'])                   // Role in array
  .exists('email')                                   // Has email
  .ne('status', 'banned')                            // Not banned
  .or([                                              // Either condition
    { 'profile.verified': true },
    { 'profile.premium': true }
  ])
  .contains('bio', 'developer')                      // Bio contains 'developer'
  .startsWith('username', 'pro')                     // Username starts with 'pro'
  .between('score', 80, 100)                         // Score between 80-100
  .build();

const results = await User.find(complexQuery);
```

### Advanced Patterns

```javascript
// Nested QueryBuilder for complex logic
const subQuery1 = QueryBuilder.create()
  .gte('age', 18)
  .lte('age', 25)
  .build();

const subQuery2 = QueryBuilder.create()  
  .gte('experience', 5)
  .in('skills', ['javascript', 'nodejs'])
  .build();

const mainQuery = QueryBuilder.create()
  .or([subQuery1, subQuery2])
  .where('isActive', true)
  .build();

// Conditional query building
function buildUserQuery(filters) {
  const qb = QueryBuilder.create();
  
  if (filters.minAge) qb.gte('age', filters.minAge);
  if (filters.maxAge) qb.lte('age', filters.maxAge);
  if (filters.roles?.length) qb.in('role', filters.roles);
  if (filters.active !== undefined) qb.where('isActive', filters.active);
  if (filters.search) {
    qb.or([
      { username: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ]);
  }
  
  return qb.build();
}

const query = buildUserQuery({
  minAge: 18,
  roles: ['user', 'premium'],
  active: true,
  search: 'john'
});
```

### QueryBuilder Utilities

```javascript
const qb = QueryBuilder.create()
  .where('age', 25)
  .where('role', 'admin');

// Clone query for reuse
const clonedQb = qb.clone()
  .where('isActive', true);

// Reset query
qb.reset();  // Clears all conditions

// Merge with another query
const anotherQuery = { status: 'verified' };
qb.merge(anotherQuery);

// Get current query state
const currentQuery = qb.build();
console.log(currentQuery);
```

---

## ⚡ Advanced Features

### Update Operators

```javascript
// Set field values
await User.updateOne({ _id: userId }, {
  $set: { 
    name: 'New Name',
    'profile.updated': new Date(),
    isActive: true
  }
});

// Increment/decrement numeric values
await User.updateOne({ _id: userId }, {
  $inc: { 
    loginCount: 1,      // Increment by 1
    score: -5,          // Decrement by 5
    'stats.points': 10  // Nested field increment
  }
});

// Array operations
await User.updateOne({ _id: userId }, {
  $push: { 
    tags: 'new-tag',
    'activity.logins': new Date()
  },
  $pull: { 
    tags: 'old-tag',
    'notifications.read': notificationId
  }
});

// Multiple update operations in one call
await User.updateOne({ _id: userId }, {
  $set: { lastLogin: new Date() },
  $inc: { loginCount: 1 },
  $push: { loginHistory: { date: new Date(), ip: userIP } },
  $pull: { expiredTokens: { expires: { $lt: new Date() } } }
});
```

### Aggregation Operations

```javascript
// Count documents with conditions
const activeUsers = await User.count({ isActive: true });
const adminCount = await User.count({ role: 'admin' });

// Get distinct values
const distinctRoles = await User.distinct('role');
const distinctCountries = await User.distinct('profile.address.country');

// Complex aggregation-style operations (coming in future versions)
// Note: Currently basic count and distinct are supported
```

### Data Types & Validation

```javascript
// Custom validation functions
const userSchema = new Schema({
  email: {
    type: 'string',
    required: true,
    validate: (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      return true;
    }
  },
  
  age: {
    type: 'number',
    validate: (age) => {
      if (age < 0 || age > 150) {
        throw new Error('Age must be between 0 and 150');
      }
      return true;
    }
  }
});

// Date handling
const eventSchema = new Schema({
  startDate: { type: 'date', required: true },
  endDate: { type: 'date' },
  createdAt: { type: 'date', default: () => new Date() },
  scheduledFor: { 
    type: 'date', 
    validate: (date) => date > new Date() // Must be future date
  }
});
```

---

## 🏃‍♂️ Performance Tips

### Query Optimization

```javascript
// ✅ Good: Use specific conditions
await User.find({ 
  isActive: true, 
  role: 'user' 
});

// ❌ Avoid: Overly broad queries without limits
await User.find({});  // Returns ALL users

// ✅ Better: Use pagination
await User.find({}, { limit: 100, offset: 0 });

// ✅ Good: Use field projection to limit data transfer
await User.find(
  { role: 'admin' },
  { projection: { username: 1, email: 1, role: 1 } }
);

// ✅ Good: Use QueryBuilder for complex queries (better readability and performance)
const optimizedQuery = QueryBuilder.create()
  .where('isActive', true)
  .in('role', ['user', 'premium'])
  .gte('lastLogin', recentDate)
  .build();
```

### Batch Operations

```javascript
// ✅ Good: Batch create operations
await User.createMany(userData);  // Single operation

// ❌ Avoid: Individual creates in loop
for (const data of userData) {
  await User.create(data);  // Multiple operations
}

// ✅ Good: Batch updates
await User.updateMany(
  { role: 'user' },
  { $set: { lastNotification: new Date() } }
);

// ✅ Good: Batch deletes
await User.deleteMany({ 
  isActive: false,
  lastLogin: { $lt: thirtyDaysAgo }
});
```

### Memory Management

```javascript
// For large datasets, use streaming or pagination
async function processAllUsers() {
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const users = await User.find(
      { isActive: true },
      { limit: batchSize, offset }
    );
    
    if (users.length === 0) break;
    
    // Process batch
    await processBatch(users);
    
    offset += batchSize;
  }
}

// Clear cache periodically for long-running processes
setInterval(() => {
  db.clearCache('users');  // Clear cache for specific collection
}, 300000); // Every 5 minutes
```

### Performance Monitoring

```javascript
// Monitor query performance
async function monitoredQuery(query, options = {}) {
  const start = Date.now();
  const results = await User.find(query, options);
  const duration = Date.now() - start;
  
  // Log slow queries
  if (duration > 100) {
    console.warn(`Slow query detected: ${duration}ms`, { query, options });
  }
  
  return results;
}

// Benchmark different query approaches
async function benchmarkQueries() {
  const testQuery = { age: { $gte: 18 }, isActive: true };
  
  // Direct MongoDB-style query
  console.time('MongoDB-style');
  const result1 = await User.find(testQuery);
  console.timeEnd('MongoDB-style');
  
  // QueryBuilder query  
  console.time('QueryBuilder');
  const result2 = await User.find(
    QueryBuilder.create()
      .gte('age', 18)
      .where('isActive', true)
      .build()
  );
  console.timeEnd('QueryBuilder');
}
```

---

## 💡 Real-World Examples

### User Management System

```javascript
const userSchema = new Schema({
  // Authentication
  username: { type: 'string', required: true, unique: true, minLength: 3, maxLength: 20 },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true, minLength: 8 },
  
  // Profile information
  profile: {
    type: 'object',
    properties: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
      avatar: { type: 'string' },
      bio: { type: 'string', maxLength: 500 },
      dateOfBirth: { type: 'date' },
      phone: { type: 'string' }
    }
  },
  
  // Account settings
  role: { type: 'string', enum: ['user', 'admin', 'moderator'], default: 'user' },
  isActive: { type: 'boolean', default: true },
  emailVerified: { type: 'boolean', default: false },
  
  // Preferences
  settings: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['light', 'dark'], default: 'light' },
      notifications: { type: 'boolean', default: true },
      privacy: { type: 'string', enum: ['public', 'private'], default: 'public' }
    }
  },
  
  // Activity tracking
  lastLogin: { type: 'date' },
  loginCount: { type: 'number', default: 0 },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date' }
});

const User = new Model('User', userSchema, db);

// User registration
async function registerUser(userData) {
  try {
    const user = await User.create({
      ...userData,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });
    
    console.log('User registered:', user._id);
    return user;
  } catch (error) {
    if (error.message.includes('unique')) {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

// User authentication
async function loginUser(email, password) {
  const user = await User.findOne({ email, password });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }
  
  // Update login tracking
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { lastLogin: new Date() },
      $inc: { loginCount: 1 }
    }
  );
  
  return user;
}

// Advanced user search
async function searchUsers(criteria) {
  const query = QueryBuilder.create();
  
  if (criteria.search) {
    query.or([
      { username: { $regex: criteria.search, $options: 'i' } },
      { 'profile.firstName': { $regex: criteria.search, $options: 'i' } },
      { 'profile.lastName': { $regex: criteria.search, $options: 'i' } },
      { email: { $regex: criteria.search, $options: 'i' } }
    ]);
  }
  
  if (criteria.role) query.where('role', criteria.role);
  if (criteria.isActive !== undefined) query.where('isActive', criteria.isActive);
  if (criteria.verified !== undefined) query.where('emailVerified', criteria.verified);
  
  return await User.find(query.build(), {
    limit: criteria.limit || 20,
    offset: criteria.offset || 0,
    sort: { createdAt: -1 },
    projection: { password: 0 }  // Never return passwords
  });
}
```

### E-commerce Product System

```javascript
const productSchema = new Schema({
  // Basic information
  name: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', maxLength: 2000 },
  sku: { type: 'string', required: true, unique: true },
  
  // Categorization
  category: { type: 'string', required: true },
  subcategory: { type: 'string' },
  brand: { type: 'string' },
  tags: { type: 'array', maxLength: 20 },
  
  // Pricing
  price: { type: 'number', required: true, min: 0 },
  salePrice: { type: 'number', min: 0 },
  currency: { type: 'string', default: 'USD' },
  
  // Inventory
  inventory: {
    type: 'object',
    properties: {
      quantity: { type: 'number', required: true, min: 0 },
      reserved: { type: 'number', default: 0, min: 0 },
      reorderLevel: { type: 'number', default: 10 },
      location: { type: 'string' }
    }
  },
  
  // Product details
  specifications: {
    type: 'object',
    properties: {
      weight: { type: 'number' },
      dimensions: {
        type: 'object',
        properties: {
          length: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      color: { type: 'string' },
      size: { type: 'string' },
      material: { type: 'string' }
    }
  },
  
  // Media
  images: { type: 'array', default: [] },
  videos: { type: 'array', default: [] },
  
  // Status
  status: { type: 'string', enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  featured: { type: 'boolean', default: false },
  
  // Timestamps
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date' }
});

const Product = new Model('Product', productSchema, db);

// Product search with filters
async function searchProducts(filters) {
  const query = QueryBuilder.create();
  
  // Basic filters
  query.where('status', 'active');
  
  if (filters.search) {
    query.or([
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: { $regex: filters.search, $options: 'i' } }
    ]);
  }
  
  if (filters.category) query.where('category', filters.category);
  if (filters.brand) query.where('brand', filters.brand);
  if (filters.minPrice) query.gte('price', filters.minPrice);
  if (filters.maxPrice) query.lte('price', filters.maxPrice);
  if (filters.inStock) query.gt('inventory.quantity', 0);
  if (filters.onSale) query.exists('salePrice');
  if (filters.featured) query.where('featured', true);
  
  return await Product.find(query.build(), {
    limit: filters.limit || 24,
    offset: filters.offset || 0,
    sort: filters.sort || { featured: -1, createdAt: -1 }
  });
}

// Inventory management
async function updateInventory(sku, quantityChange, reason) {
  const product = await Product.findOne({ sku });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const newQuantity = product.inventory.quantity + quantityChange;
  
  if (newQuantity < 0) {
    throw new Error('Insufficient inventory');
  }
  
  await Product.updateOne(
    { sku },
    { 
      $set: { 
        'inventory.quantity': newQuantity,
        updatedAt: new Date()
      }
    }
  );
  
  // Log inventory change
  console.log(`Inventory updated for ${sku}: ${quantityChange} (${reason})`);
  
  // Check for low stock alert
  if (newQuantity <= product.inventory.reorderLevel) {
    console.warn(`Low stock alert for ${sku}: ${newQuantity} remaining`);
  }
}

// Sales and promotions
async function getPromotionalProducts() {
  return await Product.find(
    QueryBuilder.create()
      .where('status', 'active')
      .exists('salePrice')
      .gt('inventory.quantity', 0)
      .or([
        { featured: true },
        { category: 'electronics' },
        { 'inventory.quantity': { $gte: 100 } }  // Overstock items
      ])
      .build(),
    {
      sort: { 
        featured: -1,
        salePrice: 1  // Cheapest sale items first
      },
      limit: 50
    }
  );
}
```

### Blog/Content Management System

```javascript
const postSchema = new Schema({
  // Content
  title: { type: 'string', required: true, maxLength: 200 },
  slug: { type: 'string', required: true, unique: true },
  content: { type: 'string', required: true },
  excerpt: { type: 'string', maxLength: 500 },
  
  // Author information
  author: { type: 'string', required: true },  // User ID
  authorName: { type: 'string' },              // Cached for performance
  
  // Categorization
  category: { type: 'string', required: true },
  tags: { type: 'array', maxLength: 10 },
  
  // Publishing
  status: { type: 'string', enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: { type: 'date' },
  scheduledFor: { type: 'date' },
  
  // SEO
  metaTitle: { type: 'string', maxLength: 60 },
  metaDescription: { type: 'string', maxLength: 160 },
  
  // Engagement
  views: { type: 'number', default: 0 },
  likes: { type: 'array', default: [] },       // Array of user IDs
  
  // Comments
  comments: {
    type: 'array',
    default: [],
    items: {
      type: 'object',
      properties: {
        author: { type: 'string', required: true },
        content: { type: 'string', required: true, maxLength: 1000 },
        createdAt: { type: 'date', default: () => new Date() },
        approved: { type: 'boolean', default: false }
      }
    }
  },
  
  // Media
  featuredImage: { type: 'string' },
  gallery: { type: 'array', default: [] },
  
  // Timestamps
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date' }
});

const Post = new Model('Post', postSchema, db);

// Content publishing
async function publishPost(postId) {
  const result = await Post.updateOne(
    { _id: postId, status: 'draft' },
    {
      $set: {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
  
  if (result.modifiedCount === 0) {
    throw new Error('Post not found or already published');
  }
  
  console.log('Post published:', postId);
}

// Content discovery
async function getPublishedPosts(filters = {}) {
  const query = QueryBuilder.create()
    .where('status', 'published')
    .lte('publishedAt', new Date());  // Don't show future-dated posts
  
  if (filters.category) query.where('category', filters.category);
  if (filters.author) query.where('author', filters.author);
  if (filters.tags?.length) query.in('tags', filters.tags);
  if (filters.search) {
    query.or([
      { title: { $regex: filters.search, $options: 'i' } },
      { content: { $regex: filters.search, $options: 'i' } },
      { tags: { $regex: filters.search, $options: 'i' } }
    ]);
  }
  
  return await Post.find(query.build(), {
    sort: { publishedAt: -1 },
    limit: filters.limit || 20,
    offset: filters.offset || 0,
    projection: { 
      content: 0,  // Don't include full content in listings
      comments: 0  // Don't include comments in listings
    }
  });
}

// Popular content
async function getPopularPosts(timeframe = 30) {
  const sinceDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  return await Post.find(
    QueryBuilder.create()
      .where('status', 'published')
      .gte('publishedAt', sinceDate)
      .gt('views', 100)  // Minimum view threshold
      .build(),
    {
      sort: { views: -1, likes: -1 },
      limit: 10,
      projection: { title: 1, slug: 1, views: 1, likes: 1, publishedAt: 1, authorName: 1 }
    }
  );
}

// Comment management
async function addComment(postId, comment) {
  const result = await Post.updateOne(
    { _id: postId, status: 'published' },
    {
      $push: {
        comments: {
          ...comment,
          createdAt: new Date(),
          approved: false  // Require moderation
        }
      }
    }
  );
  
  if (result.modifiedCount === 0) {
    throw new Error('Post not found or not published');
  }
}
```

---

## 🛡️ Best Practices

### Schema Design

```javascript
// ✅ Good schema design
const userSchema = new Schema({
  // Use appropriate field types
  age: { type: 'number', min: 0, max: 150 },
  
  // Be specific with validation
  email: { 
    type: 'string', 
    required: true, 
    unique: true,
    validate: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },
  
  // Use enums for limited values
  status: { 
    type: 'string', 
    enum: ['active', 'inactive', 'pending'], 
    default: 'pending' 
  },
  
  // Set reasonable limits
  bio: { type: 'string', maxLength: 500 },
  tags: { type: 'array', maxLength: 10 },
  
  // Use nested objects for related data
  profile: {
    type: 'object',
    properties: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true }
    }
  }
});
```

### Error Handling

```javascript
// Comprehensive error handling
async function createUser(userData) {
  try {
    const user = await User.create(userData);
    return { success: true, user };
  } catch (error) {
    // Handle validation errors
    if (error.message.includes('required')) {
      return { 
        success: false, 
        error: 'Missing required fields',
        details: error.message 
      };
    }
    
    // Handle uniqueness violations
    if (error.message.includes('unique')) {
      return { 
        success: false, 
        error: 'Email or username already exists' 
      };
    }
    
    // Handle validation errors
    if (error.message.includes('validation')) {
      return { 
        success: false, 
        error: 'Invalid data format',
        details: error.message 
      };
    }
    
    // Log unexpected errors
    console.error('Unexpected error creating user:', error);
    return { 
      success: false, 
      error: 'Internal server error' 
    };
  }
}
```

### Security Considerations

```javascript
// Never expose sensitive data
const safeUserProjection = { 
  password: 0, 
  internalNotes: 0, 
  adminFlags: 0 
};

// Sanitize user input for queries
function sanitizeQuery(query) {
  // Remove potentially dangerous operations
  const dangerous = ['$where', '$eval'];
  
  function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (dangerous.includes(key)) continue;
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return sanitizeObject(query);
}

// Use QueryBuilder for user-generated queries (safer)
function buildUserSearchQuery(userInput) {
  return QueryBuilder.create()
    .where('isActive', true)
    .or([
      { username: { $regex: userInput, $options: 'i' } },
      { 'profile.firstName': { $regex: userInput, $options: 'i' } }
    ])
    .build();
}
```

### Testing Strategies

```javascript
// Unit tests for models
describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});  // Clean slate
  });
  
  it('should create user with valid data', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = await User.create(userData);
    expect(user._id).toBeDefined();
    expect(user.username).toBe('testuser');
  });
  
  it('should reject invalid email', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123'
    };
    
    await expect(User.create(userData)).rejects.toThrow('validation');
  });
});

// Performance testing
describe('Query Performance', () => {
  beforeAll(async () => {
    // Create test dataset
    const testUsers = Array.from({ length: 1000 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@test.com`,
      password: 'password123',
      age: 18 + (i % 50)
    }));
    
    await User.createMany(testUsers);
  });
  
  it('should handle large result sets efficiently', async () => {
    const start = Date.now();
    const users = await User.find({ age: { $gte: 25 } });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);  // Should complete in under 100ms
  });
});
```

### Monitoring and Logging

```javascript
// Query performance monitoring
class PerformanceMonitor {
  static logSlowQuery(query, duration, resultCount) {
    if (duration > 100) {
      console.warn('Slow query detected:', {
        query: JSON.stringify(query),
        duration: `${duration}ms`,
        results: resultCount,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Wrap database operations with monitoring
async function monitoredFind(model, query, options = {}) {
  const start = Date.now();
  const results = await model.find(query, options);
  const duration = Date.now() - start;
  
  PerformanceMonitor.logSlowQuery(query, duration, results.length);
  
  return results;
}

// Database health checks
async function healthCheck() {
  try {
    const userCount = await User.count({});
    const recentUsers = await User.count({ 
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });
    
    return {
      status: 'healthy',
      totalUsers: userCount,
      newUsersToday: recentUsers,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## 📚 API Reference Quick Links

### Core Classes
- **JsonDB**: `new JsonDB(dataPath)`
- **Model**: `new Model(name, schema, database)`
- **Schema**: `new Schema(definition, options)`
- **QueryBuilder**: `QueryBuilder.create()`

### Model Methods
```javascript
// Create
Model.create(data)
Model.createMany(dataArray)
Model.insertMany(dataArray)

// Read
Model.find(query, options)
Model.findOne(query, options)
Model.findById(id)
Model.count(query)
Model.exists(query)
Model.distinct(field)

// Update
Model.updateOne(query, update)
Model.updateMany(query, update)
Model.findOneAndUpdate(query, update, options)

// Delete
Model.deleteOne(query)
Model.deleteMany(query)
Model.findOneAndDelete(query)
```

### QueryBuilder Methods
```javascript
// Comparison
.eq() .ne() .gt() .gte() .lt() .lte()
.in() .nin() .between()

// Field
.exists() .type() .regex() .size() .all()

// Text
.contains() .startsWith() .endsWith()

// Logical
.and() .or() .nor() .not()

// Utilities
.build() .reset() .clone() .merge()
```

---

## 🔗 Additional Resources

- **Package**: `npm install synz-db`
- **GitHub**: https://github.com/LeSynz/synz-db
- **Performance Benchmarks**: See `/test-project/tests/performance-test.js`
- **Version**: 1.2.0
- **License**: MIT

---

**🎯 This cheat sheet covers synz-db v1.2.0 with complete MongoDB-style query operators, QueryBuilder fluent API, and comprehensive validation system. Performance tested up to 10k records with excellent results!**

*Happy coding with synz-db! 🚀*

## 🚀 Quick Start

```javascript
const { Schema, model, connect } = require('synz-db');

// Connect to database
connect('./data');

// Define schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  age: { type: Number, min: 0 }
});

// Create model
const User = model('User', userSchema);
```

---

## 📋 Schema Definition

### **Basic Types**
```javascript
const schema = new Schema({
  // String types
  name: String,
  username: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  
  // Number types
  age: Number,
  score: { type: Number, min: 0, max: 100 },
  
  // Boolean types
  isActive: Boolean,
  verified: { type: Boolean, default: false },
  
  // Date types
  birthDate: Date,
  createdAt: { type: Date, default: Date.now },
  
  // Array types
  tags: [String],
  scores: [Number],
  hobbies: { type: Array, default: [] },
  
  // Object types
  profile: {
    bio: String,
    website: String,
    location: String
  },
  settings: Object
});
```

### **Schema Options**
```javascript
const schema = new Schema({
  name: String,
  email: String
}, {
  timestamps: true  // Adds createdAt and updatedAt
});
```

### **Field Validations**
```javascript
const schema = new Schema({
  // String validations
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 20,
    trim: true,
    lowercase: true,
    match: /^[a-zA-Z0-9_]+$/
  },
  
  // Number validations
  age: {
    type: Number,
    min: 0,
    max: 150,
    required: true
  },
  
  // Enum validation
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  // Array validations
  tags: {
    type: Array,
    minlength: 1,
    maxlength: 5
  },
  
  // Custom validation
  email: {
    type: String,
    validate: function(email) {
      if (!email.includes('@')) {
        return 'Invalid email format';
      }
      return true;
    }
  }
});
```

### **Transforms**
```javascript
const schema = new Schema({
  name: { type: String, trim: true },           // Remove whitespace
  email: { type: String, lowercase: true },     // Convert to lowercase
  code: { type: String, uppercase: true }       // Convert to uppercase
});
```

---

## 🎭 Virtual Properties

```javascript
const userSchema = new Schema({
  firstName: String,
  lastName: String,
  birthDate: Date
});

// Define virtual properties
userSchema.virtual('fullName', function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age', function() {
  return new Date().getFullYear() - this.birthDate.getFullYear();
});

// Usage
const user = await User.findOne({ firstName: 'John' });
console.log(user.fullName); // "John Doe"
console.log(user.age);      // 25
```

---

## 🪝 Middleware

### **Pre Middleware**
```javascript
// Runs before save
userSchema.pre('save', function() {
  console.log('About to save:', this.name);
  // Hash password, validate data, etc.
});

// Runs before remove
userSchema.pre('remove', function() {
  console.log('About to remove:', this.name);
  // Cleanup related data, log action, etc.
});
```

### **Post Middleware**
```javascript
// Runs after save
userSchema.post('save', function() {
  console.log('Saved user:', this.name);
  // Send email, update cache, etc.
});

// Runs after remove
userSchema.post('remove', function() {
  console.log('Removed user:', this.name);
  // Log action, cleanup, etc.
});
```

---

## 🔧 Static Methods

```javascript
// Define static methods on schema
userSchema.statics.findByRole = async function(role) {
  return await this.find({ role });
};

userSchema.statics.getActiveUsers = async function() {
  return await this.find({ isActive: true });
};

userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user && user.password === password) {
    return user;
  }
  throw new Error('Invalid credentials');
};

// Usage
const admins = await User.findByRole('admin');
const activeUsers = await User.getActiveUsers();
const user = await User.login('john@example.com', 'password123');
```

---

## 📊 Model Operations

### **Create Documents**
```javascript
// Create single document
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
});

// Create with new + save
const user = new User({
  name: 'Jane Doe',
  email: 'jane@example.com'
});
await user.save();

// Create multiple documents
const users = await User.insertMany([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);
```

### **Find Documents**
```javascript
// Find all
const allUsers = await User.find();

// Find with conditions
const adults = await User.find({ age: { $gte: 18 } });

// Find one
const user = await User.findOne({ email: 'john@example.com' });

// Find by ID
const user = await User.findById('user-id-123');

// Check if exists
const exists = await User.exists({ email: 'john@example.com' });

// Count documents
const count = await User.countDocuments({ isActive: true });
```

### **Update Documents**
```javascript
// Update single document
const user = await User.findById('user-id');
user.age = 26;
await user.save();

// Find and update
const user = await User.findByIdAndUpdate('user-id', { age: 26 });

// Update many documents
const updateCount = await User.updateMany(
  { role: 'user' },
  { isActive: false }
);
```

### **Delete Documents**
```javascript
// Delete single document
const user = await User.findById('user-id');
await user.remove();

// Find and delete
const deleted = await User.findByIdAndDelete('user-id');

// Delete many documents
const deleteCount = await User.deleteMany({ isActive: false });
```

---

## 🔍 MongoDB-Style Queries

### **Comparison Operators**
```javascript
// Equality
await User.find({ age: 25 });                    // age equals 25
await User.find({ age: { $eq: 25 } });          // same as above
await User.find({ age: { $ne: 25 } });          // age not equals 25

// Comparison
await User.find({ age: { $gt: 18 } });          // age greater than 18
await User.find({ age: { $gte: 18 } });         // age greater than or equal 18
await User.find({ age: { $lt: 65 } });          // age less than 65
await User.find({ age: { $lte: 65 } });         // age less than or equal 65

// Array membership
await User.find({ role: { $in: ['admin', 'moderator'] } });     // role in array
await User.find({ role: { $nin: ['banned', 'suspended'] } });   // role not in array
```

### **Logical Operators**
```javascript
// AND (implicit)
await User.find({ age: { $gte: 18 }, isActive: true });

// AND (explicit)
await User.find({
  $and: [
    { age: { $gte: 18 } },
    { isActive: true }
  ]
});

// OR
await User.find({
  $or: [
    { age: { $lt: 18 } },
    { role: 'admin' }
  ]
});

// NOR (none of the conditions)
await User.find({
  $nor: [
    { age: { $lt: 18 } },
    { role: 'banned' }
  ]
});

// NOT
await User.find({
  age: { $not: { $lt: 18 } }
});
```

### **Element Operators**
```javascript
// Field exists
await User.find({ email: { $exists: true } });      // has email field
await User.find({ phone: { $exists: false } });     // no phone field

// Type checking
await User.find({ age: { $type: 'number' } });      // age is number
await User.find({ tags: { $type: 'array' } });      // tags is array
```

### **Array Operators**
```javascript
// Array size
await User.find({ tags: { $size: 3 } });            // exactly 3 tags

// All elements
await User.find({ tags: { $all: ['js', 'node'] } }); // has both tags

// Element match (for array of objects)
await User.find({
  projects: {
    $elemMatch: { status: 'completed', priority: 'high' }
  }
});
```

### **Evaluation Operators**
```javascript
// Regular expressions
await User.find({ email: { $regex: /gmail\.com$/ } });        // ends with gmail.com
await User.find({ name: { $regex: /^john/i } });              // starts with john (case insensitive)
```

### **Complex Queries**
```javascript
// Complex nested query
const users = await User.find({
  $and: [
    {
      $or: [
        { age: { $gte: 18, $lt: 65 } },
        { role: 'admin' }
      ]
    },
    { isActive: true },
    { email: { $exists: true } }
  ]
});

// Range query
const users = await User.find({
  age: { $gte: 25, $lte: 35 },
  role: { $in: ['user', 'premium'] }
});
```

---

## 🛠️ QueryBuilder

**Fluent API for building complex queries**

```javascript
const { QueryBuilder } = require('synz-db');

// Basic usage
const query = QueryBuilder.create()
  .gte('age', 18)
  .in('role', ['user', 'admin'])
  .exists('email')
  .build();

const users = await User.find(query);

// Comparison methods
QueryBuilder.create()
  .eq('name', 'John')           // equals
  .ne('status', 'banned')       // not equals
  .gt('score', 100)             // greater than
  .gte('age', 18)               // greater than or equal
  .lt('price', 50)              // less than
  .lte('rating', 5)             // less than or equal
  .between('age', 18, 65)       // between values
  .build();

// Array methods
QueryBuilder.create()
  .in('role', ['admin', 'mod'])           // in array
  .nin('status', ['banned', 'deleted'])   // not in array
  .size('tags', 3)                        // array size
  .all('skills', ['js', 'node'])          // has all elements
  .build();

// Text search
QueryBuilder.create()
  .contains('description', 'javascript')   // contains text
  .startsWith('name', 'John')             // starts with
  .endsWith('email', '@gmail.com')        // ends with
  .regex('phone', /^\+1/, 'i')            // regex pattern
  .build();

// Logical operators
QueryBuilder.create()
  .and(
    { age: { $gte: 18 } },
    { isActive: true }
  )
  .or(
    { role: 'admin' },
    { role: 'moderator' }
  )
  .build();

// Advanced usage
const complexQuery = QueryBuilder.create()
  .or(
    QueryBuilder.create().lt('age', 18).build(),
    QueryBuilder.create()
      .gte('age', 18)
      .in('role', ['admin', 'moderator'])
      .build()
  )
  .exists('email')
  .ne('status', 'banned')
  .build();
```

---

## 🗃️ Database Operations

### **Connection**
```javascript
const { connect } = require('synz-db');

// Connect to database
connect('./data');              // Local folder
connect('/path/to/db');         // Absolute path
connect('../shared/data');      // Relative path
```

### **Indexing**
```javascript
// Create index for faster queries
await User.createIndex('email');       // Index on email field
await User.createIndex('role');        // Index on role field

// Drop index
User.dropIndex('email');               // Remove email index
```

### **Cache Management**
```javascript
const { JsonDB } = require('synz-db');
const db = new JsonDB();

// Clear cache for specific collection
db.clearCache('users');

// Clear all cache
db.clearCache();

// Get cache statistics
const stats = db.getCacheStats();
console.log(stats); // { size: 10, collections: ['users', 'posts'] }
```

---

## 🏃‍♂️ Performance Tips

### **Indexing Strategy**
```javascript
// Index frequently queried fields
await User.createIndex('email');       // For login queries
await User.createIndex('role');        // For role-based queries
await User.createIndex('createdAt');   // For date range queries
```

### **Query Optimization**
```javascript
// Good: Specific queries
await User.find({ email: 'john@example.com' });

// Good: Use indexes
await User.find({ role: 'admin' });  // If role is indexed

// Avoid: Large result sets without limits
await User.find({});  // Returns all users

// Better: Use pagination concepts
const recentUsers = await User.find({ 
  createdAt: { $gte: new Date('2024-01-01') } 
});
```

### **Bulk Operations**
```javascript
// Efficient: Bulk insert
await User.insertMany([...users]);

// Efficient: Bulk update
await User.updateMany({ role: 'user' }, { isActive: true });

// Efficient: Bulk delete
await User.deleteMany({ lastLogin: { $lt: oldDate } });
```

---

## 🛡️ Error Handling

```javascript
try {
  // Schema validation errors
  const user = await User.create({
    email: 'invalid-email'  // Will throw validation error
  });
} catch (error) {
  console.log('Validation failed:', error.message);
  // "Validation failed: Field 'email' does not match required pattern"
}

try {
  // Middleware errors
  userSchema.pre('save', function() {
    if (this.age < 0) {
      throw new Error('Age cannot be negative');
    }
  });
  
  await user.save();
} catch (error) {
  console.log('Middleware error:', error.message);
}

// Check for document existence
const user = await User.findById('non-existent-id');
if (!user) {
  console.log('User not found');
}
```

---

## 📝 Complete Example

```javascript
const { Schema, model, connect, QueryBuilder } = require('synz-db');

// Connect to database
connect('./data');

// Define schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 20,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  age: {
    type: Number,
    min: 13,
    max: 120
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  profile: {
    bio: String,
    website: String,
    location: String
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Virtual properties
userSchema.virtual('profileSummary', function() {
  return `${this.username} (${this.email}) - ${this.role}`;
});

// Middleware
userSchema.pre('save', function() {
  console.log('Saving user:', this.username);
});

// Static methods
userSchema.statics.findByRole = async function(role) {
  return await this.find({ role });
};

userSchema.statics.searchUsers = async function(searchTerm) {
  return await this.find({
    $or: [
      { username: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } }
    ]
  });
};

// Create model
const User = model('User', userSchema);

async function example() {
  // Create users
  const users = await User.insertMany([
    {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'secret123',
      age: 25,
      tags: ['developer', 'javascript']
    },
    {
      username: 'janedoe',
      email: 'jane@example.com',
      password: 'secret456',
      age: 30,
      role: 'admin',
      tags: ['manager', 'leadership']
    }
  ]);

  // Query examples
  const adults = await User.find({ age: { $gte: 18 } });
  const admins = await User.findByRole('admin');
  
  // Complex query with QueryBuilder
  const activeDevs = await User.find(
    QueryBuilder.create()
      .eq('isActive', true)
      .contains('tags', 'developer')
      .gte('age', 18)
      .build()
  );

  // Update operations
  await User.updateMany(
    { role: 'user' },
    { lastLoginReminder: new Date() }
  );

  // Search functionality
  const searchResults = await User.searchUsers('john');
  
  console.log('Created users:', users.length);
  console.log('Adults:', adults.length);
  console.log('Admins:', admins.length);
  console.log('Active developers:', activeDevs.length);
  console.log('Search results:', searchResults.length);
}

example().catch(console.error);
```

---

## 🔧 Configuration

### **Schema Configuration**
```javascript
const schema = new Schema(definition, {
  timestamps: true,        // Add createdAt/updatedAt fields
  // More options may be added in future versions
});
```

### **Database Configuration**
```javascript
const { JsonDB } = require('synz-db');

// Custom database instance
const db = new JsonDB('./custom-path');

// Configure cache timeout (default: 30 seconds)
db.cacheTimeout = 60000;  // 1 minute

// Get database statistics
const stats = db.getCacheStats();
```

---

## 📚 API Reference Summary

### **Schema Methods**
- `new Schema(definition, options)`
- `schema.virtual(name, getter)`
- `schema.pre(method, fn)`
- `schema.post(method, fn)`

### **Model Static Methods**
- `Model.create(data)`
- `Model.find(query)`
- `Model.findOne(query)`
- `Model.findById(id)`
- `Model.findByIdAndUpdate(id, data)`
- `Model.findByIdAndDelete(id)`
- `Model.updateMany(query, data)`
- `Model.deleteMany(query)`
- `Model.insertMany(documents)`
- `Model.countDocuments(query)`
- `Model.exists(query)`
- `Model.createIndex(field)`
- `Model.dropIndex(field)`

### **Model Instance Methods**
- `doc.save()`
- `doc.remove()`
- `doc.toObject()`
- `doc.toJSON()`

### **QueryBuilder Methods**
- `QueryBuilder.create()`
- `.eq()`, `.ne()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`
- `.in()`, `.nin()`, `.exists()`, `.regex()`, `.size()`, `.all()`
- `.and()`, `.or()`, `.nor()`, `.not()`
- `.between()`, `.contains()`, `.startsWith()`, `.endsWith()`
- `.build()`, `.reset()`, `.clone()`, `.merge()`

### **Database Methods**
- `connect(path)`
- `db.clearCache(collection)`
- `db.getCacheStats()`

---

**📦 Package**: `npm install synz-db`  
**📖 Repository**: https://github.com/LeSynz/synz-db  
**📄 License**: MIT  
**🎯 Version**: 1.2.0

*Happy coding with Synz-DB! 🚀*