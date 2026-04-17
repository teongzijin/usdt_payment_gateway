Secure Multi-Chain USDT Payment Gateway (Middleware)
Architectural Showcase: A robust bridge between Blockchain protocols (ERC20/TRC20) and Enterprise ERP/Web systems.

Project Disclaimer
Notice: Due to non-disclosure agreements (NDA) and security policies with the client, this repository serves as a technical architectural showcase. Sensitive business logic, private keys, and proprietary configurations have been abstracted or removed. The provided code focuses on core logic: protocol parsing, reconciliation algorithms, and security implementations.

Key Features
1. High-Precision Reconciliation
Unique Deposit Address (UDA): Automated generation of one-time wallet addresses per transaction to ensure zero-collision matching.

Amount-based Fingerprinting: A sophisticated "Floating Point" algorithm (e.g., adding 0.001 variance) to distinguish concurrent payments within a fixed address pool—significantly reducing TRC20 activation costs.

2. Multi-Chain Integrity
Dual-Stack Monitoring: Reliable polling using Web3.js (Ethereum) and TronWeb (TRON).

Reorg Mitigation: Implements Confirmation Threshold Checks (e.g., 12+ blocks for ERC20) before triggering any financial state change.

3. Financial-Grade Security
SHA256 Signed Webhooks: All Instant Payment Notifications (IPN) are secured with HMAC-SHA256 signatures to prevent data tampering.

Reliability Engine: A built-in Exponential Backoff Retry system ensuring that notifications reach the merchant even during network instability.

System Architecture
Scanner Service: Continuously polls the blockchain for Transfer events.

Matching Engine: Validates wallet_address + amount against the pending transaction database.

Security Layer: Verifies block depth to ensure transaction finality.

Notification Worker: Executes signed callbacks with a retry lifecycle.

Tech Stack
Backend: Node.js

Blockchain: Web3.js, TronWeb

Security: HMAC-SHA256

Database: MySQL
