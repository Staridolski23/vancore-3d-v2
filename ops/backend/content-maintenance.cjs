'use strict';
const { timingSafeEqual } = require('node:crypto');
function hasBackendKey(req) {
  const expected = process.env.VANCORE_BACKEND_KEY || '';
  const received = req.get('X-Vancore-Backend-Key') || '';
  return expected.length >= 32 && Buffer.byteLength(expected) === Buffer.byteLength(received) && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
function installContentMaintenance(app, db, loadContent, authorization = {}) {
  const table = authorization.table === 'vancore_site_content' ? 'vancore_site_content' : 'site_content';
  const readRows = () => new Promise((resolve, reject) => db.all(`SELECT * FROM ${table} ORDER BY id`, [], (error, rows) => error ? reject(error) : resolve(rows)));
  const run = (sql, params) => new Promise((resolve, reject) => db.run(sql, params, function(error) { error ? reject(error) : resolve({ id: this.lastID, changes: this.changes }); }));
  const guard = authorization.requireAdmin || ((req, res, next) => hasBackendKey(req) ? next() : res.status(401).json({ error: 'Unauthorized' }));
  const validKey = key => typeof key === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(key) && !['__proto__','constructor','prototype'].includes(key);
  app.get('/api/content', async (req, res) => {
    try {
      const sections = JSON.parse(JSON.stringify(loadContent()));
      for (const row of await readRows()) {
        if (!validKey(row.section) || !validKey(row.key)) continue;
        if (!sections[row.section] || typeof sections[row.section] !== 'object') sections[row.section] = {};
        let value = row.value;
        if (row.type === 'json') { try { value = JSON.parse(value); } catch { continue; } }
        sections[row.section][row.key] = value;
      }
      res.set('Cache-Control','no-store'); res.json({ sections, order: Object.keys(sections) });
    } catch { res.status(500).json({ error: 'Unable to load content' }); }
  });
  app.get('/api/maintenance/content', guard, async (req, res) => {
    try {
      const existing = new Map((await readRows()).map(row => [row.section+':'+row.key,row]));
      for (const [section, values] of Object.entries(loadContent())) {
        if (!values || typeof values !== 'object') continue;
        for (const [key,value] of Object.entries(values)) if (!existing.has(section+':'+key)) existing.set(section+':'+key, {
          id: section+':'+key, section, key, value: typeof value === 'string' ? value : JSON.stringify(value),
          type: typeof value === 'string' ? (value.length > 100 ? 'textarea' : 'text') : 'json',
        });
      }
      res.json({content:[...existing.values()]});
    } catch { res.status(500).json({error:'Unable to load editor content'}); }
  });
  const save = async (req,res) => {
    try {
      let { section, key, value, type = 'text', id } = req.body;
      const rows = await readRows();
      if (id !== undefined) {
        const previous = rows.find(row => String(row.id) === String(id));
        if (previous) { section = previous.section; key = previous.key; type = previous.type; }
        else if (typeof id === 'string' && id.includes(':')) {
          [section,key] = id.split(':'); const original=loadContent();
          if (!Object.hasOwn(original,section)||!Object.hasOwn(original[section],key)) return res.status(404).json({error:'Content not found'});
          if(typeof original[section][key]!=='string') type='json';
        } else return res.status(404).json({error:'Content not found'});
      }
      if (!validKey(section) || !validKey(key) || typeof value !== 'string' || value.length > 100000 || !['text','textarea','json'].includes(type)) return res.status(400).json({error:'Invalid content'});
      if(type==='json') { try { JSON.parse(value); } catch { return res.status(400).json({error:'Invalid JSON content'}); } }
      const previous=rows.find(row=>row.section===section&&row.key===key);
      const result = previous
        ? await run(`UPDATE ${table} SET value=?,type=?,updated_at=CURRENT_TIMESTAMP WHERE section=? AND key=?`,[value,type,section,key])
        : await run(`INSERT INTO ${table}(section,key,value,type) VALUES(?,?,?,?)`,[section,key,value,type]);
      res.json({success:true,id:previous?.id||result.id});
    } catch { res.status(500).json({error:'Unable to save content'}); }
  };
  app.post('/api/maintenance/content',guard,save); app.put('/api/maintenance/content',guard,save);
  // Registered before legacy app.use('/api/reviews'), which swallowed PATCH.
  app.patch('/api/reviews/:id',guard,async(req,res)=>{
    const {status}=req.body;
    if(!['pending_approval','published','rejected'].includes(status)) return res.status(400).json({error:'Invalid status'});
    try {
      const result=await run('UPDATE client_reviews SET status=?,published_at=? WHERE id=?',[status,status==='published'?new Date().toISOString():null,req.params.id]);
      if(!result.changes) return res.status(404).json({error:'Review not found'});
      res.json({success:true});
    } catch { res.status(500).json({error:'Unable to moderate review'}); }
  });
}
module.exports={installContentMaintenance,hasBackendKey};
