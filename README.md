USDT Multi-Chain Payment Gateway Demo Version

A professional-grade USDT payment gateway middleware built with Node.js. This project features a robust architecture for real-time monitoring and secure reconciliation for TRC20 (Tron) and ERC20 (Ethereum) networks.

System Architecture
The gateway implements a multi-layered security model to ensure 100% payment accuracy:

Event Scanners: Dedicated listeners for on-chain Transfer events using high-performance RPC nodes.

Confirmation Engine: Implements a Threshold Confirmation Check (12 blocks for ETH, 19 for TRON) to mitigate Block Reorganization (Reorg) risks.

Audit & Persistence: Every transaction is logged into a persistent SQLite database with idempotency guards.

Secure Webhooks: Payment notifications are secured using HMAC-SHA256 signatures to prevent payload tampering.

Security Highlights:
Risk Mitigation: No payment is marked SUCCESS until it reaches the required block depth, preventing double-spend attacks.

Data Integrity: SHA256 signatures allow merchants to verify that callbacks originated from this gateway and haven't been modified in transit.

Idempotency: Strict database indexing on txHash prevents duplicate credit processing.

Audit Roadmap: Architecture-ready for JWT dashboard authentication and merchant API secrets.

Getting Started:
1. Configuration
Create a .env file based on .env.example:

Code snippet
PORT=3000
TRON_GRID_API_KEY=your_key
ETH_RPC_URL=your_rpc_url
MERCHANT_SECRET=your_signing_secret
2. Execution
Bash
npm install
npm start
(Optional) run mock transaction:
node mock_transaction.js
The Live Monitor Dashboard will be active at: http://localhost:3000

Tech Stack:

Runtime: Node.js

Framework: Express.js

Web3: TronWeb, Ethers.js 

Storage: SQLite3

Frontend: Bootstrap 5 (Dark Mode)
