'use strict';

function monthRange(year, month) {
  if (!/^\d{4}$/.test(String(year)) || !/^\d{1,2}$/.test(String(month)) || +month > 11) throw new Error('Invalid month');
  const start = `${year}-${String(+month + 1).padStart(2, '0')}-01`;
  const end = +month === 11 ? `${+year + 1}-01-01` : `${year}-${String(+month + 2).padStart(2, '0')}-01`;
  return [start, end];
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validTime(value) { return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function installBookingMaintenance(app, db, transactionDb = db) {
  const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function(error) { error ? reject(error) : resolve({ changes: this.changes, lastID: this.lastID }); }));
  const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
  const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
  const errorResponse = (res, error) => res.status(/UNIQUE constraint/.test(error.message) ? 409 : 500).json({ error: /UNIQUE constraint/.test(error.message) ? 'This time slot is already booked' : 'Unable to update bookings' });

  // Registered before legacy handlers so there is only one implementation per route.
  app.get('/api/bookings', async (req, res) => {
    try {
      let sql = 'SELECT * FROM bookings', params = [];
      if (req.query.year !== undefined || req.query.month !== undefined) {
        try { params = monthRange(req.query.year, req.query.month); } catch { return res.status(400).json({ error: 'Invalid month' }); }
        sql += ' WHERE date >= ? AND date < ?';
      }
      const rows = await all(sql + ' ORDER BY date ASC, time ASC', params);
      res.json({ bookings: req.publicAvailability ? rows.map(({date,time,status})=>({date,time,status})) : rows });
    } catch (error) { errorResponse(res, error); }
  });

  app.put('/api/bookings/:id', async (req, res) => {
    try {
      const previous = await get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (!previous) return res.status(404).json({ error: 'Booking not found' });
      const { status = previous.status, date = previous.date, time = previous.time } = req.body;
      if (!validDate(date) || !validTime(time) || !['new', 'scheduled', 'confirmed', 'cancelled', 'rescheduled', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid date, time or status' });
      const now = new Date().toISOString();
      const reason = req.body.cancellation_reason === undefined ? previous.cancellation_reason : String(req.body.cancellation_reason).slice(0, 2000);
      const result = await run('UPDATE bookings SET date = ?, time = ?, status = ?, confirmed_at = ?, cancelled_at = ?, cancellation_reason = ? WHERE id = ?', [date, time, status, status === 'confirmed' ? now : previous.confirmed_at, status === 'cancelled' ? now : previous.cancelled_at, reason, req.params.id]);
      res.json({ success: true, changes: result.changes });
    } catch (error) { errorResponse(res, error); }
  });

  app.post('/api/bookings/:id/propose', async (req, res) => {
    try {
      const { date, time } = req.body;
      if (!validDate(date) || !validTime(time)) return res.status(400).json({ error: 'Valid date and time are required' });
      if (!await get('SELECT id FROM bookings WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Booking not found' });
      const result = await run('INSERT INTO booking_proposals (booking_id, proposed_date, proposed_time) VALUES (?, ?, ?)', [req.params.id, date, time]);
      res.json({ success: true, id: result.lastID });
    } catch (error) { errorResponse(res, error); }
  });

  // Keep both updates atomic with a savepoint. Queue this handler on its own
  // connection so another proposal cannot interleave inside the transaction.
  let proposalQueue = Promise.resolve();
  const transactionRun = (sql, params = []) => new Promise((resolve, reject) => transactionDb.run(sql, params, function(error) { error ? reject(error) : resolve({ changes: this.changes, lastID: this.lastID }); }));
  const transactionGet = (sql, params = []) => new Promise((resolve, reject) => transactionDb.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
  app.patch('/api/bookings/proposals/:id', (req, res) => {
    proposalQueue = proposalQueue.then(async () => {
      const { status } = req.body;
      if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid proposal status' });
      let transaction = false;
      try {
        await transactionRun('SAVEPOINT accept_proposal'); transaction = true;
        const proposal = await transactionGet('SELECT * FROM booking_proposals WHERE id = ?', [req.params.id]);
        if (!proposal || proposal.status !== 'pending') {
          await transactionRun('ROLLBACK TO accept_proposal'); await transactionRun('RELEASE accept_proposal'); transaction = false;
          return res.status(proposal ? 409 : 404).json({ error: proposal ? 'Proposal already resolved' : 'Proposal not found' });
        }
        if (status === 'accepted') {
          const result = await transactionRun('UPDATE bookings SET date = ?, time = ?, status = ? WHERE id = ?', [proposal.proposed_date, proposal.proposed_time, 'rescheduled', proposal.booking_id]);
          if (!result.changes) throw new Error('Booking not found');
        }
        await transactionRun('UPDATE booking_proposals SET status = ? WHERE id = ?', [status, req.params.id]);
        await transactionRun('RELEASE accept_proposal'); transaction = false;
        res.json({ success: true });
      } catch (error) {
        if (transaction) { await transactionRun('ROLLBACK TO accept_proposal').catch(() => {}); await transactionRun('RELEASE accept_proposal').catch(() => {}); }
        errorResponse(res, error);
      }
    }).catch(error => { if (!res.headersSent) errorResponse(res, error); });
  });
}
module.exports = { monthRange, validDate, validTime, installBookingMaintenance };
