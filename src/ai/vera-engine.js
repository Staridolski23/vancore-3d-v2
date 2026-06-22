const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'vancore-3d', 'src', 'data', 'vera-knowledge-base.json');
let kb = {};
try { kb = JSON.parse(fs.readFileSync(kbPath, 'utf8')); } catch(e) { console.warn('KB load failed'); }

const industryKeywords = {
  'HoReCa': /hotel|restaurant|cafe|bar|hospitality|kitchen|chef|waiter|guest|room|reservation|menu|food|хотел|ресторант|кафене|бар|кухня|готвач|сервитьор|гост|резервация|меню|храна/i,
  'E-commerce': /e-commerce|ecommerce|online store|shop|shipping|orders|returns|fulfillment|warehouse|delivery|онлайн магазин|доставки|поръчки/i,
  'SME': /small business|medium enterprise|startup|founder|owner|team|processes|growth|scaling|малък бизнес|средно предприятие|стартап|основател|собственик|екип|процеси|растеж|скалиране/i,
  'Logistics': /logistics|delivery|fleet|vehicles|routes|scheduling|supply chain|transportation|drivers|логистика|доставки|автопарк|превозни средства|маршрути|графици|верига на доставки|транспорт|шофьори/i
};

const problemKeywords = {
  'hr_turnover': /staff|employees|turnover|hiring|training|people leave|retention|служители|наемане|обучение|текучест|задържане/i,
  'operational': /slow|chaos|disorganized|bottleneck|waste|errors|manual|inefficient|бавен|хаос|дезорганизиране|задръстване|грешки|ръчен|неефективен/i,
  'financial': /costs|expenses|cash flow|profit|budget|losing money|pricing|margins|разходи|приходи|кеш флоу|печалба|бюджет|загуба|ценообразуване|марж/i,
  'marketing': /no customers|visibility|competition|brand|online presence|advertising|няма клиенти|видимост|конкуренция|бранд|онлайн присъствие|реклама/i,
  'logistics': /delivery|shipping|routes|scheduling|wait time|доставка|маршрути|графици|време на чакане/i,
  'scaling': /can.t grow|too much work|overwhelmed|need more people|expand|не мога да разрасна|прекалено много работа|нужда от повече хора|разширяване/i,
  'technology': /no system|manual|spreadsheet|digitalize|automate|няма система|ръчен|таблица|дигитализирам|автоматизирам/i,
  'legal': /compliance|regulations|permits|licenses|contracts|laws|съответствие|нормативи|разрешения|лицензи|договори|закони/i
};

function detectLanguage(text) {
  const bulgarianWords = /(здравей|добър ден|благодаря|какво|колко|искам|знам|могу|трябва|няма|може|бъде|българия|работа|бизнес|проблем|помощ|моля)/i;
  const cyrillicCount = (text.match(/[а-яА-Я]/g) || []).length;
  const totalChars = text.length;
  if (bulgarianWords.test(text) || (cyrillicCount > totalChars * 0.3 && /[ъь]/.test(text))) {
    return 'bg';
  }
  return 'en';
}

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

const responses = {
  en: {
    1: { msg: "Hello! I'm Vera, VANCORE's senior AI business analyst. I'll ask you 6 quick questions to understand your business challenge. Everything is confidential.\n\nFirst — what industry is your business in?", qr: ['HoReCa', 'E-commerce', 'SME', 'Logistics', 'Other'] },
    2: (industry) => ({ msg: 'Great choice! ' + industry + " businesses face unique challenges. What's the ONE biggest challenge keeping you up at night? Be as specific as possible.", ph: "e.g. 'My restaurant has 40 staff but 40% leave within 3 months'" }),
    3: { msg: 'How long has this been going on? And roughly how many people does it affect?', ph: "e.g. 'About 6 months, affects all 40 staff'" },
    4: { msg: "What have you already tried to fix this? What worked and what didn't?", ph: "e.g. 'We tried hiring agencies but quality was low'" },
    5: { msg: 'If this problem were solved tomorrow, what would be the biggest impact on your business?', ph: "e.g. 'Save €5,000/month in hiring costs'" },
    6: { msg: "What's your approximate monthly revenue range?", qr: ['Under €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Prefer not to say'] },
    7: (industry, problems) => ({ msg: 'Thank you for sharing! Here\'s my preliminary assessment:\n\n**Industry:** ' + industry + '\n**Key Challenges:** ' + problems.join(', ') + '\n\n**My Recommendations:**\nBased on similar cases, we typically see 20-40% improvement in key metrics within 6-8 weeks. Our analysis starts at €300.\n\n**Next Steps:**\nI\'d love to connect you with our human consultants for a free 30-minute assessment call.\n\nTo schedule your free assessment, please share your details:', leadCapture: true })
  },
  bg: {
    1: { msg: "Здравейте! Аз съм Vera, AI бизнес анализатор на VANCORE. Ще ви задам 6 въпроса, за да разбера предизвикателството на вашия бизнес. Всичко е конфиденциално.\n\nПърво — в кой отрасъл работи вашият бизнес?", qr: ['HoReCa (Хотел/Ресторант/Кафене)', 'E-commerce (Онлайн магазин)', 'SME (Малък/Среден бизнес)', 'Логистика', 'Друго'] },
    2: (industry) => ({ msg: 'Отличен избор! Бизнесите в ' + (industry === 'HoReCa' ? 'HoReCa' : industry === 'E-commerce' ? 'E-commerce' : industry === 'Logistics' ? 'логистиката' : 'този сектор') + ' се сблъскат с уникални предизвикателства. Какво е ГОЛЯМОТО предизвикателство, което ви не оставя да спите? Бъдете конкретни.', ph: "напр. 'Ресторантът ми има 40 служители, но 40% си тръгват'" }),
    3: { msg: 'Колко дълго трае този проблем? И колко хора засяга?', ph: "напр. 'Около 6 месеца, засяга всички 40 служители'" },
    4: { msg: 'Какво сте опитвали вече? Какво е сработило и какво не?', ph: "напр. 'Опитахме агенции, но качеството беше ниско'" },
    5: { msg: 'Ако проблемът беше решен утре, какъв би бил най-голям ефектът?', ph: "напр. 'Спестяване на €5,000/месец'" },
    6: { msg: 'Какъв е приблизителният ви месечен оборот?', qr: ['Под €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Предпочитам да не казвам'] },
    7: (industry, problems) => ({ msg: 'Благодаря, че споделихте!\n\n**Отрасъл:** ' + industry + '\n**Предизвикателства:** ' + problems.join(', ') + '\n\nТипично се наблюдава подобрение от 20-40% за 6-8 седмици. Нашият анализ започва от €300.\n\nЗа безплатна оценка, моля споделете данните си:', leadCapture: true })
  }
};

function generateResponse(step, msg, history) {
  const allText = history.map(m => m.text).join(' ');
  const lang = detectLanguage(msg);
  const industry = detectIndustry(allText);
  const problems = detectProblems(msg);
  const r = responses[lang] || responses.en;
  
  if (step === 1) return r[1];
  if (step === 2) return r[2](industry);
  if (step === 3) return r[3];
  if (step === 4) return r[4];
  if (step === 5) return r[5];
  if (step === 6) return r[6];
  if (step === 7) return r[7](industry, problems);
  return { msg: lang === 'bg' ? 'Благодаря! Има ли нещо друго?' : 'Thank you! Is there anything else?' };
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

module.exports = { processMessage, initTable, saveLead, detectIndustry, detectProblems, detectLanguage };
