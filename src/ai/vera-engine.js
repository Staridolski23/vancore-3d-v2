const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'vancore-3d', 'src', 'data', 'vera-knowledge-base.json');
let kb = {};
try { kb = JSON.parse(fs.readFileSync(kbPath, 'utf8')); } catch(e) { console.warn('KB load failed'); }

// Language detection
function detectLanguage(text) {
  const bulgarianWords = /(здравей|добър ден|благодаря|какво|колко|искам|знам|могу|трябва|няма|може|бъде|българия|работа|бизнес|проблем|помощ|моля|онлайн|магазин|дрехи|създам|започна|имам|търся|нужда|иска|знае|може|става|работя|имам|нямам|голям|малък|нов|стар|добре|зле|много|малко|как|къде|кога|защо|кой|какво)/i;
  const cyrillicCount = (text.match(/[а-яА-Я]/g) || []).length;
  const totalChars = text.length;
  if (bulgarianWords.test(text) || (cyrillicCount > totalChars * 0.3 && /[ъь]/.test(text))) return 'bg';
  return 'en';
}

// Industry detection from full conversation
function detectIndustry(allText) {
  const text = allText.toLowerCase();
  if (/hotel|restaurant|cafe|bar|hospitality|kitchen|chef|waiter|guest|room|reservation|menu|food|хотел|ресторант|кафене|бар|кухня|готвач|сервитьор|гост|резервация|меню|храна/.test(text)) return 'HoReCa';
  if (/e-commerce|ecommerce|online store|shop|shipping|orders|returns|fulfillment|warehouse|delivery|онлайн магазин|доставки|поръчки|онлайн|магазин|дрехи|обувки|аксесоари|e-shop/.test(text)) return 'E-commerce';
  if (/logistics|delivery|fleet|vehicles|routes|scheduling|supply chain|transportation|drivers|логистика|доставки|автопарк|превозни средства|маршрути|графици|верига на доставки|транспорт|шофьори/.test(text)) return 'Logistics';
  if (/small business|medium enterprise|startup|founder|owner|team|processes|growth|scaling|малък бизнес|средно предприятие|стартап|основател|собственик|екип|процеси|растеж|скалиране/.test(text)) return 'SME';
  return 'SME';
}

// Problem detection from full conversation
function detectProblems(allText) {
  const text = allText.toLowerCase();
  const found = [];
  if (/staff|employees|turnover|hiring|training|people leave|retention|служители|наемане|обучение|текучест|задържане|персонал/.test(text)) found.push('hr_turnover');
  if (/slow|chaos|disorganized|bottleneck|waste|errors|manual|inefficient|бавен|хаос|дезорганизиране|задръстване|грешки|ръчен|неефективен/.test(text)) found.push('operational');
  if (/costs|expenses|cash flow|profit|budget|losing money|pricing|margins|разходи|приходи|кеш флоу|печалба|бюджет|загуба|ценообразуване|марж/.test(text)) found.push('financial');
  if (/no customers|visibility|competition|brand|online presence|advertising|няма клиенти|видимост|конкуренция|бранд|онлайн присъствие|реклама|маркетинг/.test(text)) found.push('marketing');
  if (/delivery|shipping|routes|scheduling|wait time|доставка|маршрути|графици|време на чакане/.test(text)) found.push('logistics');
  if (/can't grow|too much work|overwhelmed|need more people|expand|не мога да разрасна|прекалено много работа|нужда от повече хора|разширяване/.test(text)) found.push('scaling');
  if (/no system|manual|spreadsheet|digitalize|automate|няма система|ръчен|таблица|дигитализирам|автоматизирам/.test(text)) found.push('technology');
  if (/compliance|regulations|permits|licenses|contracts|laws|съответствие|нормативи|разрешения|лицензи|договори|закони/.test(text)) found.push('legal');
  if (/start|new business|launch|begin|начало|нов бизнес|стартирам|започна/.test(text)) found.push('starting');
  return found.length > 0 ? found : ['general'];
}

// Smart response generator that actually reads what user said
function generateSmartResponse(message, history, step) {
  const lang = detectLanguage(message);
  const allText = history.map(m => m.text).join(' ').toLowerCase() + ' ' + message.toLowerCase();
  const industry = detectIndustry(allText);
  const problems = detectProblems(allText);
  
  const isFirstMessage = history.length <= 1;
  const userMsg = message.toLowerCase();
  
  // Determine what user is actually talking about
  const isStarting = /start|new business|launch|begin|начало|нов бизнес|стартирам|започна|искам да направя/.test(userMsg);
  const isEcommerce = /e-commerce|online store|shop|онлайн магазин|дрехи|обувки|аксесоари|интернет магазин/.test(userMsg);
  const isHoReCa = /hotel|restaurant|cafe|bar|хотел|ресторант|кафене|бар/.test(userMsg);
  const isLogistics = /logistics|delivery|fleet|логистика|доставки/.test(userMsg);
  const hasProblem = /problem|issue|challenge|struggle|трудност|проблем|предизвикателство/.test(userMsg);
  const hasQuestion = /\?|как|какво|колко|къде|кога|защо|кой/.test(userMsg);
  
  // Bilingual responses
  const T = {
    en: {
      greeting: "Hello! I'm Vera, VANCORE's AI business analyst. I help businesses identify hidden inefficiencies and growth opportunities. What can I help you with today?",
      askIndustry: "What industry is your business in? Or are you planning to start a new one?",
      ecommerce: "E-commerce is a great choice! The online retail market is growing fast, but competition is fierce. What specific aspect would you like help with — operations, marketing, logistics, or strategy?",
      horeca: "HoReCa is one of our specialties! From restaurants to hotels, we help optimize operations, reduce staff turnover, and increase profitability. What's your biggest challenge?",
      logistics: "Logistics is all about optimization — routes, schedules, costs. We've helped companies reduce wait times by 83% and cut fuel costs by 18%. What's your situation?",
      sme: "Small and medium enterprises are the backbone of the economy. We help founders break through bottlenecks and build systems that scale. What's keeping you up at night?",
      starting: "Starting a new business is exciting! The key is to validate your idea, understand your market, and build efficient processes from day one. What type of business are you planning?",
      problem: "I understand. Can you tell me more about the specific problem? The more details you give, the better I can help.",
      followUp: "That's helpful context. Based on what you've shared, here are some initial thoughts:\n\n",
      cta: "\n\nWould you like to schedule a free 30-minute assessment call with our team? We can provide a detailed analysis and actionable recommendations.",
      leadCapture: "To schedule your free assessment, please share your details:",
      thanks: "Thank you! Is there anything else you'd like to discuss?",
      quickReplies: {
        industry: ['HoReCa', 'E-commerce', 'SME', 'Logistics', 'Other'],
        problem: ['Operations', 'Marketing', 'Finance', 'HR', 'Growth', 'Technology'],
        revenue: ['Under €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Prefer not to say']
      }
    },
    bg: {
      greeting: "Здравейте! Аз съм Vera, AI бизнес анализатор на VANCORE. Помагам на бизнесите да идентифицират скрити неефективности и възможности за растеж. Как мога да ви помогна?",
      askIndustry: "В кой отрасъл работите? Или планирате да започнете нов бизнес?",
      ecommerce: "E-commerce е отличен избор! Онлайн търговията расте бързо, но конкуренцията е жестока. С какъв аспект искате помощ — операции, маркетинг, логистика или стратегия?",
      horeca: "HoReCa е една от нашите специалности! От ресторанти до хотели, помагаме за оптимизация на операциите, намаляване на текучестта и увеличаване на печалбата. Какво е най-голямото ви предизвикателство?",
      logistics: "Логистиката е всичко около оптимизация — маршрути, графици, разходи. Помогнахме на компании да намалят времето на чакане с 83% и горивните разходи с 18%. Каква е вашата ситуация?",
      sme: "Малките и средни предприятия са гръбнакът на икономиката. Помагаме на основателите да преодолеят задръстването и да изградят системи, които скалират. Какво ви не оставя да спите?",
      starting: "Започването на нов бизнес е вълнуващо! Ключът е да валидирате идеята, да разберете пазара и да изградите ефективни процеси от ден едно. Какъв тип бизнес планирате?",
      problem: "Разбирам. Можете ли да ми разкажете повече за конкретния проблем? Колкото повече детайли дадете, толкова по-добре мога да помогна.",
      followUp: "Това е полезен контекст. Въз основа на това, коо shared, ето няколко първоначални мисли:\n\n",
      cta: "\n\nИскате ли да запишете безплатна 30-минутна консултация с нашия екип? Можем да предоставим подробен анализ и конкретни препоръки.",
      leadCapture: "За да запишете безплатна оценка, моля споделете данните си:",
      thanks: "Благодаря! Има ли нещо друго, което бихте искали да обсъдите?",
      quickReplies: {
        industry: ['HoReCa (Хотел/Ресторант)', 'E-commerce (Онлайн магазин)', 'SME (Малък/Среден бизнес)', 'Логистика', 'Друго'],
        problem: ['Операции', 'Маркетинг', 'Финанси', 'HR', 'Растеж', 'Технологии'],
        revenue: ['Под €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Предпочитам да не казвам']
      }
    }
  };
  
  const t = T[lang] || T.en;
  
  // First message — greeting
  if (isFirstMessage || step === 1) {
    return { msg: t.greeting, qr: null, ph: '' };
  }
  
  // Analyze what user said and respond contextually
  if (isEcommerce && step <= 3) {
    return { msg: t.ecommerce, qr: t.quickReplies.problem, ph: '' };
  }
  
  if (isHoReCa && step <= 3) {
    return { msg: t.horeca, qr: t.quickReplies.problem, ph: '' };
  }
  
  if (isLogistics && step <= 3) {
    return { msg: t.logistics, qr: t.quickReplies.problem, ph: '' };
  }
  
  if (isStarting && step <= 3) {
    return { msg: t.starting, qr: t.quickReplies.industry, ph: '' };
  }
  
  if (hasProblem && step <= 4) {
    return { msg: t.problem, qr: null, ph: lang === 'bg' ? "Опишете проблема си..." : "Describe your problem..." };
  }
  
  // After collecting enough info, provide assessment
  if (step >= 5) {
    const industryName = industry === 'E-commerce' ? (lang === 'bg' ? 'E-commerce' : 'E-commerce') : 
                          industry === 'HoReCa' ? (lang === 'bg' ? 'HoReCa' : 'HoReCa') :
                          industry === 'Logistics' ? (lang === 'bg' ? 'Логистика' : 'Logistics') :
                          (lang === 'bg' ? 'SME' : 'SME');
    
    const problemNames = problems.map(p => {
      const names = {
        'hr_turnover': lang === 'bg' ? 'HR и задържане' : 'HR & retention',
        'operational': lang === 'bg' ? 'Операционна ефективност' : 'Operational efficiency',
        'financial': lang === 'bg' ? 'Финансово управление' : 'Financial management',
        'marketing': lang === 'bg' ? 'Маркетинг' : 'Marketing',
        'logistics': lang === 'bg' ? 'Логистика' : 'Logistics',
        'scaling': lang === 'bg' ? 'Растеж' : 'Scaling',
        'technology': lang === 'bg' ? 'Технологии' : 'Technology',
        'legal': lang === 'bg' ? 'Правни въпроси' : 'Legal',
        'starting': lang === 'bg' ? 'Стартиране на бизнес' : 'Starting a business',
        'general': lang === 'bg' ? 'Общ анализ' : 'General analysis'
      };
      return names[p] || p;
    }).join(', ');
    
    const assessment = t.followUp + 
      (lang === 'bg' ? `**Отрасъл:** ${industryName}\n**Предизвикателства:** ${problemNames}\n\n` : `**Industry:** ${industryName}\n**Challenges:** ${problemNames}\n\n`) +
      (lang === 'bg' ? 'Въз основа на подобни случаи, типично се наблюдава подобрение от 20-40% по ключови метрики в рамките на 6-8 седмици.\n\n' : 'Based on similar cases, we typically see 20-40% improvement in key metrics within 6-8 weeks.\n\n') +
      t.cta;
    
    return { msg: assessment, qr: null, ph: '', leadCapture: true };
  }
  
  // Default follow-up
  return { msg: t.askIndustry, qr: t.quickReplies.industry, ph: '' };
}

function processMessage(message, state) {
  const step = state.step || 1;
  const history = state.history || [];
  const newHistory = [...history, { role: 'user', text: message, ts: new Date().toISOString() }];
  const resp = generateSmartResponse(message, newHistory, step);
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
