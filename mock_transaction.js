const db = require('./database');

async function createFakePayment() {
    await db.logTransaction({
        txHash: "0x" + Math.random().toString(16).slice(2),
        network: "TRC20",
        toAddress: "TYourDemoReceivingAddress...",
        amount: 100.00
    });
    console.log("Mock transaction inserted! Check your dashboard.");
}

createFakePayment();
