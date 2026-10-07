// General UI building blocks: buttons, tabs, filters, drawers and page states.
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from '../lib/router.tsx';

export function Button({ variant = 'primary', size, children, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet'; size?: 'small' }) {
  return <button className={`btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`} {...rest}>{children}</button>;
}

export function ButtonLink({ href, variant = 'primary', children, className = '' }:
  { href: string; variant?: 'primary' | 'secondary' | 'quiet'; children: ReactNode; className?: string }) {
  return <Link href={href} className={`btn btn-${variant} ${className}`}>{children}</Link>;
}

/** Accessible tabs: arrow keys move between tabs, the panel follows. */
export function Tabs<T extends string>({ tabs, value, onChange, label }:
  { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) { e.preventDefault(); onChange(tabs[next].value); refs.current[next]?.focus(); }
  };
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {tabs.map((t, i) => (
        <button key={t.value} ref={(el) => { refs.current[i] = el; }} role="tab" id={`${id}-${t.value}`}
          aria-selected={t.value === value} tabIndex={t.value === value ? 0 : -1} className="tab"
          onClick={() => onChange(t.value)} onKeyDown={(e) => onKey(e, i)}>{t.label}</button>
      ))}
    </div>
  );
}

/** A row of toggle chips that filter a list. */
export function FilterChips<T extends string>({ options, value, onChange, label }:
  { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset className="chips">
      <legend className="visually-hidden">{label}</legend>
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span className="chip-count">{o.count}</span>}
        </button>
      ))}
    </fieldset>
  );
}

/** Modal side drawer. Traps focus, closes on Escape, returns focus to the opener. */
export function Drawer({ open, onClose, title, children, footer }:
  { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('[data-autofocus], button, a, input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-root">
      <div className="drawer-scrim" onClick={onClose} />
      <div ref={panel} className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state state-empty" role="status">
      <EmptyBowl />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'This page couldn’t load', children, retry }: { title?: string; children?: ReactNode; retry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <h3>{title}</h3>
      <p>{children ?? 'We couldn’t load this right now. Try again in a moment.'}</p>
      {retry && <Button variant="secondary" onClick={retry}>Try again</Button>}
    </div>
  );
}

export function LoadingState({ label = 'Loading this week’s Base' }: { label?: string }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <span className="loading-bowls" aria-hidden="true"><i /><i /><i /><i /></span>
      <p>{label}</p>
    </div>
  );
}

function EmptyBowl() {
  return (
    <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="var(--surface)" stroke="var(--line)" />
      <circle cx="50" cy="50" r="36" fill="var(--counter)" />
    </svg>
  );
}

/** A disclosure for detail that shouldn't clutter the storefront. */
export function Details({ summary, children, className = '' }: { summary: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={`details ${className}`}>
      <summary>{summary}</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}
