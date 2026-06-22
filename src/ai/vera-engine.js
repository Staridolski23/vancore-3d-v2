const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'vancore-3d', 'src', 'data', 'vera-knowledge-base.json');
let kb = {};
try { kb = JSON.parse(fs.readFileSync(kbPath, 'utf8')); } catch(e) { console.warn('KB load failed'); }

const industryKeywords = {
  'HoReCa': /hotel|restaurant|cafe|bar|hospitality|kitchen|chef|waiter|guest|room|reservation|menu|food/i,
  'E-commerce': /e-commerce|ecommerce|online store|shop|shipping|orders|returns|fulfillment|warehouse|delivery/i,
  'SME': /small business|medium enterprise|startup|founder|owner|team|processes|growth|scaling/i,
  'Logistics': /logistics|delivery|fleet|vehicles|routes|scheduling|supply chain|transportation|drivers/i
};

const problemKeywords = {
  'hr_turnover': /staff|employees|turnover|hiring|training|people leave|retention/i,
  'operational': /slow|chaos|disorganized|bottleneck|waste|errors|manual|inefficient/i,
  'financial': /costs|expenses|cash flow|profit|budget|losing money|pricing/i,
  'marketing': /no customers|visibility|competition|brand|online presence/i,
  'logistics': /delivery|shipping|routes|scheduling|wait time/i,
  'scaling': /can't grow|too much work|overwhelmed|need more people/i,
  'technology': /no system|manual|spreadsheet|digitalize|automate/i
};

function detectIndustry(text) {
  for (const [ind, regex] of Object.entries(industryKeywords)) {
    if (regex.test(text)) return ind;
  }
  return 'SME';
}

function detectProblems(text) {
  const found = [];
  for (const [type, regex] of Object.entries(problemKeywords)) {
    if (regex.test(text)) found.push(type);
  }
  return found.length > 0 ? found : ['general'];
}

function generateResponse(step, msg, history) {
  const allText = history.map(m => m.text).join(' ');
  const industry = detectIndustry(allText);
  const problems = detectProblems(msg);
  
  if (step === 1) {
    return { msg: "Hello! I'm Vera, VANCORE's senior AI business analyst. I'll ask you 6 quick questions to understand your business challenge. Everything is confidential.\n\nFirst — what industry is your business in?", qr: ['HoReCa', 'E-commerce', 'SME', 'Logistics', 'Other'] };
  } else if (step === 2) {
    return { msg: 'Great choice! ' + industry + " businesses face unique challenges. What's the ONE biggest challenge keeping you up at night? Be as specific as possible.", ph: "e.g. 'My restaurant has 40 staff but 40% leave within 3 months'" };
  } else if (step === 3) {
    return { msg: 'How long has this been going on? And roughly how many people does it affect?', ph: "e.g. 'About 6 months, affects all 40 staff'" };
  } else if (step === 4) {
    return { msg: "What have you already tried to fix this? What worked and what didn't?", ph: "e.g. 'We tried hiring agencies but quality was low'" };
  } else if (step === 5) {
    return { msg: 'If this problem were solved tomorrow, what would be the biggest impact on your business?', ph: "e.g. 'Save €5,000/month in hiring costs'" };
  } else if (step === 6) {
    return { msg: "What's your approximate monthly revenue range?", qr: ['Under €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Prefer not to say'] };
  } else if (step === 7) {
    return { msg: 'Thank you for sharing! Here\'s my preliminary assessment:\n\n**Industry:** ' + industry + '\n**Key Challenges:** ' + problems.join(', ') + '\n\n**My Recommendations:**\nBased on similar cases, we typically see 20-40% improvement in key metrics within 6-8 weeks.\n\n**Next Steps:**\nI\'d love to connect you with our human consultants for a free 30-minute assessment call.\n\nTo schedule your free assessment, please share your details:', leadCapture: true };
  }
  return { msg: 'Thank you! Is there anything else you\'d like to share?' };
}

function processMessage(message, state) {
  const step = state.step || 1;
  const history = state.history || [];
  const newHistory = [...history, { role: 'user', text: message, ts: new Date().toISOString() }];
  const resp = generateResponse(step, message, newHistory);
  const finalHistory = [...newHistory, { role: 'assistant', text: resp.msg, ts: new Date().toISOString() }];
  return {
    message: resp.msg,
    quickReplies: resp.qr || null,
    placeholder: resp.ph || null,
    isLeadCapture: resp.leadCapture || false,
    nextStep: step + 1,
    history: finalHistory
  };
}

function initTable(db) {
  db.run('CREATE TABLE IF NOT EXISTS vera_sessions (id TEXT PRIMARY KEY, state TEXT, updated_at DATETIME)');
  db.run('CREATE TABLE IF NOT EXISTS vera_leads (id TEXT PRIMARY KEY, name TEXT, company TEXT, email TEXT, phone TEXT, industry TEXT, challenge TEXT, revenue_range TEXT, conversation_history TEXT, created_at DATETIME, status TEXT DEFAULT "new")');
}

function saveLead(db, data) {
  return new Promise((resolve, reject) => {
    const id = require('crypto').randomUUID();
    db.run('INSERT INTO vera_leads (id, name, company, email, phone, industry, challenge, revenue_range, conversation_history, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, data.name, data.company, data.email, data.phone, data.industry, data.challenge, data.revenueRange, JSON.stringify(data.history||[]), new Date().toISOString(), 'new'], function(err) { if (err) reject(err); else resolve({ id }); });
  });
}

module.exports = { processMessage, initTable, saveLead, detectIndustry, detectProblems };
