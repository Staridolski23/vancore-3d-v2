'use client';

import { useState, useEffect, useRef } from 'react';

const API_URL = 'https://unengaged-awning-briskly.ngrok-free.dev/api';

export default function ClientPortal() {
  const [user, setUser] = useState<{ id: string; email: string; company?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booked, setBooked] = useState(false);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'analyses' | 'tasks' | 'files' | 'chat'>('dashboard');
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadMeetings();
      loadAnalyses();
      loadTasks();
      loadFiles();
      loadChat();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (res.ok) setUser(await res.json());
    } catch (e) {
      // not logged in
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, company };
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Грешка');
    setUser(data);
    setEmail('');
    setPassword('');
    setCompany('');
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    setUser(null);
    setMeetings([]);
    setSlots([]);
    setTasks([]);
    setFiles([]);
    setChatMessages([]);
  };

  const loadMeetings = async () => {
    if (!user) return;
    const res = await fetch(`${API_URL}/meetings`);
    const data = await res.json();
    setMeetings(data.filter((m: any) => m.user_id === user.id).reverse());
  };

  const loadAnalyses = async () => {
    if (!user) return;
    const res = await fetch(`${API_URL}/analyses`);
    const data = await res.json();
    setFiles((prev) => [...prev, ...data.filter((item: any) => item.user_id === user.id)]);
  };

  const loadTasks = async () => {
    if (!user) return;
    const res = await fetch(`${API_URL}/cases`);
    const data = await res.json();
    const mapped = data.map((c: any, idx: number) => ({
      id: c.id || `case-${idx}`,
      title: c.problem,
      status: c.status === 'completed' ? 'Завършена' : c.status === 'analyzed' ? 'Анализ' : 'В процес',
      priority: c.status === 'completed' ? 'low' : 'high',
    }));
    setTasks(mapped);
  };

  const loadFiles = async () => {
    if (!user) return;
    setFiles((prev) => [
      ...prev,
      { id: 'welcome', name: 'Добре дошли в VANCORE.pdf', size: '124 KB', date: new Date().toISOString().split('T')[0] },
    ]);
  };

  const loadChat = async () => {
    setChatMessages([
      { id: '1', from: 'support', text: 'Здравейте! Аз съм от екипа на VANCORE. Как мога да ви помогна?', time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  useEffect(() => {
    if (selectedDate && user) {
      setLoadingSlots(true);
      fetch(`${API_URL}/meetings/available?date=${selectedDate}`)
        .then((res) => res.json())
        .then(setSlots)
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate]);

  const bookSlot = async (time: string) => {
    if (!user) return;
    await fetch(`${API_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        user_email: user.email,
        user_name: user.email,
        company: user.company || '',
        date: selectedDate,
        time,
        notes,
      }),
    });
    setBooked(true);
    setNotes('');
    loadMeetings();
    setTimeout(() => setBooked(false), 3000);
  };

  const cancelMeeting = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да отмените тази среща?')) return;
    await fetch(`${API_URL}/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    loadMeetings();
  };

  const sendChat = async () => {
    if (!chatInput.trim() || sendingChat) return;
    const text = chatInput.trim();
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), from: 'user', text, time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
    setSendingChat(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), from: 'support', text: 'Благодаря! Екипът ни ще отговори в рамките на 24 часа.', time: new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) }]);
    setSendingChat(false);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled' && m.date >= new Date().toISOString().split('T')[0]);
  const progress = tasks.length ? Math.round((tasks.filter((t) => t.status === 'Завършена').length / tasks.length) * 100) : 0;

  if (loading) {
    return <div className="glass rounded-2xl p-6 border border-white/5"><p className="text-sm text-vancore-muted">Зареждане...</p></div>;
  }

  if (user) {
    const tabs = [
      { id: 'dashboard', label: 'Табло' },
      { id: 'analyses', label: 'AI анализи' },
      { id: 'tasks', label: 'Задачи' },
      { id: 'files', label: 'Документи' },
      { id: 'chat', label: 'Чат' },
    ];

    return (
      <div className="glass rounded-3xl border border-white/5 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold">Добре дошли, {user.email}</h3>
            {user.company && <p className="text-sm text-vancore-muted">{user.company}</p>}
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors">Изход</button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-vancore-bronze/20 text-vancore-gold' : 'bg-white/5 text-vancore-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-vancore-muted">Предстоящи срещи</div>
                <div className="text-2xl font-black text-vancore-gold">{upcomingMeetings.length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-vancore-muted">AI анализи</div>
                <div className="text-2xl font-black text-vancore-gold">{files.filter((f) => f.industry).length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-vancore-muted">Задачи</div>
                <div className="text-2xl font-black text-vancore-gold">{tasks.length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-vancore-muted">Прогрес</div>
                <div className="text-2xl font-black text-vancore-gold">{progress}%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold">Запазване на консултация</h4>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div>
                  <label className="block text-xs text-vancore-muted mb-1">Дата</label>
                  <input type="date" min={tomorrow.toISOString().split('T')[0]} max={maxDate.toISOString().split('T')[0]} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setBooked(false); }} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
                </div>
                {booked && <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">✅ Срещата е запазена успешно!</span>}
              </div>
              <div>
                <label className="block text-xs text-vancore-muted mb-2">Налични часове за {selectedDate}</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {slots.map((time) => (
                    <button key={time} onClick={() => bookSlot(time)} className="py-2.5 rounded-xl text-xs font-semibold bg-vancore-bronze/10 text-vancore-gold border border-vancore-bronze/20 hover:bg-vancore-bronze/20 transition-all">
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-2">Прогрес</h4>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-vancore-bronze to-vancore-gold" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-vancore-muted mt-1">{progress}% завършени задачи</p>
            </div>
          </div>
        )}

        {tab === 'analyses' && (
          <div className="space-y-3">
            <h4 className="text-lg font-bold">История на AI анализите</h4>
            {files.filter((f) => f.industry).length === 0 ? (
              <p className="text-sm text-vancore-muted">Няма анализи още.</p>
            ) : (
              <div className="space-y-2">
                {files.filter((f) => f.industry).map((item: any) => (
                  <div key={item.id} className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-vancore-light">{item.industry}</div>
                      <p className="text-xs text-vancore-muted">{item.problem}</p>
                      <p className="text-[10px] text-vancore-muted">{new Date(item.created_at).toLocaleDateString('bg-BG')}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-vancore-muted">Анализ</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            <h4 className="text-lg font-bold">Списък с препоръки и задачи</h4>
            {tasks.length === 0 ? (
              <p className="text-sm text-vancore-muted">Няма задачи още.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-vancore-light">{task.title}</div>
                    <p className="text-xs text-vancore-muted">{task.status}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase border ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-vancore-muted border-white/10'}`}>{task.priority}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Документооборот</h4>
              <label className="px-3 py-1.5 bg-vancore-bronze/10 text-vancore-bronze rounded-lg text-xs cursor-pointer hover:bg-vancore-bronze/20 transition-colors">
                Качи файл
                <input type="file" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFiles((prev) => [...prev, { id: Date.now().toString(), name: file.name, size: `${Math.round(file.size / 1024)} KB`, date: new Date().toISOString().split('T')[0] }]);
                }} />
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-sm text-vancore-muted">Няма качени файлове.</p>
            ) : (
              <div className="space-y-2">
                {files.map((file: any) => (
                  <div key={file.id} className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-vancore-light">{file.name}</div>
                      <p className="text-xs text-vancore-muted">{file.size} • {file.date}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-vancore-muted">Файл</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div className="space-y-3">
            <h4 className="text-lg font-bold">Чат с екипа</h4>
            <div className="glass rounded-2xl border border-white/5 p-4 h-80 overflow-y-auto space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.from === 'user' ? 'bg-vancore-bronze/20 text-vancore-light rounded-tr-sm' : 'bg-white/5 text-vancore-muted rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className="text-[10px] text-vancore-muted mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Напишете съобщение..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
              <button onClick={sendChat} disabled={sendingChat} className="px-4 py-2.5 bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark rounded-xl text-sm font-semibold disabled:opacity-50">Изпрати</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5 max-w-md mx-auto space-y-4">
      <h3 className="text-lg font-bold text-center">Клиентски портал</h3>
      <div className="flex rounded-lg bg-white/5 p-1">
        <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Вход</button>
        <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-vancore-bronze/20 text-vancore-gold' : 'text-vancore-muted'}`}>Регистрация</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Имейл</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        <div>
          <label className="block text-xs text-vancore-muted mb-1">Парола</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-xs text-vancore-muted mb-1">Компания (опционално)</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-vancore-bronze/40" />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vancore-bronze to-vancore-gold text-vancore-dark font-semibold">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </button>
      </form>
    </div>
  );
}
