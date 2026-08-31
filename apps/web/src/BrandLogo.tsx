import { useEffect, useState } from 'react';

const defaultLogo = '/jupiter-logo.png';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const [source, setSource] = useState(() => {
    try { return localStorage.getItem('jupiter.brand-logo') || localStorage.getItem('jupiter.platform-logo') || defaultLogo; }
    catch { return defaultLogo; }
  });
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<{ logoUrl?: string | null }>).detail?.logoUrl || defaultLogo;
      try { if (next === defaultLogo) localStorage.removeItem('jupiter.brand-logo'); else localStorage.setItem('jupiter.brand-logo', next); }
      catch { /* Persistent branding is an enhancement; the active page still updates. */ }
      try { setSource(next === defaultLogo ? localStorage.getItem('jupiter.platform-logo') || defaultLogo : next); }
      catch { setSource(next); }
    };
    const updatePlatform = (event: Event) => {
      const next = (event as CustomEvent<{ logoUrl?: string | null }>).detail?.logoUrl || defaultLogo;
      try { if (next === defaultLogo) localStorage.removeItem('jupiter.platform-logo'); else localStorage.setItem('jupiter.platform-logo', next); setSource(localStorage.getItem('jupiter.brand-logo') || next); }
      catch { setSource(next); }
    };
    window.addEventListener('jupiter:brand-logo-updated', update);
    window.addEventListener('jupiter:platform-appearance-updated', updatePlatform);
    return () => { window.removeEventListener('jupiter:brand-logo-updated', update); window.removeEventListener('jupiter:platform-appearance-updated', updatePlatform); };
  }, []);
  useEffect(() => {
    document.querySelector<HTMLLinkElement>('#jupiter-favicon')?.setAttribute('href', source);
  }, [source]);
  return <span className="brand-logo" aria-label="Jupiter">
    <img src={source} alt="" onError={() => { try { localStorage.removeItem('jupiter.brand-logo'); } catch { /* ignored */ } setSource(defaultLogo); }} />
    {!compact && <span><strong>JUPITER</strong><small>مرکز خدمات پشتیبانی</small></span>}
  </span>;
}
