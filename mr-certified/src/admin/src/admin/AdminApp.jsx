// MC
import React, { useEffect, useMemo, useState } from 'react';
import { restoreAdmin, signInAdmin, hasSession, touchSession, signOutAdmin, adminEmail, onAdminSessionLost, IDLE_MINUTES } from './adminAuth.js';
import { listAccounts, listOrders, getStats, setSellerStatus, listAudit, logAudit, mask, money, when } from './adminData.js';
import './admin.css';

const NAV_GROUPS = [
  {
    title: "WORKSPACE",
    items: [
      { id: "overview", label: "Overview", icon: "◫" },
    ],
  },
  {
    title: "MARKETPLACE",
    items: [
      { id: "sellers", label: "Seller verification", icon: "♙", badge: true },
      { id: "accounts", label: "User management", icon: "♧" },
      { id: "orders", label: "Orders", icon: "▤" },
      { id: "audit", label: "Audit log", icon: "◷" },
    ],
  },
];

const FUTURE_MODULES = [
  "Products",
  "Payments & escrow",
  "Disputes",
  "Deliveries",
  "Marketing",
  "Analytics",
  "Settings",
];

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true); // asking Supabase if we are still signed in
  const [notice, setNotice] = useState('');

  useEffect(() => {
    restoreAdmin().then((r) => { setAuthed(r.ok); if (r.notice) setNotice(r.notice); setChecking(false); });
  }, []);

  // If the login ends (or someone else signs in in this browser) lock the console and say why.
  useEffect(() => onAdminSessionLost((message) => { setNotice(message); setAuthed(false); }), []);

  // Lock after IDLE_MINUTES without a tap/key; closing the tab also ends the session.
  useEffect(() => {
    if (!authed) return undefined;
    const events = ['pointerdown', 'keydown'];
    events.forEach((e) => window.addEventListener(e, touchSession));
    const timer = setInterval(() => {
      if (!hasSession()) { signOutAdmin(); setAuthed(false); setNotice(`Locked after ${IDLE_MINUTES} idle minutes.`); }
    }, 10000);
    return () => { events.forEach((e) => window.removeEventListener(e, touchSession)); clearInterval(timer); };
  }, [authed]);

  if (checking) return <div className="ad-gate"><p className="ad-sub">Loading…</p></div>;
  if (!authed) return <Gate notice={notice} onDone={() => { setNotice(''); setAuthed(true); }} />;
  return <Console onLock={async () => { await logAudit('admin.logout'); await signOutAdmin(); setAuthed(false); }} />;
}

/* --------------------------------- login --------------------------------- */
function Gate({ onDone, notice }) {
  const setup = false; // the administrator login is created in Supabase (see supabase/03_admin.sql)
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (setup && pw !== pw2) { setErr('Passphrases do not match.'); return; }
    setBusy(true);
    try {
      await signInAdmin(email, pw);
      logAudit('admin.login');
      onDone();
    } catch (x) {
      setErr(x.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="ad-gate">
      <form className="ad-card ad-login" onSubmit={submit}>
        <h1>{setup ? 'Create administrator' : 'Administrator sign in'}</h1>
        {setup && <p className="ad-sub">First run: this creates the only administrator login for this console.</p>}
        {notice && <p className="ad-note">{notice}</p>}
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={setup ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {setup && <label>Repeat passphrase<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></label>}
        {err && <p className="ad-err" role="alert">{err}</p>}
        <button className="ad-btn gold" disabled={busy}>{busy ? 'Please wait…' : setup ? 'Create & enter' : 'Sign in'}</button>
      </form>
    </div>
  );
}

/* -------------------------------- console -------------------------------- */
function Console({ onLock }) {
  const [tab, setTab] = useState("overview");
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    window.addEventListener("storage", refresh);

    return () => {
      clearInterval(t);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const [accounts, setAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Reloads from Supabase on first open, on every Refresh click, and every 5 seconds.
  useEffect(() => {
    let alive = true;
    // each list loads on its own, so one problem (for example orders) never hides the others
    Promise.allSettled([listAccounts(), listOrders(), listAudit()]).then(([a, o, l]) => {
      if (!alive) return;
      if (a.status === 'fulfilled') setAccounts(a.value);
      if (o.status === 'fulfilled') setOrders(o.value);
      if (l.status === 'fulfilled') setAudit(l.value);
      setLoadError([a, o, l].filter((r) => r.status === 'rejected').map((r) => r.reason.message).join(' '));
    });
    return () => { alive = false; };
  }, [tick]);
  const stats = useMemo(
    () => getStats(accounts, orders),
    [accounts, orders]
  );

  const pageNames = {
    overview: "Overview",
    sellers: "Seller verification",
    accounts: "User management",
    orders: "Orders & transactions",
    audit: "Audit history",
  };

  return (
    <div className="ad-shell">

      {/* SIDEBAR */}
      <aside className={`ad-sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="ad-brand">
          <div className="ad-logo">MC</div>
          <div>
            <strong>MR CERTIFIED</strong>
            <small>ADMINISTRATION</small>
          </div>
          <button
            className="ad-mobile-close"
            onClick={() => setSidebarOpen(false)}
          >×</button>
        </div>

        <div className="ad-admin-profile">
          <div className="ad-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <small>Platform control</small>
          </div>
          <span className="ad-online-dot" />
        </div>

        <div className="ad-nav-search">
          <input
            placeholder="Find a section..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span>⌕</span>
        </div>

        <nav className="ad-navigation">

          {NAV_GROUPS.map(group => {
            const items = group.items.filter(item =>
              item.label.toLowerCase().includes(search.toLowerCase())
            );

            if (!items.length) return null;

            return (
              <div className="ad-nav-group" key={group.title}>
                <small className="ad-nav-heading">{group.title}</small>

                {items.map(item => (
                  <button
                    key={item.id}
                    className={`ad-nav-item ${tab === item.id ? "active" : ""}`}
                    onClick={() => {
                      setTab(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="ad-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>

                    {item.badge && stats.sellersPending > 0 && (
                      <i>{stats.sellersPending}</i>
                    )}
                  </button>
                ))}
              </div>
            );
          })}

          {!search && (
            <div className="ad-nav-group">
              <small className="ad-nav-heading">COMING NEXT</small>

              {FUTURE_MODULES.map(item => (
                <div className="ad-future-item" key={item}>
                  <span>{item}</span>
                  <small>Planned</small>
                </div>
              ))}
            </div>
          )}

        </nav>

        <div className="ad-sidebar-bottom">
          <div className="ad-security">
            <span>●</span>
            Admin session protected
            <small>Signed in with Supabase</small>
          </div>

          <button className="ad-logout" onClick={onLock}>
            ↪ Lock administrator
          </button>
        </div>

      </aside>

      {/* MAIN WORKSPACE */}
      <section className="ad-workspace">

        <header className="ad-header">
          <button
            className="ad-menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >☰</button>

          <div className="ad-breadcrumb">
            <small>MR CERTIFIED / ADMIN</small>
            <strong>{pageNames[tab]}</strong>
          </div>

          <div className="ad-header-actions">
            <button className="ad-refresh" onClick={refresh}>
              ↻ <span>Refresh</span>
            </button>

            <div className="ad-header-user">
              <div className="ad-avatar">A</div>
              <div>
                <strong>Administrator</strong>
                <small>{adminEmail()}</small>
              </div>
            </div>
          </div>
        </header>

        <main className="ad-main">

          {loadError && <p className="ad-err" role="alert">{loadError}</p>}

          {tab === "overview" && (
            <Overview
              stats={stats}
              accounts={accounts}
              orders={orders}
              go={setTab}
            />
          )}

          {tab === "sellers" && (
            <>
              <PageHeading
                title="Seller verification"
                description="Review applications and control seller access."
              />
              <Sellers accounts={accounts} onChange={refresh} />
            </>
          )}

          {tab === "accounts" && (
            <>
              <PageHeading
                title="User management"
                description="Search and monitor registered marketplace users."
              />
              <Accounts accounts={accounts} />
            </>
          )}

          {tab === "orders" && (
            <>
              <PageHeading
                title="Orders & transactions"
                description="Monitor customer purchases and order progress."
              />
              <Orders orders={orders} stats={stats} />
            </>
          )}

          {tab === "audit" && (
            <>
              <PageHeading
                title="Audit history"
                description="Review administrator actions and important changes."
              />
              <Audit log={audit} />
            </>
          )}

        </main>

        <footer className="ad-footer">
          <span>MR CERTIFIED © 2026</span>
          <span>Marketplace Administration</span>
        </footer>

      </section>
    </div>
  );
}

function PageHeading({ title, description }) {
  return (
    <div className="ad-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => <div className="ad-card ad-stat"><span>{label}</span><b>{value}</b></div>;

function Overview({ stats, accounts, orders, go }) {
  const pending = accounts.filter(a => a.seller === "pending");

  const recentOrders = [...orders].slice(0, 5);

  return (
    <>
      <PageHeading
        title="Marketplace overview"
        description="Your command centre for everything happening on Mr Certified."
      />

      {/* ALERTS */}
      <div className="ad-welcome">
        <div>
          <small>YOUR MARKETPLACE CONTROL CENTRE</small>
          <h2>Good day, Administrator.</h2>
          <p>
            Here is what is happening across your marketplace.
          </p>
        </div>
        <div className="ad-welcome-icon">♛</div>
      </div>

      {/* BUSINESS STATISTICS */}
      <div className="ad-section-title">
        <h3>Marketplace performance</h3>
        <span>Current recorded figures</span>
      </div>

      <div className="ad-grid">

        <Stat label="Registered accounts" value={stats.accounts} />
        <Stat label="Approved sellers" value={stats.sellersApproved} />
        <Stat label="Pending applications" value={stats.sellersPending} />
        <Stat label="Total orders" value={stats.orders} />
        <Stat label="Order volume" value={money(stats.volume)} />
        <Stat label="Unreleased order value" value={money(stats.escrow)} />

      </div>

      {/* ACTION CENTRE */}
      <div className="ad-section-title">
        <h3>Action centre</h3>
        <span>Things requiring your attention</span>
      </div>

      <div className="ad-overview-grid">

        <div className="ad-card ad-action-panel">
          <div className="ad-panel-top">
            <h3>Seller applications</h3>
            <span className="ad-count">{pending.length}</span>
          </div>

          {pending.length === 0 ? (
            <p className="ad-empty">
              No pending seller applications.
            </p>
          ) : (
            pending.slice(0, 4).map(seller => (
              <div className="ad-pending-row" key={seller.id}>
                <div className="ad-avatar">
                  {(seller.name || "S")[0].toUpperCase()}
                </div>

                <div className="ad-pending-info">
                  <strong>{seller.business?.name || seller.name}</strong>
                  <small>{seller.email}</small>
                </div>

                <span className="ad-badge pending">Pending</span>
              </div>
            ))
          )}

          <button
            className="ad-primary-link"
            onClick={() => go("sellers")}
          >
            Review applications →
          </button>
        </div>

        <div className="ad-card ad-action-panel">
          <div className="ad-panel-top">
            <h3>Quick navigation</h3>
          </div>

          <button className="ad-quick-link" onClick={() => go("accounts")}>
            <span>♧</span>
            <div>
              <strong>Manage accounts</strong>
              <small>Find buyers and sellers</small>
            </div>
            →
          </button>

          <button className="ad-quick-link" onClick={() => go("orders")}>
            <span>▤</span>
            <div>
              <strong>Monitor orders</strong>
              <small>Review marketplace transactions</small>
            </div>
            →
          </button>

          <button className="ad-quick-link" onClick={() => go("audit")}>
            <span>◷</span>
            <div>
              <strong>View audit history</strong>
              <small>Track administrator actions</small>
            </div>
            →
          </button>
        </div>

      </div>

      {/* RECENT ORDERS */}
      <div className="ad-section-title">
        <h3>Recent orders</h3>
        <button className="ad-primary-link" onClick={() => go("orders")}>
          View all →
        </button>
      </div>

      <div className="ad-card">
        {recentOrders.length === 0 ? (
          <p className="ad-empty">No orders recorded yet.</p>
        ) : (
          <div className="ad-recent-list">
            {recentOrders.map(order => (
              <div className="ad-recent-row" key={order.id}>
                <div>
                  <strong>#{String(order.id).slice(-6)}</strong>
                  <small>{order.product}</small>
                </div>

                <strong>{money(order.amount)}</strong>

                <span className="ad-order-stage">
                  {order.stageLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="ad-data-note">
        Figures reflect records currently available to the administrator.
        They are not independently verified financial balances.
      </p>
    </>
  );
}

/* ----------------------------- seller approvals ----------------------------- */
function Sellers({ accounts, onChange }) {
  const [filter, setFilter] = useState('pending');
  const rows = accounts.filter((a) => a.seller && (filter === 'all' || a.seller === filter));
  return (
    <>
      <div className="ad-filters">
        {['pending', 'approved', 'rejected', 'suspended', 'all'].map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {rows.length === 0 && <p className="ad-empty">No {filter === 'all' ? '' : filter} seller applications.</p>}
      {rows.map((a) => <SellerCard key={a.id} a={a} onChange={onChange} />)}
    </>
  );
}

function SellerCard({ a, onChange }) {
  const [show, setShow] = useState(false);
  const b = a.business || {};
  const toggle = () => { if (!show) logAudit('pii.reveal', `${a.email}: ID / KRA viewed`); setShow(!show); };

  const act = async (status, needReason) => {
    let reason = '';
    if (needReason) {
      reason = (window.prompt(`Reason for ${status} (required):`) || '').trim();
      if (!reason) return;
    } else if (!window.confirm(`Set "${b.name || a.name}" to ${status}?`)) return;
    try { await setSellerStatus(a.id, status, reason); onChange(); } catch (e) { window.alert(e.message); }
  };

  return (
    <div className="ad-card ad-seller">
      <div className="ad-row">
        <div><b>{b.name || '(no business name)'}</b><div className="ad-sub">{a.name} · {a.email} · {a.phone}</div></div>
        <span className={'ad-badge ' + a.seller}>{a.seller}</span>
      </div>
      <dl>
        <dt>National ID</dt><dd>{show ? b.id || '—' : mask(b.id)}</dd>
        <dt>KRA PIN</dt><dd>{show ? b.kra || '—' : mask(b.kra)}</dd>
        <dt>Business phone</dt><dd>{b.phone || '—'}</dd>
        <dt>County</dt><dd>{a.county || '—'}</dd>
        <dt>Registered</dt><dd>{when(a.createdAt)}</dd>
        {a.sellerReason && (<><dt>Last reason</dt><dd>{a.sellerReason}</dd></>)}
      </dl>
      <p className="ad-sub">ID photos and the KRA certificate are not stored yet (document upload comes in a later step), so only the typed details can be reviewed here.</p>
      <div className="ad-actions">
        <button className="ad-btn" onClick={toggle}>{show ? 'Hide' : 'Reveal'} ID / KRA</button>
        {a.seller === 'pending' && (<><button className="ad-btn gold" onClick={() => act('approved')}>Approve</button><button className="ad-btn red" onClick={() => act('rejected', true)}>Reject</button></>)}
        {a.seller === 'approved' && <button className="ad-btn red" onClick={() => act('suspended', true)}>Suspend</button>}
        {a.seller === 'suspended' && <button className="ad-btn gold" onClick={() => act('approved')}>Reinstate</button>}
        {a.seller === 'rejected' && <button className="ad-btn" onClick={() => act('pending')}>Re-open review</button>}
      </div>
    </div>
  );
}

/* -------------------------------- accounts -------------------------------- */
function Accounts({ accounts }) {
  const [q, setQ] = useState('');
  const rows = accounts.filter((a) => (a.name + a.email + a.phone).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <input className="ad-search" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ad-table">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>County</th><th>Buyer</th><th>Seller</th><th>Joined</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}><td>{a.name}</td><td>{a.email}</td><td>{a.phone}</td><td>{a.county}</td><td>{a.buyer || '—'}</td><td>{a.seller ? <span className={'ad-badge ' + a.seller}>{a.seller}</span> : '—'}</td><td>{when(a.createdAt)}</td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="7" className="ad-empty">No accounts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ------------------------------ transactions ------------------------------ */
function Orders({ orders, stats }) {
  return (
    <>
      <div className="ad-grid">
        <Stat label="Orders" value={stats.orders} />
        <Stat label="Order volume" value={money(stats.volume)} />
        <Stat label="Awaiting delivery" value={money(stats.escrow)} />
      </div>
      <div className="ad-table">
        <table>
          <thead><tr><th>Placed</th><th>Order</th><th>Buyer</th><th>Product</th><th>Seller</th><th>Qty</th><th>Amount</th><th>Stage</th><th>Payment</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}><td>{when(o.at)}</td><td>#{String(o.id).slice(-6)}</td><td>{o.customer?.name}<div className="ad-sub">{o.customer?.email || o.customer?.phone}</div></td><td>{o.product} ({o.size})</td><td>{o.seller}</td><td>{o.qty}</td><td>{money(o.amount)}</td><td>{o.stageLabel}</td><td>{o.payment}</td></tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="9" className="ad-empty">No orders yet. They appear here as soon as a buyer checks out in the shop.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------------- audit log -------------------------------- */
function Audit({ log }) {
  return (
    <div className="ad-table">
      <table>
        <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead>
        <tbody>
          {log.map((l, i) => <tr key={i}><td>{when(l.t)}</td><td>{l.by}</td><td>{l.action}</td><td>{l.detail}</td></tr>)}
          {log.length === 0 && <tr><td colSpan="4" className="ad-empty">Nothing recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
