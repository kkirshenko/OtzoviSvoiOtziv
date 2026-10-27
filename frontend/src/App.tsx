import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, BrainCircuit, Check, Clock3, FileText, History, MessageSquareText, Search, Send, ShieldAlert, Sparkles, Zap, ExternalLink, Download } from 'lucide-react';

type Issue = { category: string; severity: 'Критическая' | 'Высокая' | 'Средняя' | 'Низкая'; evidence: string; recommendation: string };
type Analysis = { sentiment: string; score: number; summary: string; issues: Issue[]; recommendations: string[]; risk: string };
type ReviewRecord = { id: number; review: string; analyzedAt: string; analysis: Analysis };
type Stats = { totalReviews: number; requiresAttention: number; positiveReviews: number; averageScore: number };
type Tab = 'overview' | 'history' | 'reports';

const examples = [
  'Купил наушники неделю назад. Звук отличный, батарея держит долго, но амбушюры натирают уши.',
  'Официант был грубым, заказ принесли холодным, а ждать счёт пришлось двадцать минут.',
  'Поддержка быстро помогла восстановить доступ. Всё объяснили спокойно и понятно, спасибо!'
];
const emptyStats: Stats = { totalReviews: 0, requiresAttention: 0, positiveReviews: 0, averageScore: 0 };
const apiBase = () => (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const severityClass = (severity: string) => severity === 'Критическая' ? 'critical' : severity === 'Высокая' ? 'high' : severity === 'Средняя' ? 'medium' : 'low';
const dateLabel = (value: string) => new Date(value).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

export default function App() {
  const [review, setReview] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<ReviewRecord[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Все отзывы');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(apiBase() + '/api/reviews'),
        fetch(apiBase() + '/api/reviews/stats')
      ]);
      if (!historyResponse.ok || !statsResponse.ok) throw new Error('Не удалось загрузить историю и статистику API.');
      const [records, currentStats] = await Promise.all([historyResponse.json(), statsResponse.json()]);
      setHistory(records as ReviewRecord[]);
      setStats(currentStats as Stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backend недоступен. Проверьте, запущен ли сервер.');
    } finally {
    }
  }, []);

  useEffect(() => { void refreshData(); }, [refreshData]);

  const filtered = useMemo(() => history.filter(item => {
    const score = item.analysis.score;
    const matchesFilter = filter === 'Все отзывы' || (filter === 'Негативные' ? score < 60 : score >= 60);
    return matchesFilter && (item.review + ' ' + item.analysis.summary).toLowerCase().includes(search.toLowerCase());
  }), [history, filter, search]);

  async function analyzeReview(text = review) {
    const value = text.trim();
    if (!value) { setError('Добавьте текст отзыва, чтобы начать анализ.'); return; }
    setReview(value); setError(''); setLoading(true); setAnalysis(null); setActiveTab('overview');
    try {
      const response = await fetch(apiBase() + '/api/reviews/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review: value })
      });
      if (!response.ok) {
        const body = await response.text();
        let message = body;
        try { const parsed = JSON.parse(body) as { error?: string; message?: string }; message = parsed.error || parsed.message || body; } catch { /* сервер мог вернуть текст */ }
        throw new Error(message || 'Сервер не смог обработать отзыв');
      }
      const data = await response.json() as Analysis;
      setAnalysis(data);
      await refreshData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подключиться к серверу. Проверьте настройки Yandex Agent.');
    } finally { setLoading(false); }
  }

  function openRecord(item: ReviewRecord) {
    setReview(item.review); setAnalysis(item.analysis); setActiveTab('overview'); setError('');
  }

  function exportCsv() {
    const rows = [['Дата', 'Отзыв', 'Тональность', 'Оценка', 'Риск', 'Резюме', 'Проблемы']];
    history.forEach(item => rows.push([
      dateLabel(item.analyzedAt), item.review, item.analysis.sentiment, String(item.analysis.score),
      item.analysis.risk, item.analysis.summary, item.analysis.issues.map(issue => issue.category + ': ' + issue.severity).join('; ')
    ]));
    const csv = '\uFEFF' + rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'otzovi-svoy-otzyv-report.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setActiveTab('overview'); }}><strong className="brand-wordmark">ОтзовиСвой<span>Отзыв</span></strong></a>
      <div className="workspace-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <button className={'nav-item ' + (activeTab === 'overview' ? 'selected' : '')} onClick={() => setActiveTab('overview')}><Activity size={18}/> Обзор</button>
      <button className={'nav-item ' + (activeTab === 'history' ? 'selected' : '')} onClick={() => setActiveTab('history')}><History size={18}/> История отзывов <span className="nav-count">{stats.totalReviews}</span></button>
      <div className="sidebar-divider"/>
      <div className="workspace-label">РАБОТА С ДАННЫМИ</div>
      <button className={'nav-item ' + (activeTab === 'reports' ? 'selected' : '')} onClick={() => { setActiveTab('reports'); void refreshData(); }}><FileText size={18}/> Отчёты</button>
      <div className="sidebar-bottom"><div className="status-card"><span className="status-pulse"/><div><b>AI-система</b><small>Yandex Agent API</small></div></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs">ОтзовиСвойОтзыв <span>/</span> <b>{activeTab === 'overview' ? 'Обзор' : activeTab === 'history' ? 'История отзывов' : 'Отчёты'}</b></div><div className="topbar-right"><span className="live-indicator"><span/> API-интеграция</span><a className="swagger-link" href={apiBase() + '/swagger-ui/index.html'} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Swagger API</a></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> УНИВЕРСАЛЬНАЯ AI-АНАЛИТИКА</div><h1>{activeTab === 'overview' ? 'Анализ отзывов' : activeTab === 'history' ? 'История отзывов' : 'Отчёты и статистика'}</h1><p>{activeTab === 'overview' ? 'Анализируйте обратную связь о товарах, услугах, персонале и клиентском опыте в любой отрасли.' : activeTab === 'history' ? 'Реальные результаты, сохранённые сервером после AI-анализа.' : 'Сводка строится на фактически обработанных отзывах, а не на демонстрационных цифрах.'}</p></div><div className="date-chip"><Clock3 size={15}/> {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>

        {error && <div className="error-message global-error"><AlertTriangle size={16}/>{error}<button className="text-button" onClick={() => setError('')}>Скрыть</button></div>}

        {activeTab === 'overview' && <>
          <section className="stats-grid">
            <Stat icon={<MessageSquareText size={19}/>} label="Всего отзывов" value={String(stats.totalReviews)} detail="в истории сервера" />
            <Stat icon={<ShieldAlert size={19}/>} label="Требуют внимания" value={String(stats.requiresAttention)} detail="низкая оценка или серьёзные проблемы" />
            <Stat icon={<BadgeCheck size={19}/>} label="Позитивные отзывы" value={String(stats.positiveReviews)} detail="определены AI-анализом" />
            <Stat icon={<Activity size={19}/>} label="Качество сервиса" value={stats.totalReviews ? stats.averageScore + '/100' : '—'} detail="средняя оценка всех отзывов" />
          </section>
          <section className="work-grid">
            <div className="panel input-panel"><div className="panel-title"><div className="panel-icon violet"><BrainCircuit size={19}/></div><div><h2>Новый анализ</h2><p>Вставьте отзыв о любом товаре или услуге</p></div><span className="ai-tag"><Sparkles size={12}/> YANDEX AI</span></div>
              <label htmlFor="review-input" className="field-label">ТЕКСТ ОТЗЫВА</label>
              <textarea id="review-input" value={review} onChange={e => setReview(e.target.value)} placeholder="Например: Купил ноутбук, он быстро работает, но сильно греется..." maxLength={10000}/>
              <div className="textarea-footer"><span>{review.length} / 10 000 символов</span><button className="text-button" onClick={() => { setReview(''); setAnalysis(null); }}>Очистить</button></div>
              <div className="examples"><span>ПРИМЕРЫ:</span>{examples.map((example, i) => <button key={i} onClick={() => setReview(example)}>{['Товар', 'Ресторан', 'Поддержка'][i]}</button>)}</div>
              <button className="analyze-button" disabled={loading || !review.trim()} onClick={() => void analyzeReview()}>{loading ? <><span className="spinner"/> Анализируем отзыв...</> : <><Sparkles size={17}/> Проанализировать отзыв <Send size={15}/></>}</button>
              <div className="privacy-note"><ShieldAlert size={13}/> Не добавляйте платёжные данные и лишние персональные сведения.</div>
            </div>
            <div className="panel insight-panel"><div className="panel-title"><div className="panel-icon orange"><Zap size={19}/></div><div><h2>Что анализируем</h2><p>Тематика определяется по самому отзыву</p></div></div>
              <div className="insight-list"><Insight icon={<MessageSquareText size={17}/>} title="Тональность и оценка" text="Позитивный, нейтральный или негативный опыт" color="blue"/><Insight icon={<AlertTriangle size={17}/>} title="Проблемы и причины" text="Только конкретные сигналы из текста" color="orange"/><Insight icon={<BadgeCheck size={17}/>} title="Качество продукта или услуги" text="Сильные стороны и точки роста" color="purple"/><Insight icon={<ShieldAlert size={17}/>} title="Риски и действия" text="Приоритеты и практические рекомендации" color="red"/></div>
              <div className="insight-foot"><div className="sparkle-badge"><Sparkles size={16}/></div><div><b>Не только доставка</b><p>Магазины, рестораны, товары, приложения, гостиницы, поддержка и другие сферы.</p></div></div>
            </div>
          </section>
          {analysis && <section className="results-section"><div className="section-heading"><div><div className="eyebrow"><Sparkles size={14}/> РЕЗУЛЬТАТ AI-АНАЛИЗА</div><h2>Разбор отзыва</h2></div><span className="result-badge"><Check size={14}/> Анализ завершён</span></div>
            <div className="result-summary"><div className="score-ring" style={{ '--score': analysis.score } as React.CSSProperties}><div><strong>{analysis.score}</strong><span>из 100</span></div></div><div className="summary-copy"><div className="summary-tags"><span className={'sentiment ' + (analysis.sentiment.toLowerCase().includes('позит') ? 'positive' : analysis.sentiment.toLowerCase().includes('нейтр') ? 'neutral' : 'negative')}>{analysis.sentiment}</span><span className={'risk ' + (analysis.risk.toLowerCase() === 'низкий' ? 'risk-low' : analysis.risk.toLowerCase() === 'средний' ? 'risk-medium' : 'risk-high')}>Риск: {analysis.risk}</span></div><h3>Краткое резюме</h3><p>{analysis.summary}</p></div></div>
            <div className="section-subheading"><h3>Выявленные проблемы <span>{analysis.issues.length}</span></h3><span>По степени серьёзности</span></div>
            {analysis.issues.length ? <div className="issues-list">{analysis.issues.map((issue, i) => <div className="issue-card" key={i}><div className={'issue-symbol ' + severityClass(issue.severity)}><AlertTriangle size={18}/></div><div className="issue-content"><div className="issue-title-row"><h4>{issue.category}</h4><span className={'severity ' + severityClass(issue.severity)}>{issue.severity}</span></div><blockquote>{issue.evidence}</blockquote><div className="recommendation"><Sparkles size={15}/><div><b>Рекомендация</b><p>{issue.recommendation}</p></div></div></div></div>)}</div> : <div className="empty-success"><BadgeCheck size={22}/><div><b>Проблемные точки не обнаружены</b><p>AI не выявил явных проблем в этом отзыве.</p></div></div>}
            <div className="section-subheading"><h3>Рекомендуемые действия</h3><span>Следующие шаги</span></div><div className="action-list">{analysis.recommendations.map((item, i) => <div className="action-row" key={i}><span>{String(i + 1).padStart(2, '0')}</span><p>{item}</p><Check size={16}/></div>)}</div>
          </section>}
          {!analysis && <section className="recent-section"><div className="section-heading"><div><h2>Последние отзывы</h2><p>Недавние анализы из истории backend</p></div><button className="view-all" onClick={() => setActiveTab('history')}>Все отзывы <ArrowDownRight size={15}/></button></div>{history.length ? <div className="recent-list">{history.slice(0, 3).map(item => <button className="recent-item" key={item.id} onClick={() => openRecord(item)}><div className={'recent-score ' + (item.analysis.score < 60 ? 'bad' : 'good')}>{item.analysis.score}</div><div className="recent-text"><b>{item.analysis.summary}</b><span>{dateLabel(item.analyzedAt)} · {item.review.slice(0, 85)}{item.review.length > 85 ? '…' : ''}</span></div><ArrowUpRight size={17}/></button>)}</div> : <div className="empty-history"><MessageSquareText size={24}/><b>Пока нет обработанных отзывов</b><p>Первый анализ появится здесь после успешного ответа AI.</p></div>}</section>}
        </>}

        {activeTab === 'history' && <section className="panel history-panel"><div className="history-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по отзывам..."/></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Все отзывы</option><option>Негативные</option><option>Положительные</option></select></div>{filtered.length ? <div className="history-list">{filtered.map(item => <div className="history-entry" key={item.id}><button className="history-entry-main" onClick={() => setExpanded(expanded === item.id ? null : item.id)}><div className={'recent-score ' + (item.analysis.score < 60 ? 'bad' : 'good')}>{item.analysis.score}</div><div className="recent-text"><b>{item.analysis.summary}</b><span>{dateLabel(item.analyzedAt)} · {item.review.slice(0, 130)}{item.review.length > 130 ? '…' : ''}</span></div><span>{item.analysis.sentiment}</span></button>{expanded === item.id && <div className="history-expanded"><p>{item.review}</p><button className="secondary-button" onClick={() => openRecord(item)}>Открыть полный анализ</button></div>}</div>)}</div> : <div className="empty-history"><Search size={24}/><b>История пуста</b><p>Здесь отображаются только реальные отзывы, которые успешно обработал AI.</p></div>}</section>}

        {activeTab === 'reports' && <section className="panel reports-panel"><div className="reports-header"><div><h2>Сводный отчёт</h2><p>Данные рассчитаны по истории анализа на сервере.</p></div><button className="secondary-button" onClick={exportCsv} disabled={!history.length}><Download size={16}/> Скачать CSV</button></div><div className="report-metrics"><div><span>Всего анализов</span><strong>{stats.totalReviews}</strong></div><div><span>Требуют внимания</span><strong>{stats.requiresAttention}</strong></div><div><span>Позитивные</span><strong>{stats.positiveReviews}</strong></div><div><span>Средняя оценка</span><strong>{stats.totalReviews ? stats.averageScore + '/100' : '—'}</strong></div></div><div className="section-subheading"><h3>Детализация отзывов</h3><span>{history.length} записей</span></div>{history.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Дата</th><th>Резюме</th><th>Тональность</th><th>Оценка</th><th>Риск</th><th/></tr></thead><tbody>{history.map(item => <tr key={item.id}><td>{dateLabel(item.analyzedAt)}</td><td><b>{item.analysis.summary}</b><small>{item.review.slice(0, 140)}{item.review.length > 140 ? '…' : ''}</small></td><td>{item.analysis.sentiment}</td><td>{item.analysis.score}/100</td><td>{item.analysis.risk}</td><td><button className="text-button" onClick={() => openRecord(item)}>Открыть</button></td></tr>)}</tbody></table></div> : <div className="empty-history"><FileText size={24}/><b>Отчётов пока нет</b><p>Проанализируйте первый отзыв — он появится в отчёте автоматически.</p></div>}</section>}

        <footer className="footer"><span>© 2026 ОтзовиСвойОтзыв</span><span><span className="status-pulse"/> AI-аналитика на базе Yandex Agent</span></footer>
      </div>
    </main>
  </div>;
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-detail">{detail}</div></div>;
}
function Insight({ icon, title, text, color }: { icon: React.ReactNode; title: string; text: string; color: string }) {
  return <div className="insight-row"><span className={'insight-icon ' + color}>{icon}</span><div><b>{title}</b><p>{text}</p></div><Check size={15} className="insight-check"/></div>;
}
