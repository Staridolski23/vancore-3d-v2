// Subscription management endpoints

// Get subscription plans
app.get('/api/subscriptions/plans', (req, res) => {
  const plans = [
    { id: 'starter', name: 'Starter', price: 0, interval: 'free', features: ['5 questions/week', 'Basic analysis'] },
    { id: 'payg', name: 'Pay-As-You-Go', price: 25, interval: 'one-time', credits: 500, features: ['500 AI questions', 'Valid 3 months'] },
    { id: 'professional', name: 'Professional', price: 49, interval: 'month', features: ['Unlimited questions', 'Monthly report', 'Portal access', 'Priority support'] },
    { id: 'business', name: 'Business', price: 99, interval: 'month', features: ['Everything in Pro', 'Weekly analysis', '2 calls/month', 'Growth plan'] }
  ];
  res.json({ plans });
});

// Create subscription (called after payment)
app.post('/api/subscriptions', clientAuth, (req, res) => {
  try {
    const { plan_id, payment_id } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'Plan required' });

    const plans = { starter: 0, payg: 25, professional: 49, business: 99 };
    const credits = { starter: 5, payg: 500, professional: 99999, business: 99999 };
    const planNames = { starter: 'Starter', payg: 'Pay-As-You-Go', professional: 'Professional', business: 'Business' };

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const id = require('crypto').randomUUID();

    db.run('INSERT INTO subscriptions (id, user_email, plan, status, credits_remaining, current_period_start, current_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.client.email, plan_id, 'active', credits[plan_id] || 0, now.toISOString(), endOfMonth.toISOString(), now.toISOString(), now.toISOString()],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Update user record
        db.run('UPDATE users SET plan = ?, credits = ?, subscription_status = ?, subscription_end = ? WHERE email = ?',
          [plan_id, credits[plan_id] || 0, 'active', endOfMonth.toISOString(), req.client.email],
          (err2) => {
            if (err2) console.error('User update error:', err2.message);
          });

        res.json({
          success: true,
          subscription: {
            id,
            plan: planNames[plan_id] || plan_id,
            status: 'active',
            credits_remaining: credits[plan_id] || 0,
            current_period_end: endOfMonth.toISOString()
          }
        });
      });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current subscription status
app.get('/api/subscriptions/status', clientAuth, (req, res) => {
  db.get('SELECT * FROM subscriptions WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
    [req.client.email], (err, row) => {
      if (err || !row) {
        return res.json({ plan: 'starter', status: 'free', credits_remaining: 5 });
      }
      res.json(row);
    });
});

// Use credit (called when asking Vera a question)
app.post('/api/subscriptions/use-credit', clientAuth, (req, res) => {
  db.get('SELECT * FROM subscriptions WHERE user_email = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
    [req.client.email, 'active'], (err, row) => {
      if (err || !row) {
        // Check free tier credits
        db.get('SELECT credits FROM users WHERE email = ?', [req.client.email], (err2, userRow) => {
          if (err2 || !userRow) return res.status(404).json({ error: 'No subscription' });
          if (userRow.credits <= 0) return res.status(402).json({ error: 'No credits remaining', code: 'NO_CREDITS' });
          
          db.run('UPDATE users SET credits = credits - 1 WHERE email = ?', [req.client.email]);
          res.json({ credits_remaining: userRow.credits - 1, plan: 'starter' });
        });
        return;
      }

      if (row.credits_remaining <= 0) {
        return res.status(402).json({ error: 'No credits remaining', code: 'NO_CREDITS' });
      }

      db.run('UPDATE subscriptions SET credits_remaining = credits_remaining - 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), row.id]);
      db.run('UPDATE users SET credits = credits - 1 WHERE email = ?', [req.client.email]);
      
      res.json({
        credits_remaining: row.credits_remaining - 1,
        plan: row.plan
      });
    });
});

// Cancel subscription
app.post('/api/subscriptions/cancel', clientAuth, (req, res) => {
  db.run('UPDATE subscriptions SET status = ?, updated_at = ? WHERE user_email = ? AND status = ?',
    ['cancelled', new Date().toISOString(), req.client.email, 'active'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run('UPDATE users SET subscription_status = ? WHERE email = ?', ['cancelled', req.client.email]);
      res.json({ success: true, message: 'Subscription cancelled' });
    });
});
