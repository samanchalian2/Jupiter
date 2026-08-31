import { useState } from 'react';
import type { Actor } from './App';
import { request } from './App';
import { HelpTrigger } from './ui';

type Article = { slug:string; title:string; summary:string; content?:string };

export function ContextualHelpTrigger({ actor, relatedFeature, label }: { actor:Actor; relatedFeature:string; label:string }) {
  const [open, setOpen] = useState(false); const [article, setArticle] = useState<Article | null>(null); const [error, setError] = useState('');
  const show = async () => { setOpen(true); setError(''); if (article) return; try { const matches = await request(`/help/articles?relatedFeature=${encodeURIComponent(relatedFeature)}`, actor.session, actor.organizationId) as Article[]; if (!matches[0]) { setError('راهنمای منتشرشده‌ای برای این بخش در دسترس نیست.'); return; } setArticle(await request(`/help/articles/${encodeURIComponent(matches[0].slug)}`, actor.session, actor.organizationId) as Article); } catch { setError('راهنمای این بخش در دسترس نیست.'); } };
  return <span className="contextual-help"><HelpTrigger label={label} onClick={() => void show()}/>{open && <aside className="contextual-help-popover" role="dialog" aria-label={label}><button type="button" className="icon-text-button" onClick={() => setOpen(false)}>بستن</button>{article ? <><h4>{article.title}</h4><p>{article.summary}</p><pre>{article.content}</pre></> : <p className="hint">{error || 'در حال دریافت راهنما…'}</p>}</aside>}</span>;
}
