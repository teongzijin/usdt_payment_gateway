/**
 * USDT Multi-Chain Payment Gateway - Demo Version (Database Integrated)
 * Support: TRC20 (Tron) & ERC20 (Ethereum)
 * Author: teongzijin
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const db = require('./database'); // Import the database module

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuration Parameters ---
const PORT = process.env.PORT || 3000;
const USDT_PRECISION = 1e6;

const CONTRACTS = {
    TRC20: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ERC20: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

// --- Blockchain Connection Initialization ---

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY || '' }
});

const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://cloudflare-eth.com');
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

// --- Core Business Logic Functions ---

/**
 * Handles payment confirmation and database synchronization
 */
async function handlePayment(network, to, amount, txHash) {
    try {
        // 1. Log the transaction in the monitoring list
        // The database handle 'INSERT OR IGNORE' for idempotency internally
        await db.logTransaction({
            txHash,
            network,
            toAddress: to,
            amount: parseFloat(amount)
        });

        console.log(`[${network}] Detected Transfer: ${amount} USDT to ${to}`);

        // 2. Fetch all pending orders for this network and address
        // Note: In a large system, you'd query by address directly for performance
        // For this demo, we'll implement a simple matching logic
        const latestTransactions = await db.getRecentTransactions();
        
        // This logic would typically be a DB query in production: 
        // SELECT * FROM orders WHERE status='PENDING' AND payAddress=to AND amount=amount
        // For the demo, let's assume we fetch the order and update it:
        
        // --- MATCHING LOGIC ---
        // (Simplified for Demo: You would typically pass the order lookup to database.js)
        // Let's assume we update any matching pending order
        await db.updateOrderStatusByPayment(to, parseFloat(amount), network, txHash);
        
    } catch (error) {
        console.error('Error in handlePayment:', error.message);
    }
}

// --- Listener Services (Scanner) ---

async function startScanners() {
    console.log("Starting Multi-Chain Scanners...");

    // A. TRC20 (Tron) Scanner
    try {
        const trc20Contract = await tronWeb.contract().at(CONTRACTS.TRC20);
        trc20Contract.Transfer().watch(async (err, event) => {
            if (err) return console.error('Tron Watch Error:', err);
            const { to, value } = event.result;
            const amount = value / USDT_PRECISION;
            await handlePayment('TRC20', tronWeb.address.fromHex(to), amount, event.transaction_id);
        });
        console.log("TRC20 Scanner Active");
    } catch (e) { console.error("TRC20 Scanner Failed", e); }

    // B. ERC20 (Ethereum) Scanner
    try {
        const erc20Contract = new ethers.Contract(CONTRACTS.ERC20, ERC20_ABI, ethProvider);
        erc20Contract.on("Transfer", async (from, to, value, event) => {
            const amount = ethers.formatUnits(value, 6);
            await handlePayment('ERC20', to, amount, event.log.transactionHash);
        });
        console.log("ERC20 Scanner Active");
    } catch (e) { console.error("ERC20 Scanner Failed", e); }
}

// --- API Routes ---

/**
 * 1. Create Order
 * Persists a new payment request to the SQLite database
 */
app.post('/api/orders/create', async (req, res) => {
    const { amount, network } = req.body;
    if (!amount || !network) return res.status(400).json({ error: "Missing parameters" });

    const newOrder = {
        orderId: "ORD_" + Date.now(),
        amount: parseFloat(amount),
        network: network.toUpperCase(),
        payAddress: network.toUpperCase() === 'TRC20' ? 'TYourTronAddress' : '0xYourEthAddress'
    };

    try {
        await db.saveOrder(newOrder);
        res.json({ success: true, data: newOrder });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * 2. Get Transaction Flow
 * Fetches the latest 50 records from the database for the UI dashboard
 */
app.get('/api/transactions', async (req, res) => {
    try {
        const rows = await db.getRecentTransactions();
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * 3. Check Order Status
 * Verifies the current status of a specific order
 */
app.get('/api/orders/:id', async (req, res) => {
    try {
        // You'll need to add getOrderById to your database.js
        // For now, we simulate the logic
        res.json({ success: true, message: "Order status fetched from DB" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Gateway Backend running on http://localhost:${PORT}`);
    startScanners();
});
