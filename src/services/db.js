// src/services/db.js
import Dexie from 'dexie';

export const db = new Dexie('91writing_db');

// Define the database schema.
// We'll use a simple key-value store to mimic localStorage's behavior initially.
// The 'key' property will be the primary key.
db.version(1).stores({
  key_value_store: '&key', // Primary key is 'key' and it must be unique
});
