const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vancore.db');

const queries = [
  "ALTER TABLE users ADD COLUMN plan TEXT",
  "ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN subscription_end DATETIME",
  `CREATE TABLE IF NOT EXISTS vera_leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    industry TEXT,
    challenge TEXT,
    revenue_range TEXT,
    consent_terms INTEGER DEFAULT 0,
    consent_data INTEGER DEFAULT 0,
    consent_marketing INTEGER DEFAULT 0,
    conversation_history TEXT,
    created_at DATETIME,
    status TEXT DEFAULT 'new'
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    plan TEXT,
    status TEXT DEFAULT 'active',
    credits_remaining INTEGER DEFAULT 0,
    current_period_start DATETIME,
    current_period_end DATETIME,
    created_at DATETIME,
    updated_at DATETIME
  )`
];

let i = 0;
function runNext() {
  if (i >= queries.length) {
    console.log('DB OK - all tables ready');
    db.close();
    return;
  }
  db.run(queries[i], (err) => {
    if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
      console.log('Note:', err.message);
    } else {
      console.log('OK:', queries[i].substring(0, 50) + '...');
    }
    i++;
    runNext();
  });
}

runNext();
