import { useEffect, useState, type ReactNode } from 'react';
import { Link, useRouter } from '../lib/router.tsx';
import { Logo } from '../components/Logo.tsx';
import { Drawer, Button } from '../components/ui.tsx';
import { StatusBadge } from '../components/data.tsx';
import { useBuild } from '../lib/build-state.tsx';
import { getAddOnById, getCurrentBase, getOrderSummary, getPickupInformation, type ContainerMode } from '../data/api.ts';
import { money, plural, time12 } from '../lib/format.ts';
import { SEASON_LABEL } from '../research/calendar.ts';

const NAV = [
  { href: '/base', label: 'This week' },
  { href: '/ingredients', label: 'Ingredients' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/research', label: 'Research' },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const build = useBuild();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  const current = getCurrentBase();

  return (
    <div className={`site season-${current.basket.season}`}>
      <a className="skip" href="#main">Skip to content</a>
      <header className="masthead">
        <div className="masthead-inner">
          <Link href="/" className="masthead-logo" aria-label="Base, home"><Logo height={26} /></Link>
          <nav aria-label="Main" className={`nav${menu ? ' is-open' : ''}`} id="main-nav">
            <ul>
              {NAV.map((n) => <li key={n.href}><Link href={n.href} className="nav-link">{n.label}</Link></li>)}
            </ul>
          </nav>
          <div className="masthead-actions">
            <Button className="build-btn" size="small" onClick={build.openBuilder} aria-haspopup="dialog">
              Build my Base{build.addOnIds.length > 0 && <span className="build-count" aria-label={`, ${plural(build.addOnIds.length, 'add-on')} added`}>{build.addOnIds.length}</span>}
            </Button>
            <button className="menu-btn" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu((m) => !m)}>
              <span className="visually-hidden">Menu</span>
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                {menu ? <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
      <BuildDrawer />
    </div>
  );
}

function Footer() {
  const current = getCurrentBase();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo height={22} />
          <p>Mise en place for everyday cooks. A weekly seasonal foundation of ingredients, picked up locally in reusable containers.</p>
        </div>
        <nav aria-label="Footer" className="footer-nav">
          <ul>
            <li><Link href="/base">This week’s Base</Link></li>
            <li><Link href="/baskets">All Bases</Link></li>
            <li><Link href="/addons">Add-ons</Link></li>
            <li><Link href="/recipes">Community recipes</Link></li>
          </ul>
          <ul>
            <li><Link href="/pickup">Pickup and containers</Link></li>
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/research">The Base Index</Link></li>
            <li><Link href="/research/data">Data and sources</Link></li>
            <li><Link href="/research/data#photo-credits">Photo credits</Link></li>
          </ul>
        </nav>
        <p className="footer-note">
          Base is a prototype. Nothing on this site can be bought, prices and suppliers are estimates or demos, and pickup
          locations are placeholders. Food photos are freely licensed representative images, credited on the
          data page. This week is the {SEASON_LABEL[current.basket.season].toLowerCase()} Base for the week of {current.weekLabel}.
        </p>
      </div>
    </footer>
  );
}

const MODES: { value: ContainerMode; label: string; help: string }[] = [
  { value: 'borrow', label: 'Borrow containers', help: 'Pay a refundable deposit. Bring them back next week and it carries over.' },
  { value: 'returning', label: 'I already have Base containers', help: 'Swap your clean containers at pickup. Your deposit is already held.' },
  { value: 'own', label: 'Buy containers to keep', help: 'A one-time purchase. No deposit, nothing to return.' },
];

function BuildDrawer() {
  const build = useBuild();
  const { navigate } = useRouter();
  const base = getCurrentBase();
  const summary = getOrderSummary(base, build.addOnIds, build.containerMode);
  const pickup = getPickupInformation().nextPickup;
  const chosen = build.addOnIds.map(getAddOnById).filter((a): a is NonNullable<typeof a> => !!a);
  const go = (to: string) => { build.closeBuilder(); navigate(to); };

  return (
    <Drawer open={build.open} onClose={build.closeBuilder} title="Build my Base"
      footer={build.reserved ? (
        <div className="reserved" role="status">
          <p><strong>Prototype only.</strong> Nothing was ordered and nothing was charged. In the real product, this is where your
            pickup would be confirmed{pickup ? ` for ${pickup.label}` : ''}.</p>
          <Button variant="secondary" onClick={build.reset}>Start again</Button>
        </div>
      ) : (
        <Button className="btn-block" onClick={build.reserve}>Reserve pickup — prototype</Button>
      )}>
      <section className="build-section">
        <h3>{base.basket.name}, week of {base.weekLabel}</h3>
        <p className="muted">{base.lines.length} ingredients, about {base.plates} plates for two.</p>
        <button className="link-btn" onClick={() => go('/base')}>See what’s in it</button>
      </section>

      <section className="build-section">
        <h3>Add-ons</h3>
        {chosen.length === 0 ? (
          <p className="muted">None. Your Base is complete without them. <button className="link-btn" onClick={() => go('/addons')}>Browse add-ons</button></p>
        ) : (
          <ul className="build-addons">
            {chosen.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span><span className="tabular">+{money(a.price)}</span>
                <button className="link-btn" onClick={() => build.toggleAddOn(a.id)}>Remove<span className="visually-hidden"> {a.name}</span></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <fieldset className="build-section modes">
        <legend><h3>Containers</h3></legend>
        {MODES.map((m) => (
          <label key={m.value} className="mode">
            <input type="radio" name="container-mode" value={m.value} checked={build.containerMode === m.value}
              onChange={() => build.setContainerMode(m.value)} />
            <span><strong>{m.label}</strong><span className="muted">{m.help}</span></span>
          </label>
        ))}
        <p className="muted small">This Base uses {plural(base.containerCount, 'glass container')}. Deposit {money(base.deposit)}, or {money(base.containerPurchase)} to buy them.</p>
      </fieldset>

      <section className="build-section">
        <h3>Today</h3>
        <dl className="ledger">
          <div><dt>Weekly Base (food)</dt><dd>{money(summary.foodPrice)}</dd></div>
          <div><dt>Add-ons</dt><dd>{summary.addOns ? `+${money(summary.addOns)}` : money(0)}</dd></div>
          {build.containerMode === 'borrow' && <div><dt>Container deposit, refundable</dt><dd>+{money(summary.depositRefundable)}</dd></div>}
          {build.containerMode === 'own' && <div><dt>Container purchase, one time</dt><dd>+{money(summary.containerPurchase)}</dd></div>}
          <div className="ledger-total"><dt>Total today</dt><dd>{money(summary.totalToday)}</dd></div>
          {build.containerMode === 'borrow' && <div className="ledger-note"><dt>Of which refundable</dt><dd>{money(summary.depositRefundable)}</dd></div>}
        </dl>
        <p className="small muted"><StatusBadge status="demo" /> Prices are estimates and demo values. There is no checkout.</p>
      </section>

      {pickup && (
        <section className="build-section">
          <h3>Pickup</h3>
          <p>{pickup.label}, {time12(pickup.window.start)}–{time12(pickup.window.end)}<br />
            <span className="muted">{pickup.location.name}</span></p>
        </section>
      )}
    </Drawer>
  );
}
