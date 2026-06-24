const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db');

// Test: Insert a test user with email verification
const crypto = require('crypto');
const id = crypto.randomUUID();
const token = crypto.randomBytes(32).toString('hex');
const expires = new Date(Date.now() + 86400000).toISOString();

db.run(
  "INSERT INTO users (id, email, password, company, email_verified, verification_token, verification_token_expires, plan, credits, subscription_status) VALUES (?, ?, ?, ?, 0, ?, ?, 'starter', 5, 'free')",
  [id, 'test-verification@test.com', 'hashtest123', 'Test Co', token, expires],
  (err) => {
    if (err) {
      console.log('Insert error:', err.message);
    } else {
      console.log('OK - test user inserted with ID:', id);
      console.log('Verification token:', token);
    }
    db.close();
  }
);
