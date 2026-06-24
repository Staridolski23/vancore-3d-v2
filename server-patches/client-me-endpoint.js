// Client portal - get user info and sessions
app.get('/api/client/me', clientAuth, (req, res) => {
  db.get('SELECT id, name, email, company, plan, credits, subscription_status, subscription_end FROM users WHERE email = ?',
    [req.client.email], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'User not found.' });
      db.all("SELECT id, updated_at FROM vera_sessions ORDER BY updated_at DESC LIMIT 10",
        [], (err2, sessions) => {
          const formatted = (sessions || []).map(s => ({
            id: s.id,
            created_at: s.updated_at,
            messages_count: 0,
            last_message: ''
          }));
          res.json({ user: row, sessions: formatted });
        });
    });
});
