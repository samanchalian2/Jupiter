import { useEffect, useRef, useState } from 'react';
import { authenticatedHubFetch } from './JupiterObservability';
import { HelpTrigger } from './ui';

export const OBSERVABILITY_HELP_TOPICS = [
  ['console', 'مرکز پایش هوشمند'], ['concepts', 'Event، Issue و Incident'],
  ['severity', 'شدت و اثر'], ['incidents', 'مدیریت Incident'],
  ['applications', 'مدیریت برنامه‌ها'], ['ai', 'تحلیل هوش مصنوعی'],
  ['ai-limits', 'محدودیت‌های AI'], ['privacy', 'حریم خصوصی و نگه‌داری'],
  ['integration', 'اتصال نرم‌افزار جدید'], ['feedback', 'گزارش مشکل یا پیشنهاد'],
  ['offline', 'گزارش آفلاین و ارسال'],
] as const;
type Topic = typeof OBSERVABILITY_HELP_TOPICS[number][0];
type Article = { slug: string; title: string; content: string };

export async function loadObservabilityHelp(topic: Topic, signal: AbortSignal,
  transport = authenticatedHubFetch): Promise<Article> {
  const slug = `observability-${topic}`;
  const response = await transport(`/help/articles/${slug}`, { signal });
  if (!response.ok) throw new Error('راهنمای منتشرشدهٔ مجاز در دسترس نیست.');
  const value = await response.json() as Partial<Article>;
  if (value.slug !== slug || typeof value.title !== 'string' || typeof value.content !== 'string') {
    throw new Error('پاسخ راهنما معتبر نیست.');
  }
  return value as Article;
}

/** Jupiter Help adapter: the reusable Console has no dependency on this engine. */
export function ObservabilityHelp({ feedback = false }: { feedback?: boolean }) {
  const [open, setOpen] = useState(false), [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const close = () => { pending.current?.abort(); pending.current = null; setOpen(false); setArticle(null); setError(''); };
  useEffect(() => {
    const events = ['jupiter:session-ended', 'jupiter:session-expired', 'jupiter:session-refreshed'];
    events.forEach(name => window.addEventListener(name, close));
    return () => { pending.current?.abort(); events.forEach(name => window.removeEventListener(name, close)); };
  }, []);
  const show = async (topic: Topic) => {
    pending.current?.abort(); const request = new AbortController(); pending.current = request;
    setOpen(true); setArticle(null); setError('');
    try { const next = await loadObservabilityHelp(topic, request.signal); if (!request.signal.aborted) setArticle(next); }
    catch { if (!request.signal.aborted) setError('راهنمای منتشرشدهٔ مجاز در دسترس نیست.'); }
  };
  const topics = feedback ? OBSERVABILITY_HELP_TOPICS.filter(([key]) => ['feedback', 'offline', 'privacy'].includes(key)) : OBSERVABILITY_HELP_TOPICS;
  return <span className="contextual-help observability-help" dir="rtl">
    <HelpTrigger label={feedback ? 'راهنمای گزارش مشکل' : 'راهنمای مرکز پایش'} onClick={() => void show(feedback ? 'feedback' : 'console')}/>
    {open && <aside className="contextual-help-popover obs-help-reader" role="dialog" aria-label="راهنمای مرکز پایش" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <button type="button" className="icon-text-button" onClick={close}>بستن راهنما</button>
      <label>موضوع راهنما<select aria-label="موضوع راهنمای پایش" defaultValue={feedback ? 'feedback' : 'console'} onChange={event => void show(event.target.value as Topic)}>
        {topics.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      {article ? <><h4>{article.title}</h4><pre>{article.content}</pre></> : <p role="status">{error || 'در حال دریافت راهنما…'}</p>}
    </aside>}
  </span>;
}
