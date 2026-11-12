// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);

// Keep only the latest events for each transaction
const latestTransactions = new Map();

for (const line of lines) {
  try {
    const event = JSON.parse(line);
    
    if (!event.txn_id) 
    {  
      continue
    }
    const existing = latestTransactions.get(event.txn_id);

    if (!existing || event.ts > existing.ts) {
      latestTransactions.set(event.txn_id, event)
    }
    
  } catch {
    continue;
  }
}

for (const [_, event] of latestTransactions) {
  if (event.status === "success") {
    // Amounts may contain thousands separators, e.g. "274,964.19"
    const amountString = String(event.amount);
    total += Number(amountString.replaceAll(",", ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
