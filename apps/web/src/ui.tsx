import { ButtonHTMLAttributes, PropsWithChildren, ReactNode, useEffect, useRef } from 'react';
import { CircleHelp } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
type StatusTone = 'neutral' | AlertVariant;

export function Button({ variant = 'primary', loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return <button {...props} className={`ui-button ${variant} ${props.className ?? ''}`} disabled={props.disabled || loading} aria-busy={loading || undefined}>{loading ? 'در حال انجام…' : children}</button>;
}

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button {...props} aria-label={label} title={label} className={`icon-button ${props.className ?? ''}`}>{children}</button>;
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`ui-card ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</header>;
}

export function SectionHeader({ title, description, action, as: Heading = 'h2' }: { title: string; description?: string; action?: ReactNode; as?: 'h2' | 'h3' }) {
  return <header className="ui-section-header"><div><Heading>{title}</Heading>{description && <p>{description}</p>}</div>{action}</header>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <section className="empty-state ui-empty-state"><h3>{title}</h3><p>{body}</p>{action}</section>;
}

export function Alert({ variant = 'info', title, children, action }: PropsWithChildren<{ variant?: AlertVariant; title?: string; action?: ReactNode }>) {
  return <section className={`ui-alert ${variant}`} role={variant === 'danger' ? 'alert' : 'status'}><div>{title && <strong>{title}</strong>}{children && <p>{children}</p>}</div>{action}</section>;
}

export function LoadingState({ label = 'در حال دریافت اطلاعات…' }: { label?: string }) {
  return <p className="ui-loading-state" role="status" aria-live="polite">{label}</p>;
}

export function StatusBadge({ tone = 'neutral', children }: PropsWithChildren<{ tone?: StatusTone }>) {
  return <span className={`ui-status-badge ${tone}`}>{children}</span>;
}

export function TableShell({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`ui-table-shell ${className}`}>{children}</div>;
}

export function HelpTrigger({ label, onClick }: { label: string; onClick?: () => void }) {
  return <button type="button" className="ui-help-trigger" aria-label={label} title={label} onClick={onClick}><CircleHelp size={16} aria-hidden="true" /></button>;
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'تأیید', onConfirm, onClose, danger = false }: { open: boolean; title: string; body: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void; danger?: boolean }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => { if (open && event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', listener);
    if (open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      window.setTimeout(() => cancelRef.current?.focus(), 0);
    }
    return () => { window.removeEventListener('keydown', listener); previousFocus.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="dialog-layer" role="presentation"><button className="dialog-backdrop" aria-label="بستن گفتگو" onClick={onClose}/><section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2><p>{body}</p><div><button ref={cancelRef} type="button" className="ui-button secondary" onClick={onClose}>انصراف</button><Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></div></section></div>;
}
