/**
 * USDT Multi-Chain Payment Gateway - Demo Version (Database & Security Integrated)
 * Support: TRC20 (Tron) & ERC20 (Ethereum)
 * Author: teongzijin
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const crypto = require('crypto'); // Built-in node module for SHA256
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuration Parameters ---
const PORT = process.env.PORT || 3000;
const USDT_PRECISION = 1e6;

const CONTRACTS = {
    TRC20: "TR7NHqjeKQxGTC18q8ZY4pL8otSzgjLj6t",
    ERC20: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

// --- Security Functions ---

/**
 * Generates a SHA256 HMAC signature to ensure Webhook data integrity.
 * This prevents spoofing attacks from unauthorized parties.
 */
function generateSignature(data, secret) {
    // Sort keys alphabetically to ensure consistent hashing across different platforms
    const sortedData = Object.keys(data).sort().reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
    }, {});

    const queryString = JSON.stringify(sortedData);
    return crypto.createHmac('sha256', secret)
        .update(queryString)
        .digest('hex');
}

// --- Blockchain Connection Initialization ---

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY || '' }
});

const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://cloudflare-eth.com');
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

// --- Core Business Logic Functions ---

/**
 * Handles payment confirmation, database updates, and Webhook signing.
 */
async function handlePayment(network, to, amount, txHash) {
    try {
        // 1. Log the transaction for monitoring (Idempotency is handled by DB UNIQUE constraint)
        await db.logTransaction({
            txHash,
            network,
            toAddress: to,
            amount: parseFloat(amount)
        });

        console.log(`[${network}] Detected Transfer: ${amount} USDT to ${to}`);

        // 2. Attempt to match and update a pending order in the database
        const rowsAffected = await db.updateOrderStatusByPayment(to, parseFloat(amount), network, txHash);
        
        // 3. If an order was matched and updated, generate a secure Webhook notification
        if (rowsAffected > 0) {
            console.log(`Order matched! Status updated to SUCCESS.`);

            // Prepare Webhook Payload
            const payload = {
                event: 'payment.success',
                network: network,
                to: to,
                amount: parseFloat(amount),
                txHash: txHash,
                timestamp: Date.now()
            };

            // Generate HMAC-SHA256 Signature using the Merchant Secret
            const signature = generateSignature(payload, process.env.MERCHANT_SECRET || 'default_secret');

            console.log(`Webhook Payload Generated:`, payload);
            console.log(`SHA256 Signature: ${signature}`);
            
            // Note: In production, you would send this to the Merchant's URL:
            // axios.post(merchant_url, payload, { headers: { 'X-Signature': signature } });
        }
        
    } catch (error) {
        console.error('Error in handlePayment:', error.message);
    }
}

// --- Listener Services (Scanner) ---

async function startScanners() {
    console.log("Starting Multi-Chain Scanners...");

    // TRC20 Scanner
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

    // ERC20 Scanner
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

app.get('/api/transactions', async (req, res) => {
    try {
        const rows = await db.getRecentTransactions();
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    // Simulated order status check
    res.json({ success: true, message: "Order status check active" });
});

// Serve the Monitoring Dashboard
app.use(express.static('public')); 

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Gateway Backend running on http://localhost:${PORT}`);
    startScanners();
});
