const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/vancore.db');

db.serialize(() => {
  // Add client_id column if missing
  db.run("ALTER TABLE bookings ADD COLUMN client_id TEXT DEFAULT ''", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('ALTER error:', err.message);
    } else {
      console.log('OK - client_id column added or already exists');
    }
  });

  // Backfill: if client_id empty, try to match by email from Supabase-like source
  // For now we keep it simple: client_id is set at booking creation time
});

db.close();
