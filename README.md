# USDT Multi-Chain Payment Gateway
A high-performance USDT payment middleware built with Node.js. This gateway provides real-time monitoring and secure reconciliation for both TRC20 (Tron) and ERC20 (Ethereum) networks.

# System Architecture
The gateway follows a "Listen-Verify-Reconcile" model to ensure 100% payment accuracy:Scanner Engine: High-performance event listeners capturing on-chain Transfer events in real-time.Confirmation Engine: Implements a Threshold Check to mitigate risks from blockchain reorganizations (Rollbacks).Security Layer: Utilizes HMAC-SHA256 signatures for tamper-proof merchant notifications.Persistence: Powered by SQLite to ensure zero data loss during server restarts.

# Security Mechanisms
1. Threshold Check: ETH (12 blocks) / TRON (19 blocks) purpose is to prevents Double-Spend & Reorg attacks
2. SHA256 Signature: Signed with a Merchant Secret to prevent spoofing of Webhook notifications
3. Idempotency Guard: Unique TxHash database indexing to ensures a single transaction is never credited twice
4, Env Isolation: Managed via .env configuration to protects sensitive API Keys and Secrets

# Getting Started
1. InstallationBash# Clone the repository
git clone https://github.com/yourusername/usdt_payment_gateway.git

# Enter the directory and install dependencies
cd usdt_payment_gateway
npm install
2. ConfigurationCreate a .env file in the root directory based on the following template:
PORT=3000
TRON_GRID_API_KEY=your_trongrid_key
ETH_RPC_URL=your_ethereum_rpc_url
MERCHANT_SECRET=your_custom_signing_secret
3. Start the gateway and scanners
npm start

# (Optional) Run the mock script to simulate payments
node mock_tx.js
[!IMPORTANT]Once started, visit http://localhost:3000 to access the live monitoring dashboard.

# Tech StackBackend: 
Node.js + Express
Blockchain: TronWeb + Ethers.js (v6)
Database: SQLite3
Frontend: Bootstrap 5 (Dark Mode) + Vanilla JS👨‍💻 


