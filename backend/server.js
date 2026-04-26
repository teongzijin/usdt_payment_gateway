/**
 * USDT Multi-Chain Payment Gateway - Demo Version
 * Support: TRC20 (Tron) & ERC20 (Ethereum)
 * Author: teongzijin
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TronWeb = require('tronweb');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// --- Mock Database Records (Demo Only) ---
let orders = [];       // Stores order information
let transactions = []; // Stores all detected on-chain transfers (for UI list)
const processedTxs = new Set(); // Idempotency check: prevents duplicate processing of the same TxID

// --- Configuration Parameters ---
const PORT = process.env.PORT || 3000;
const USDT_PRECISION = 1e6; // USDT uses 6 decimal places on major chains

// Smart Contract Addresses
const CONTRACTS = {
    TRC20: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ERC20: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

// --- Blockchain Connection Initialization ---

// TronWeb Initialization
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY || '' }
});

// Ethers.js Initialization (Ethereum)
const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://cloudflare-eth.com');
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

// --- Core Business Logic Functions ---

/**
 * Handles payment confirmation and order matching
 */
function handlePayment(network, to, amount, txHash) {
    // 1. Idempotency Check
    if (processedTxs.has(txHash)) return;
    processedTxs.add(txHash);

    const record = {
        txHash,
        network,
        to,
        amount: parseFloat(amount),
        time: new Date().toISOString()
    };

    // 2. Store in transaction list (keep the latest 50 records)
    transactions.unshift(record);
    if (transactions.length > 50) transactions.pop();

    console.log(`🔍 [${network}] Detected Transfer: ${amount} USDT to ${to}`);

    // 3. Order Matching Logic
    const order = orders.find(o => 
        o.status === 'PENDING' && 
        o.network === network &&
        o.payAddress.toLowerCase() === to.toLowerCase() &&
        Math.abs(o.amount - amount) < 0.01 // Allows for minor floating point discrepancies
    );

    if (order) {
        order.status = 'SUCCESS';
        order.confirmedAt = new Date();
        order.txHash = txHash;
        console.log(`✅ Order ${order.orderId} matches! Status updated to SUCCESS.`);
        // TODO: Trigger Webhook IPN to notify downstream systems here
    }
}

// --- Listener Services (Scanner) ---

async function startScanners() {
    console.log("🚀 Starting Multi-Chain Scanners...");

    // A. TRC20 (Tron) Scanner
    try {
        const trc20Contract = await tronWeb.contract().at(CONTRACTS.TRC20);
        trc20Contract.Transfer().watch((err, event) => {
            if (err) return console.error('Tron Watch Error:', err);
            const { to, value } = event.result;
            const amount = value / USDT_PRECISION;
            handlePayment('TRC20', tronWeb.address.fromHex(to), amount, event.transaction_id);
        });
        console.log("✅ TRC20 Scanner Active");
    } catch (e) { console.error("TRC20 Scanner Failed", e); }

    // B. ERC20 (Ethereum) Scanner
    try {
        const erc20Contract = new ethers.Contract(CONTRACTS.ERC20, ERC20_ABI, ethProvider);
        erc20Contract.on("Transfer", (from, to, value, event) => {
            const amount = ethers.formatUnits(value, 6);
            handlePayment('ERC20', to, amount, event.log.transactionHash);
        });
        console.log("✅ ERC20 Scanner Active");
    } catch (e) { console.error("ERC20 Scanner Failed", e); }
}

// --- API Routes ---

// 1. Create Order (Called by Frontend)
app.post('/api/orders/create', (req, res) => {
    const { amount, network } = req.body; // Expected amount and chain
    if (!amount || !network) return res.status(400).json({ error: "Missing parameters" });

    const orderId = "ORD_" + Date.now();
    const newOrder = {
        orderId,
        amount: parseFloat(amount),
        network: network.toUpperCase(), // 'TRC20' or 'ERC20'
        // In a production environment, addresses should be retrieved from an Address Pool
        payAddress: network.toUpperCase() === 'TRC20' ? 'TYourTronAddress' : '0xYourEthAddress', 
        status: 'PENDING',
        createdAt: new Date()
    };

    orders.push(newOrder);
    res.json({ success: true, data: newOrder });
});

// 2. Get Transaction Flow (Called by UI for the 50-row list)
app.get('/api/transactions', (req, res) => {
    res.json({ success: true, data: transactions });
});

// 3. Check Specific Order Status
app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.orderId === req.params.id);
    res.json({ success: true, data: order || { status: 'NOT_FOUND' } });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Gateway Backend running on http://localhost:${PORT}`);
    startScanners();
});
