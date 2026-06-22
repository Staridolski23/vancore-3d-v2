const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'vancore-3d', 'src', 'data', 'vera-knowledge-base.json');
let kb = {};
try { kb = JSON.parse(fs.readFileSync(kbPath, 'utf8')); } catch(e) { console.warn('KB load failed'); }

// Language detection
function detectLanguage(text) {
  const bulgarianWords = /(здравей|добър ден|благодаря|какво|колко|искам|знам|могу|трябва|няма|може|бъде|българия|работа|бизнес|проблем|помощ|моля|онлайн|магазин|дрехи|създам|започна|имам|търся|нужда|иска|знае|може|става|работя|нямам|голям|малък|нов|стар|добре|зле|много|малко|как|къде|кога|защо|кой|какво)/i;
  const cyrillicCount = (text.match(/[а-яА-Я]/g) || []).length;
  const totalChars = text.length;
  if (bulgarianWords.test(text) || (cyrillicCount > totalChars * 0.3 && /[ъь]/.test(text))) return 'bg';
  return 'en';
}

// Industry detection
function detectIndustry(allText) {
  const t = allText.toLowerCase();
  if (/hotel|restaurant|cafe|bar|hospitality|kitchen|chef|waiter|guest|room|reservation|menu|food|хотел|ресторант|кафене|бар|кухня|готвач|сервитьор|гост|резервация|меню|храна/.test(t)) return 'HoReCa';
  if (/e-commerce|ecommerce|online store|shop|shipping|orders|returns|fulfillment|warehouse|delivery|онлайн магазин|доставки|поръчки|онлайн|магазин|дрехи|обувки|аксесоари|e-shop/.test(t)) return 'E-commerce';
  if (/logistics|delivery|fleet|vehicles|routes|scheduling|supply chain|transportation|drivers|логистика|доставки|автопарк|превозни средства|маршрути|графици|верига на доставки|транспорт|шофьори/.test(t)) return 'Logistics';
  if (/small business|medium enterprise|startup|founder|owner|team|processes|growth|scaling|малък бизнес|средно предприятие|стартап|основател|собственик|екип|процеси|растеж|скалиране/.test(t)) return 'SME';
  return 'SME';
}

// Problem detection
function detectProblems(allText) {
  const t = allText.toLowerCase();
  const found = [];
  if (/staff|employees|turnover|hiring|training|people leave|retention|служители|наемане|обучение|текучест|задържане|персонал/.test(t)) found.push('hr');
  if (/slow|chaos|disorganized|bottleneck|waste|errors|manual|inefficient|бавен|хаос|дезорганизиране|задръстване|грешки|ръчен|неефективен/.test(t)) found.push('operations');
  if (/costs|expenses|cash flow|profit|budget|losing money|pricing|margins|разходи|приходи|кеш флоу|печалба|бюджет|загуба|ценообразуване|марж/.test(t)) found.push('financial');
  if (/no customers|visibility|competition|brand|online presence|advertising|няма клиенти|видимост|конкуренция|бранд|онлайн присъствие|реклама|маркетинг/.test(t)) found.push('marketing');
  if (/delivery|shipping|routes|scheduling|wait time|доставка|маршрути|графици|време на чакане/.test(t)) found.push('logistics');
  if (/can't grow|too much work|overwhelmed|need more people|expand|не мога да разрасна|прекалено много работа|нужда от повече хора|разширяване/.test(t)) found.push('scaling');
  if (/no system|manual|spreadsheet|digitalize|automate|няма система|ръчен|таблица|дигитализирам|автоматизирам/.test(t)) found.push('technology');
  if (/compliance|regulations|permits|licenses|contracts|laws|съответствие|нормативи|разрешения|лицензи|договори|закони/.test(t)) found.push('legal');
  if (/start|new business|launch|begin|начало|нов бизнес|стартирам|започна/.test(t)) found.push('starting');
  return found.length > 0 ? found : ['general'];
}

// Main response generator — professional AI agent
function generateResponse(message, history, step) {
  const lang = detectLanguage(message);
  const allText = history.map(m => m.text).join(' ').toLowerCase() + ' ' + message.toLowerCase();
  const industry = detectIndustry(allText);
  const problems = detectProblems(allText);
  const msg = message.toLowerCase();
  const isFirst = history.length <= 1;
  
  // Translations
  const T = {
    en: {
      greeting: "Hello! I'm Vera, VANCORE's AI business analyst. I help small and medium businesses identify hidden inefficiencies, reduce costs, and unlock growth.\n\nI'm an AI assistant — I'll ask you a few questions to understand your situation, then connect you with our human consultants for a detailed assessment.\n\nWhat industry is your business in?",
      ecommerce: "E-commerce is a competitive space — success depends on operational efficiency, customer experience, and smart marketing. What's your biggest challenge right now?",
      horeca: "HoReCa is one of our core specialties. The sector faces unique challenges — from staff retention to kitchen efficiency and guest satisfaction. What's keeping you up at night?",
      logistics: "Logistics optimization can dramatically reduce costs and improve customer satisfaction. We've helped companies cut wait times by 83% and fuel costs by 18%. What's your biggest pain point?",
      sme: "SMEs are the backbone of the economy, but many struggle with processes that don't scale. What's the one thing holding your business back?",
      starting: "Starting a new business is exciting! The key is building the right foundation — market validation, efficient processes, and a clear growth strategy. What type of business are you planning?",
      askMore: "That's helpful context. Can you tell me more about the specific impact this is having on your business? For example: lost revenue, wasted time, customer complaints, staff frustration?",
      askDuration: "How long has this been a challenge? And how many people does it affect — your team, customers, or both?",
      askTried: "What have you already tried to address this? Understanding what hasn't worked helps me recommend the right approach.",
      askImpact: "If we could solve this one problem in the next 60 days, what would be the biggest measurable impact on your business?",
      askRevenue: "What's your approximate monthly revenue range? This helps me recommend the right service package for your situation.",
      assessment: "Based on everything you've shared, here's my preliminary assessment:\n\n",
      cta: "\n\n**Next Steps:**\nI'd recommend a free 30-minute assessment call with our senior consultants. They'll review your situation in detail and provide a tailored proposal.\n\nTo schedule your free assessment, please share your contact details:",
      thanks: "Thank you for the conversation! Our team will review your case and get back to you within 24 hours. Is there anything else I can help with?",
      fallback: "I want to make sure I understand correctly. Could you rephrase that or tell me more about your specific situation?",
      qrIndustry: ['HoReCa (Hotel/Restaurant/Cafe)', 'E-commerce', 'SME (Small/Medium Enterprise)', 'Logistics', 'Other'],
      qrProblem: ['Operations & Processes', 'Marketing & Sales', 'Finance & Pricing', 'HR & Team', 'Growth & Scaling', 'Technology & Systems'],
      qrRevenue: ['Under €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Prefer not to say']
    },
    bg: {
      greeting: "Здравейте! Аз съм Vera, AI бизнес анализатор на VANCORE. Помагам на малките и средни предприятия да идентифицират скрити неефективности, да намалят разходите и да отключат растеж.\n\nАз съм AI асистент — ще ви задам няколко въпроса, за да разбера ситуацията ви, и след това ще ви свържа с нашите консултанти за подробна оценка.\n\nВ кой отрасъл работи вашият бизнес?",
      ecommerce: "E-commerce е конкурентна ниша — успехът зависи от операционна ефективност, клиентско изживяване и умен маркетинг. Какво е най-голямото ви предизвикателство в момента?",
      horeca: "HoReCa е една от нашите основни специалности. Секторът се сблъсква с уникални предизвикателства — от задържане на персонал до ефективност на кухнята и удовлетвореност на гостите. Какво ви не оставя да спите?",
      logistics: "Оптимизацията на логистиката може драматично да намали разходите и да подобри удовлетвореността на клиентите. Помогнахме на компании да намалят времето на чакане с 83% и горивните разходи с 18%. Какъв е най-големият ви проблем?",
      sme: "Малките и средни предприятия са гръбнакът на икономиката, но много се затрудняват с процеси, които не скалират. Какво е това, което задържа бизнеса ви?",
      starting: "Започването на нов бизнес е вълнуващо! Ключът е да изградите правилната основа — валидиране на пазара, ефективни процеси и ясна стратегия за растеж. Какъв тип бизнес планирате?",
      askMore: "Това е полезен контекст. Можете ли да ми разкажете повече за конкретния ефект върху бизнеса ви? Например: загубени приходи, изгубено време, оплаквания от клиенти, фрустрация на екипа?",
      askDuration: "Колко дълго трае това предизвикателство? И колко хора засяга — екипа, клиентите или и двете?",
      askTried: "Какво сте опитвали вече да решите това? Разбирането на това, коо не е сработило, ми помага да препоръчам правилния подход.",
      askImpact: "Ако този проблем беше решен в следващите 60 дни, какъв би бил най-големият измерим ефект върху бизнеса ви?",
      askRevenue: "Какъв е приблизителният ви месечен оборот? Това ми помага да препоръчам правилния пакет услуги за вашата ситуация.",
      assessment: "Въз основа на всичко, коо споделихте, ето моята предварителна оценка:\n\n",
      cta: "\n\n**Следващи стъпки:**\nПрепоръчвам безплатна 30-минутна консултация с нашите старши консултанти. Те ще прегледат ситуацията ви подробно и ще подготвят персонализирано предложение.\n\nЗа да запишете безплатната оценка, моля споделете контактните си данни:",
      thanks: "Благодаря за разговора! Нашият екип ще прегледа случая ви и ще се свърже с вас в рамките на 24 часа. Има ли нещо друго, с което мога да помогна?",
      fallback: "Искам да се уверя, че разбирам правилно. Можете ли да преформулирате или да ми разкажете повече за конкретната си ситуация?",
      qrIndustry: ['HoReCa (Хотел/Ресторант)', 'E-commerce (Онлайн магазин)', 'SME (Малък/Среден бизнес)', 'Логистика', 'Друго'],
      qrProblem: ['Операции и процеси', 'Маркетинг и продажби', 'Финанси и ценообразуване', 'HR и екип', 'Растеж и скалиране', 'Технологии и системи'],
      qrRevenue: ['Под €10K', '€10K-€50K', '€50K-€200K', '€200K+', 'Предпочитам да не казвам']
    }
  };
  
  const t = T[lang] || T.en;
  
  // First message
  if (isFirst || step === 1) {
    return { msg: t.greeting, qr: t.qrIndustry, ph: '' };
  }
  
  // Detect what user is talking about
  const isEcommerce = /e-commerce|online store|shop|онлайн магазин|дрехи|обувки|аксесоари|интернет магазин/.test(msg);
  const isHoReCa = /hotel|restaurant|cafe|bar|хотел|ресторант|кафене|бар/.test(msg);
  const isLogistics = /logistics|delivery|fleet|логистика|доставки/.test(msg);
  const isStarting = /start|new business|launch|begin|начало|нов бизнес|стартирам|започна/.test(msg);
  const hasProblem = /problem|issue|challenge|struggle|трудност|проблем|предизвикателство/.test(msg);
  
  // Step 2: Industry detected → ask about challenge
  if (step === 2) {
    if (isEcommerce) return { msg: t.ecommerce, qr: t.qrProblem, ph: '' };
    if (isHoReCa) return { msg: t.horeca, qr: t.qrProblem, ph: '' };
    if (isLogistics) return { msg: t.logistics, qr: t.qrProblem, ph: '' };
    if (isStarting) return { msg: t.starting, qr: t.qrIndustry, ph: '' };
    return { msg: t.ecommerce, qr: t.qrProblem, ph: '' };
  }
  
  // Step 3: Problem detected → ask for more detail
  if (step === 3) {
    return { msg: t.askMore, qr: null, ph: lang === 'bg' ? 'Опишете проблема си...' : 'Describe your problem...' };
  }
  
  // Step 4: Ask about duration and scale
  if (step === 4) {
    return { msg: t.askDuration, qr: null, ph: lang === 'bg' ? 'напр. 6 месеца, засяга целия екип' : 'e.g. 6 months, affects whole team' };
  }
  
  // Step 5: Ask about what they tried
  if (step === 5) {
    return { msg: t.askTried, qr: null, ph: '' };
  }
  
  // Step 6: Ask about impact
  if (step === 6) {
    return { msg: t.askImpact, qr: null, ph: lang === 'bg' ? 'напр. Спестяване €5,000/месец' : 'e.g. Save €5,000/month' };
  }
  
  // Step 7: Ask about revenue
  if (step === 7) {
    return { msg: t.askRevenue, qr: t.qrRevenue, ph: '' };
  }
  
  // Step 8+: Provide assessment and lead capture
  if (step >= 8) {
    const indName = industry === 'E-commerce' ? (lang === 'bg' ? 'E-commerce' : 'E-commerce') :
                    industry === 'HoReCa' ? (lang === 'bg' ? 'HoReCa' : 'HoReCa') :
                    industry === 'Logistics' ? (lang === 'bg' ? 'Логистика' : 'Logistics') :
                    (lang === 'bg' ? 'SME' : 'SME');
    
    const probNames = problems.map(p => {
      const n = { 'hr': lang === 'bg' ? 'HR и персонал' : 'HR & staff', 'operations': lang === 'bg' ? 'Операции' : 'Operations', 'financial': lang === 'bg' ? 'Финанси' : 'Finance', 'marketing': lang === 'bg' ? 'Маркетинг' : 'Marketing', 'logistics': lang === 'bg' ? 'Логистика' : 'Logistics', 'scaling': lang === 'bg' ? 'Растеж' : 'Scaling', 'technology': lang === 'bg' ? 'Технологии' : 'Technology', 'legal': lang === 'bg' ? 'Правни' : 'Legal', 'starting': lang === 'bg' ? 'Стартиране' : 'Starting', 'general': lang === 'bg' ? 'Общ анализ' : 'General' };
      return n[p] || p;
    }).join(', ');
    
    const assessment = t.assessment + 
      (lang === 'bg' ? '**Отрасъл:** ' + indName + '\n**Предизвикателства:** ' + probNames + '\n\n' : '**Industry:** ' + indName + '\n**Challenges:** ' + probNames + '\n\n') +
      (lang === 'bg' ? 'Въз основа на подобни случаи, типично се наблюдава подобрение от 20-40% по ключови метрики в рамките на 6-8 седмици. Нашият анализ започва от €300.\n\n' : 'Based on similar cases, we typically see 20-40% improvement in key metrics within 6-8 weeks. Our analysis starts at €300.\n\n') +
      t.cta;
    
    return { msg: assessment, qr: null, ph: '', leadCapture: true };
  }
  
  return { msg: t.fallback, qr: null, ph: '' };
}

function processMessage(message, state) {
  const step = state.step || 1;
  const history = state.history || [];
  const newHistory = [...history, { role: 'user', text: message, ts: new Date().toISOString() }];
  const resp = generateResponse(message, newHistory, step);
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
