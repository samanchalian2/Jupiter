import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Actor } from './App';
import { request } from './App';

type Article = { slug:string; title:string; summary:string; content?:string; category:string; tags:string[]; productArea:string; relatedFeature:string|null; relatedRoute:string|null; version:number; publishedAt:string };

export function HelpCenter({ actor }: { actor:Actor }) {
  const [params] = useSearchParams();
  const [query,setQuery] = useState(params.get('q') ?? ''); const [category,setCategory] = useState('');
  const [articles,setArticles] = useState<Article[]>([]); const [selected,setSelected] = useState<Article|null>(null); const [error,setError] = useState(''); const feature = params.get('feature') ?? '';
  const categories = useMemo(() => [...new Set(articles.map(item => item.category))].sort((a,b) => a.localeCompare(b, 'fa')), [articles]);
  const visible = category ? articles.filter(item => item.category === category) : articles;
  const load = async (q = query) => { setError(''); try { const url = `/help/articles?q=${encodeURIComponent(q)}${feature ? `&relatedFeature=${encodeURIComponent(feature)}` : ''}`; const next = await request(url,actor.session,actor.organizationId) as Article[]; setArticles(next); if (selected && !next.some(item=>item.slug===selected.slug)) setSelected(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'دریافت راهنما ناموفق بود.'); } };
  useEffect(() => { void load(params.get('q') ?? ''); }, [actor.session.accessToken, feature]);
  const open = async (item:Article) => { try { setError(''); setSelected(await request(`/help/articles/${encodeURIComponent(item.slug)}`,actor.session,actor.organizationId) as Article); } catch (cause) { setError(cause instanceof Error ? cause.message : 'مقاله در دسترس نیست.'); } };
  const submit=(event:FormEvent)=>{event.preventDefault();void load();};
  return <section className="page help-center"><div className="page-intro"><div><p className="eyebrow">راهنمای محصول</p><h2>{feature?'راهنمای مرتبط':'راهنمای Jupiter'}</h2><p>فقط راهنماهای منتشرشده و متناسب با دسترسی شما نمایش داده می‌شوند.</p></div></div><div className="help-center-layout"><section className="card help-discovery"><form className="inline-actions" onSubmit={submit}><label>جست‌وجوی راهنما<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="مثلاً سهمیه یا اتصال دایرکتوری"/></label><button>جست‌وجو</button></form>{!feature&&<nav className="help-categories" aria-label="دسته‌های راهنما"><button type="button" className={!category?'active':''} onClick={()=>setCategory('')}>همه</button>{categories.map(item=><button type="button" key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</nav>}{error&&<p className="error" role="alert">{error}</p>}<div className="help-result-list">{visible.map(item=><button type="button" key={item.slug} className={selected?.slug===item.slug?'help-result selected':'help-result'} onClick={()=>void open(item)}><span>{item.category}</span><strong>{item.title}</strong><p>{item.summary}</p><small>{item.tags.join('، ')}</small></button>)}{!visible.length&&!error&&<p className="hint">راهنمای متناسبی یافت نشد.</p>}</div></section><section className="card help-reader" aria-live="polite">{selected?<><p className="eyebrow">{selected.category}</p><h3>{selected.title}</h3><p className="hint">نسخه {selected.version.toLocaleString('fa-IR')} · {new Date(selected.publishedAt).toLocaleDateString('fa-IR')}</p><pre>{selected.content}</pre></>:<p className="hint">برای خواندن، یکی از راهنماها را انتخاب کنید.</p>}</section></div></section>;
}
