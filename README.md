🚀 USDT Multi-Chain Payment GatewayEnterprise-Grade Blockchain Monitoring & ReconciliationA high-performance USDT payment middleware built with Node.js. This gateway provides real-time monitoring and secure reconciliation for both TRC20 (Tron) and ERC20 (Ethereum) networks.
🏗 System ArchitectureThe gateway follows a "Listen-Verify-Reconcile" model to ensure 100% payment accuracy:Scanner Engine: High-performance event listeners capturing on-chain Transfer events in real-time.Confirmation Engine: Implements a Threshold Check to mitigate risks from blockchain reorganizations (Rollbacks).Security Layer: Utilizes HMAC-SHA256 signatures for tamper-proof merchant notifications.Persistence: Powered by SQLite to ensure zero data loss during server restarts.
🛡 Security MechanismsFeatureDescriptionPurposeThreshold CheckETH (12 blocks) / TRON (19 blocks)Prevents Double-Spend & Reorg attacksSHA256 SignatureSigned with a Merchant SecretPrevents spoofing of Webhook notificationsIdempotency GuardUnique TxHash database indexingEnsures a single transaction is never credited twiceEnv IsolationManaged via .env configurationProtects sensitive API Keys and Secrets
🚀 Getting Started1. InstallationBash# Clone the repository
git clone https://github.com/yourusername/usdt_payment_gateway.git

# Enter the directory and install dependencies
cd usdt_payment_gateway
npm install
2. ConfigurationCreate a .env file in the root directory based on the following template:Code snippetPORT=3000
TRON_GRID_API_KEY=your_trongrid_key
ETH_RPC_URL=your_ethereum_rpc_url
MERCHANT_SECRET=your_custom_signing_secret
3. ExecutionBash# Start the gateway and scanners
npm start

# (Optional) Run the mock script to simulate payments
node mock_tx.js
[!IMPORTANT]Once started, visit http://localhost:3000 to access the live monitoring dashboard.🛠 Tech StackBackend: Node.js + ExpressBlockchain: TronWeb + Ethers.js (v6)Database: SQLite3Frontend: Bootstrap 5 (Dark Mode) + Vanilla JS👨‍💻 Engineering DecisionsWhy SQLite?Chosen for its portability and zero-config requirement. It provides persistent storage without needing a complex database setup, making the demo easy to run and review.Confirmation Thresholds:We do not mark orders as SUCCESS immediately upon detection. We wait for 12-19 blocks to ensure the transaction has achieved "Finality" on the blockchain.Future Roadmap (JWT):The architecture is pre-configured for JWT middleware integration to secure administrative endpoints in a production environment.
