const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'electricity_monitoring.db');

let db = null;

/**
 * Initialize the database and create tables if they don't exist
 */
function init() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
}

/**
 * Create the meter_readings table if it doesn't exist
 */
function createTables() {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS meter_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_kwh REAL NOT NULL,
        token_amount REAL,
        token_cost REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
        reject(err);
        return;
      }
      console.log('Database tables initialized');
      resolve();
    });
  });
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
          return;
        }
        console.log('Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  init,
  getDb,
  close
};

