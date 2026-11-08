import React, { useEffect, useMemo, useState } from 'react';
import { isSetUp, setUpAdmin, signInAdmin, hasSession, touchSession, signOutAdmin, adminEmail, IDLE_MINUTES } from './adminAuth.js';
import { listAccounts, listOrders, getStats, setSellerStatus, listAudit, logAudit, mask, money, when } from './adminData.js';
import './admin.css';

const TABS = [['overview', 'Overview'], ['sellers', 'Seller approvals'], ['accounts', 'Accounts'], ['orders', 'Transactions'], ['audit', 'Audit log']];

export default function AdminApp() {
  const [authed, setAuthed] = useState(hasSession());
  const [notice, setNotice] = useState('');

  // Lock after IDLE_MINUTES without a tap/key; closing the tab also ends the session.
  useEffect(() => {
    if (!authed) return undefined;
    const events = ['pointerdown', 'keydown'];
    events.forEach((e) => window.addEventListener(e, touchSession));
    const timer = setInterval(() => {
      if (!hasSession()) { setAuthed(false); setNotice(`Locked after ${IDLE_MINUTES} idle minutes.`); }
    }, 10000);
    return () => { events.forEach((e) => window.removeEventListener(e, touchSession)); clearInterval(timer); };
  }, [authed]);

  if (!authed) return <Gate notice={notice} onDone={() => { setNotice(''); setAuthed(true); }} />;
  return <Console onLock={() => { logAudit('admin.logout'); signOutAdmin(); setAuthed(false); }} />;
}

/* --------------------------------- login --------------------------------- */
function Gate({ onDone, notice }) {
  const setup = !isSetUp();
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
      if (setup) await setUpAdmin(email, pw); else await signInAdmin(email, pw);
      logAudit(setup ? 'admin.setup' : 'admin.login');
      onDone();
    } catch (x) {
      if (!setup) logAudit('admin.login_failed', email);
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
        <label>Passphrase<input type="password" autoComplete={setup ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {setup && <label>Repeat passphrase<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></label>}
        {err && <p className="ad-err" role="alert">{err}</p>}
        <button className="ad-btn gold" disabled={busy}>{busy ? 'Please wait…' : setup ? 'Create & enter' : 'Sign in'}</button>
      </form>
    </div>
  );
}

/* -------------------------------- console -------------------------------- */
function Console({ onLock }) {
  const [tab, setTab] = useState('overview');
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    window.addEventListener('storage', refresh);
    return () => { clearInterval(t); window.removeEventListener('storage', refresh); };
  }, []);

  const accounts = useMemo(() => listAccounts(), [tick]);
  const orders = useMemo(() => listOrders(), [tick]);
  const stats = useMemo(() => getStats(accounts, orders), [accounts, orders]);

  return (
    <div className="ad-shell">
      <header className="ad-top">
        <b>MERQO · Administrator</b>
        <span className="ad-who">{adminEmail()}</span>
        <button className="ad-btn" onClick={onLock}>Lock</button>
      </header>
      <nav className="ad-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}{id === 'sellers' && stats.sellersPending > 0 && <i>{stats.sellersPending}</i>}
          </button>
        ))}
      </nav>
      <main className="ad-main">
        {tab === 'overview' && <Overview stats={stats} go={setTab} />}
        {tab === 'sellers' && <Sellers accounts={accounts} onChange={refresh} />}
        {tab === 'accounts' && <Accounts accounts={accounts} />}
        {tab === 'orders' && <Orders orders={orders} stats={stats} />}
        {tab === 'audit' && <Audit tick={tick} />}
      </main>
    </div>
  );
}

const Stat = ({ label, value }) => <div className="ad-card ad-stat"><span>{label}</span><b>{value}</b></div>;

function Overview({ stats, go }) {
  return (
    <>
      {stats.sellersPending > 0 && (
        <button className="ad-alert" onClick={() => go('sellers')}>
          {stats.sellersPending} seller application{stats.sellersPending > 1 ? 's' : ''} waiting for review →
        </button>
      )}
      <div className="ad-grid">
        <Stat label="Accounts" value={stats.accounts} />
        <Stat label="Approved sellers" value={stats.sellersApproved} />
        <Stat label="Pending sellers" value={stats.sellersPending} />
        <Stat label="Orders" value={stats.orders} />
        <Stat label="Order volume" value={money(stats.volume)} />
        <Stat label="Held in escrow" value={money(stats.escrow)} />
      </div>
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

  const act = (status, needReason) => {
    let reason = '';
    if (needReason) {
      reason = (window.prompt(`Reason for ${status} (required):`) || '').trim();
      if (!reason) return;
    } else if (!window.confirm(`Set "${b.name || a.name}" to ${status}?`)) return;
    try { setSellerStatus(a.id, status, reason); onChange(); } catch (e) { window.alert(e.message); }
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
      <p className="ad-sub">Prototype: ID photos and KRA certificate are not stored yet, so they cannot be reviewed here. Verify them with your backend document storage.</p>
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
        <Stat label="Held in escrow" value={money(stats.escrow)} />
      </div>
      <div className="ad-table">
        <table>
          <thead><tr><th>Placed</th><th>Order</th><th>Buyer</th><th>Product</th><th>Seller</th><th>Qty</th><th>Amount</th><th>Stage</th><th>Payment</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}><td>{when(o.at)}</td><td>#{String(o.id).slice(-6)}</td><td>{o.customer?.name}<div className="ad-sub">{o.customer?.email || o.customer?.phone}</div></td><td>{o.product} ({o.size})</td><td>{o.seller}</td><td>{o.qty}</td><td>{money(o.amount)}</td><td>{o.stageLabel}</td><td>{o.payment}</td></tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="9" className="ad-empty">No customer orders yet. Place one in the public app while signed in.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------------- audit log -------------------------------- */
function Audit({ tick }) {
  const log = useMemo(() => listAudit(), [tick]);
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
