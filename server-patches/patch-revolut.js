const fs = require('fs');
const server = fs.readFileSync('/home/vancore/vancore-backend/server.js', 'utf8');

const revolutIntegration = `

// ========== REVOLUT PAYMENT INTEGRATION ==========

const REVOLUT_API_KEY = process.env.REVOLUT_API_KEY || '';
const REVOLUT_MERCHANT_ID = process.env.REVOLUT_MERCHANT_ID || '';
const REVOLUT_BASE_URL = process.env.REVOLUT_SANDBOX === 'true' 
  ? 'https://sandbox-merchant.revolut.com/api/1.0'
  : 'https://merchant.revolut.com/api/1.0';

async function createRevolutOrder(amount, currency, description, customerEmail, metadata) {
  try {
    const response = await fetch(REVOLUT_BASE_URL + '/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + REVOLUT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: currency || 'EUR',
        description: description,
        customer_email: customerEmail,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Revolut order error:', error);
      return { success: false, error: error.message || 'Payment failed' };
    }

    const order = await response.json();
    return { success: true, order };
  } catch (e) {
    console.error('Revolut API error:', e.message);
    return { success: false, error: e.message };
  }
}

async function getRevolutOrder(orderId) {
  try {
    const response = await fetch(REVOLUT_BASE_URL + '/orders/' + orderId, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + REVOLUT_API_KEY,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error('Revolut get order error:', e.message);
    return null;
  }
}

// Create subscription payment
app.post('/api/client/subscriptions/create', clientAuth, async (req, res) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'Plan required.' });

    const plans = {
      payg: { amount: 25, description: 'Pay-As-You-Go - 500 questions', credits: 500 },
      professional: { amount: 49, description: 'Professional Plan - Monthly', credits: 99999 },
      business: { amount: 99, description: 'Business Plan - Monthly', credits: 99999 },
    };

    const plan = plans[plan_id];
    if (!plan) return res.status(400).json({ error: 'Invalid plan.' });

    // Create Revolut order
    const result = await createRevolutOrder(
      plan.amount,
      'EUR',
      plan.description,
      req.client.email,
      { plan_id, user_id: req.client.id }
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Save subscription to database
    const id = require('crypto').randomUUID();
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO subscriptions (id, user_id, plan, status, payment_provider, payment_id, credits_remaining, current_period_start, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.client.id, plan_id, 'pending', 'revolut', result.order.id, plan.credits, now.toISOString(), periodEnd.toISOString(), now.toISOString()],
        (err) => err ? reject(err) : resolve(null)
      );
    });

    res.json({
      success: true,
      order: result.order,
      checkout_url: result.order.checkout_url || null,
    });
  } catch (e) {
    console.error('Create subscription error:', e.message);
    res.status(500).json({ error: 'Failed to create subscription.' });
  }
});

// Webhook for Revolut payment confirmation
app.post('/api/webhooks/revolut', (req, res) => {
  try {
    const { event, order_id, order_state } = req.body;

    if (event === 'ORDER_COMPLETED' || order_state === 'COMPLETED') {
      // Update subscription status
      db.run(
        'UPDATE subscriptions SET status = ?, updated_at = ? WHERE payment_id = ?',
        ['active', new Date().toISOString(), order_id],
        function(err) {
          if (err) console.error('Webhook update error:', err.message);
          
          // Get subscription details
          db.get('SELECT * FROM subscriptions WHERE payment_id = ?', [order_id], (err, sub) => {
            if (sub) {
              // Update user plan
              db.run(
                'UPDATE clients SET plan = ?, credits = ?, subscription_status = ?, subscription_end = ? WHERE id = ?',
                [sub.plan, sub.credits_remaining, 'active', sub.current_period_end, sub.user_id]
              );
            }
          });
        }
      );
    }

    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(500).json({ error: 'Webhook failed.' });
  }
});

// Get subscription status
app.get('/api/client/subscriptions/status', clientAuth, (req, res) => {
  db.get(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [req.client.id],
    (err, sub) => {
      if (err) return res.status(500).json({ error: 'Failed to load subscription.' });
      if (!sub) return res.json({ plan: 'starter', status: 'free', credits: 5 });
      res.json(sub);
    }
  );
});

// Cancel subscription
app.post('/api/client/subscriptions/cancel', clientAuth, (req, res) => {
  db.run(
    'UPDATE subscriptions SET status = ?, updated_at = ? WHERE user_id = ? AND status = ?',
    ['cancelled', new Date().toISOString(), req.client.id, 'active'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Cancel failed.' });
      db.run(
        'UPDATE clients SET subscription_status = ? WHERE id = ?',
        ['cancelled', req.client.id]
      );
      res.json({ success: true, message: 'Subscription cancelled.' });
    }
  );
});

`;

const marker = "app.get('/api/client/meetings'";
if (server.includes(marker)) {
  const updated = server.replace(marker, revolutIntegration + marker);
  fs.writeFileSync('/home/vancore/vancore-backend/server.js', updated);
  console.log('OK - Revolut integration added');
} else {
  console.log('ERROR - marker not found');
}
