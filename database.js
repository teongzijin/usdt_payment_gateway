/**
 * Database Module - SQLite3 Implementation
 * Handles persistent storage for Orders and Transactions.
 * Author: teongzijin
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database file
const dbPath = path.resolve(__dirname, 'gateway.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to the SQLite database.');
});

/**
 * Initialize Tables
 * Creating tables for Orders and Transaction Logs if they don't exist.
 */
const initDb = () => {
    db.serialize(() => {
        // Orders Table: Tracks payment requests
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            orderId TEXT PRIMARY KEY,
            amount REAL,
            network TEXT,
            payAddress TEXT,
            status TEXT DEFAULT 'PENDING',
            txHash TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmedAt DATETIME
        )`);

        // Transactions Table: Tracks all detected on-chain activities (The 50-row list)
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txHash TEXT UNIQUE,
            network TEXT,
            toAddress TEXT,
            amount REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
};

/**
 * Database Operations
 */
const dbOps = {
    // Save a new order
    saveOrder: (order) => {
        const { orderId, amount, network, payAddress } = order;
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO orders (orderId, amount, network, payAddress) VALUES (?, ?, ?, ?)`;
            db.run(query, [orderId, amount, network, payAddress], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Update order status when payment is confirmed
    updateOrderStatusByPayment: (address, amount, network, txHash) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE orders 
                SET status = 'SUCCESS', txHash = ?, confirmedAt = CURRENT_TIMESTAMP 
                WHERE payAddress = ? AND amount = ? AND network = ? AND status = 'PENDING'
            `;
            db.run(query, [txHash, address, amount, network], function(err) {
                if (err) reject(err);
                else resolve(this.changes); // Returns number of rows updated
            });
        });
    },

    // Log detected on-chain transactions
    logTransaction: (tx) => {
        const { txHash, network, toAddress, amount } = tx;
        return new Promise((resolve, reject) => {
            const query = `INSERT OR IGNORE INTO transactions (txHash, network, toAddress, amount) VALUES (?, ?, ?, ?)`;
            db.run(query, [txHash, network, toAddress, amount], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Get latest 50 transactions for the UI
    getRecentTransactions: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Initialize the schema
initDb();

module.exports = dbOps;
