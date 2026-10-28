import React, { useMemo, useRef, useState, useCallback } from 'react';
import { PRODUCTS, money, initials } from '../data.js';
import Popover, { useOutside } from './ui/Popover.jsx';
import AccountMenu from './layout/AccountMenu.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  SearchIcon, SlidersIcon, ChevronDownIcon, CheckIcon, CloseIcon, BellIcon, CartIcon,
  PackageIcon, StarIcon, TagIcon, ResetIcon, FlameIcon,
} from './ui/Icons.jsx';

/* ---------- search helpers ---------- */
const SEARCH_STOP_WORDS = new Set(['a', 'an', 'the', 'for', 'and', 'with', 'in', 'on', 'by', 'size', 'sizes', 'color', 'colour']);

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchTerms(query) {
  return normalize(query)
    .split(' ')
    .filter(term => term.length > 0 && !SEARCH_STOP_WORDS.has(term) && (term.length > 1 || /\d/.test(term)));
}

function scoreProduct(product, terms, query) {
  if (!terms.length) return 0;

  const fields = {
    name: normalize(product.name),
    category: normalize(product.cat),
    seller: normalize(product.seller),
    description: normalize(product.desc),
    city: normalize(product.city),
    sizes: normalize((product.sizes || []).join(' ')),
    colors: normalize((product.colors || []).join(' ')),
  };

  const fullText = Object.values(fields).join(' ');
  let score = 0;

  terms.forEach(term => {
    if (fields.name === term) score += 100;
    else if (fields.name.startsWith(term)) score += 75;
    else if (fields.name.includes(term)) score += 55;
    else if (fields.category.includes(term)) score += 35;
    else if (fields.seller.includes(term)) score += 25;
    else if (fields.sizes.split(' ').includes(term)) score += 20;
    else if (fields.colors.includes(term)) score += 30;
    else if (fields.description.includes(term) || fields.city.includes(term)) score += 15;
    else if (fullText.includes(term)) score += 5;
  });

  const normalizedQuery = normalize(query);
  if (normalizedQuery && fields.name.includes(normalizedQuery)) score += 100;

  return score;
}

/* ---------- filter / sort config ---------- */
const CATS = ['For You', 'Shoes', 'Men', 'Women', 'Kids', 'Beauty', 'Accessories', 'Services'];

const SORTS = [
  { id: 'featured',   label: 'Featured',           icon: FlameIcon },
  { id: 'price-asc',  label: 'Price: low to high', icon: TagIcon },
  { id: 'price-desc', label: 'Price: high to low', icon: TagIcon },
  { id: 'rating',     label: 'Top rated',          icon: StarIcon },
  { id: 'orders',     label: 'Most orders',        icon: PackageIcon },
];

const ALL_CITIES = [...new Set(PRODUCTS.map(p => p.city))].sort();
const ALL_SIZES = [...new Set(PRODUCTS.flatMap(p => (p.sizes || []).map(String)))];
const ALL_COLORS = [...new Set(PRODUCTS.flatMap(p => p.colors || []))].sort();

const FilterSelect = ({ label, value, onChange, children }) => (
  <label className="ffield">
    <span>{label}</span>
    <div className="fselect">
      <select value={value} onChange={e => onChange(e.target.value)}>{children}</select>
      <ChevronDownIcon size={17} />
    </div>
  </label>
);

export default function Feed({ go, catFilter, setCatFilter, cartCount = 0, mode = 'buyer', onSwitchMode, addToCart, onShare, onComment, commentCount = () => 0, following = [], onFollow }) {
  const { requireAuth } = useAuth();
  const [liked, setLiked] = useState([]); // demo-only: ids of products the buyer has saved this session
  // MC - like counters, bursts, and double-tap heart animation
  const [burst, setBurst] = useState({});
  const [dtPop, setDtPop] = useState(null);
  const tapRef = useRef({ id: null, t: 0, timer: null });
  const isLiked = (id) => liked.includes(id);
  const likeCount = (product) => product.orders * 4 + product.id * 13 + (isLiked(product.id) ? 1 : 0);
  const fmtCount = (count) => (count >= 1000 ? (count / 1000).toFixed(1).replace('.0', '') + 'k' : String(count));

  const toggleLike = (id) => requireAuth('like products', () => {
    if (liked.includes(id)) {
      setLiked((current) => current.filter((productId) => productId !== id));
      return;
    }
    setLiked((current) => [...current, id]);
    setBurst((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
  });

  const onPostTap = (event, product) => {
    const tap = tapRef.current;
    const now = Date.now();
    if (tap.id === product.id && now - tap.t < 300) {
      clearTimeout(tap.timer);
      tap.id = null;
      tap.t = 0;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      requireAuth('like products', () => {
        setLiked((current) => (current.includes(product.id) ? current : [...current, product.id]));
        setBurst((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
        setDtPop({ id: product.id, x, y, n: now });
      });
      return;
    }
    tap.id = product.id;
    tap.t = now;
    tap.timer = setTimeout(() => {
      tap.id = null;
      go('product', { pid: product.id });
    }, 300);
  };

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [showSug, setShowSug] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [city, setCity] = useState('any');
  const [color, setColor] = useState('any');
  const [size, setSize] = useState('any');
  const [pmin, setPmin] = useState('');
  const [pmax, setPmax] = useState('');

  const barRef = useRef(null);
  const closeSug = useCallback(() => setShowSug(false), []);
  useOutside(barRef, closeSug, showSug);

  const terms = useMemo(() => getSearchTerms(query), [query]);
  const activeFilters = (city !== 'any' ? 1 : 0) + (color !== 'any' ? 1 : 0) + (size !== 'any' ? 1 : 0) + (pmin !== '' || pmax !== '' ? 1 : 0);

  const list = useMemo(() => {
    const lo = pmin === '' ? null : Number(pmin);
    const hi = pmax === '' ? null : Number(pmax);
    const rows = PRODUCTS
      .filter(p => catFilter === 'For You' || p.cat === catFilter)
      .filter(p => city === 'any' || p.city === city)
      .filter(p => color === 'any' || (p.colors || []).includes(color))
      .filter(p => size === 'any' || (p.sizes || []).map(String).includes(size))
      .filter(p => (lo === null || p.price >= lo) && (hi === null || p.price <= hi))
      .map((product, index) => ({ product, index, score: scoreProduct(product, terms, query) }))
      .filter(({ score }) => !terms.length || score > 0);

    rows.sort((a, b) => {
      switch (sort) {
        case 'price-asc':  return a.product.price - b.product.price;
        case 'price-desc': return b.product.price - a.product.price;
        case 'rating':     return b.product.rating - a.product.rating || b.product.orders - a.product.orders;
        case 'orders':     return b.product.orders - a.product.orders;
        default:           return b.score - a.score || a.index - b.index;
      }
    });
    return rows.map(r => r.product);
  }, [catFilter, query, terms, sort, city, color, size, pmin, pmax]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return PRODUCTS
      .filter(p => normalize(p.name).includes(q) || normalize(p.cat).includes(q) || normalize(p.seller).includes(q))
      .slice(0, 5);
  }, [query]);

  const resetFilters = () => { setCity('any'); setColor('any'); setSize('any'); setPmin(''); setPmax(''); };
  const digits = v => v.replace(/[^0-9]/g, '');
  const isFiltering = !!query.trim() || activeFilters > 0 || catFilter !== 'For You';
  const currentSort = SORTS.find(s => s.id === sort) || SORTS[0];
  const SortCurrentIcon = currentSort.icon;

  return (
    <React.Fragment>
      {/* ---------- top bar: search + filters + actions ---------- */}
      <div className="mc-bar" ref={barRef}>
        <div className="mc-searchbox">
          <SearchIcon size={18} />
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSug(true); }}
            onFocus={() => setShowSug(true)}
            placeholder="Search products, sizes, colors, sellers…"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="mc-clear" onClick={() => { setQuery(''); setShowSug(false); }} aria-label="Clear search">
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={'icon-btn mc-filterbtn' + (panelOpen || activeFilters ? ' on' : '')}
          onClick={() => { setPanelOpen(o => !o); setShowSug(false); }}
          aria-label="Filters"
          aria-expanded={panelOpen}
        >
          <SlidersIcon size={19} />
          {activeFilters > 0 && <span className="mc-count">{activeFilters}</span>}
        </button>

        <Popover
          trigger={({ open, toggle }) => (
            <button type="button" className={'icon-btn' + (open ? ' on' : '')} onClick={toggle} aria-label="Notifications" aria-expanded={open}>
              <BellIcon size={19} />
            </button>
          )}
        >
          <div className="menu-empty">
            <BellIcon size={20} />
            <b>You're all caught up</b>
            <span>Order updates and seller replies will show up here.</span>
          </div>
        </Popover>

        <button type="button" className="icon-btn" onClick={() => go('cart')} aria-label={'Cart, ' + cartCount + ' items'}>
          <CartIcon size={19} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        <AccountMenu go={go} mode={mode} onSwitchMode={onSwitchMode} cartCount={cartCount} />

        {showSug && suggestions.length > 0 && (
          <div className="search-suggestions" role="listbox">
            {suggestions.map(product => (
              <button
                type="button"
                key={product.id}
                role="option"
                aria-selected="false"
                onClick={() => { setQuery(product.name); setShowSug(false); }}
              >
                <span className="sug-main"><SearchIcon size={15} /><strong>{product.name}</strong></span>
                <span>{product.cat} · {money(product.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------- sort dropdown ---------- */}
      <div className="mc-sortrow">
        <Popover
          align="left"
          className="block"
          trigger={({ open, toggle }) => (
            <button type="button" className={'mc-sort' + (open ? ' open' : '')} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
              <SortCurrentIcon size={16} />
              <span>{currentSort.label}</span>
              <ChevronDownIcon size={18} className="mc-chev" />
            </button>
          )}
        >
          {({ close }) => SORTS.map(s => {
            const Ico = s.icon;
            return (
              <button type="button" key={s.id} role="option" aria-selected={s.id === sort} className={'menu-item' + (s.id === sort ? ' on' : '')} onClick={() => { setSort(s.id); close(); }}>
                <Ico size={16} /><span>{s.label}</span>
                {s.id === sort && <CheckIcon size={16} className="mi-check" />}
              </button>
            );
          })}
        </Popover>
      </div>

      {/* ---------- filters panel (opens in place, pushes content down) ---------- */}
      {panelOpen && (
        <div className="mc-panel" role="region" aria-label="Filters">
          <div className="fgrid">
            <FilterSelect label="Location" value={city} onChange={setCity}>
              <option value="any">All locations</option>
              {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Color" value={color} onChange={setColor}>
              <option value="any">All colors</option>
              {ALL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Size" value={size} onChange={setSize}>
              <option value="any">All sizes</option>
              {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <div className="ffield">
              <span>Price range (KSh)</span>
              <div className="fprice">
                <input inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={pmin} onChange={e => setPmin(digits(e.target.value))} />
                <input inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={pmax} onChange={e => setPmax(digits(e.target.value))} />
              </div>
            </div>
          </div>
          <button type="button" className="btn ghost fclear" onClick={resetFilters} disabled={!activeFilters}>
            <ResetIcon size={15} /> Clear filters
          </button>
        </div>
      )}

      <div className="mc-hint">
        <span>Search by product, category, seller, color, size, or location</span>
        {isFiltering && <b>{list.length} result{list.length === 1 ? '' : 's'}</b>}
      </div>

      {/* ---------- categories ---------- */}
      <div className="cats">
        {CATS.map(category => (
          <span
            key={category}
            role="button"
            tabIndex={0}
            className={category === catFilter ? 'on' : ''}
            onClick={() => setCatFilter(category)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCatFilter(category); } }}
          >
            {category}
          </span>
        ))}
      </div>

      {/* ---------- feed ---------- */}
      <div className="screen feed">
        {list.length === 0 ? (
          <div className="empty-state">
            <SearchIcon size={28} />
            <h3>No products found</h3>
            <p>Try a shorter search such as “Nike”, “sneakers”, or “beauty”, or loosen your filters.</p>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => { setQuery(''); resetFilters(); setCatFilter('For You'); }}
            >
              <ResetIcon size={15} /> Clear search &amp; filters
            </button>
          </div>
        ) : list.map(product => (
          <div className="post" key={product.id} onClick={(event) => onPostTap(event, product)}>
            <div className="vid" style={{ background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
            <div className="shade"></div>
            {dtPop && dtPop.id === product.id && (
              <svg className="dt-heart" key={dtPop.n} style={{ left: dtPop.x, top: dtPop.y }} viewBox="0 0 24 24" aria-hidden="true">
                <defs><linearGradient id="dtg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff7a93" /><stop offset="1" stopColor="#ff2d55" /></linearGradient></defs>
                <path fill="url(#dtg)" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )}
            <div className="post-info">
              <div className="seller-row">{product.seller}<span className="badge">✓ CERTIFIED</span></div>
              <h3>{product.name}</h3>
              <div className="price">{money(product.price)}</div>
              <div className="meta-line">⭐ {product.rating} · {product.orders} completed orders · {product.city}</div>
            </div>
            {/* MC - add products directly to the cart */}
            <div className="side-actions" onClick={event => event.stopPropagation()}>
              {/* MC - seller profile and follow actions */}
              <div className="seller-avatar-wrap">
                <button type="button" className="seller-avatar" onClick={() => go('sellerprofile', { pid: product.id })} aria-label={'View ' + product.seller + ' profile'}>
                  {initials(product.seller)}
                </button>
                <button
                  type="button"
                  className={'follow-badge' + (following.includes(product.seller) ? ' on' : '')}
                  onClick={() => onFollow && onFollow(product.seller)}
                  aria-label={following.includes(product.seller) ? 'Unfollow ' + product.seller : 'Follow ' + product.seller}
                >
                  {following.includes(product.seller) ? '✓' : '+'}
                </button>
              </div>
              <button type="button" className={'like-btn' + (isLiked(product.id) ? ' on' : '')} onClick={() => toggleLike(product.id)} aria-pressed={isLiked(product.id)} aria-label={isLiked(product.id) ? 'Unlike' : 'Like'}>
                <span className="heart-wrap">
                  {isLiked(product.id) && burst[product.id] > 0 && (
                    <span className="burst" key={burst[product.id]}>
                      <b className="ring"></b>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <i key={n} style={{ '--a': n * 45 + 'deg' }}></i>)}
                    </span>
                  )}
                  <svg className="heart" key={isLiked(product.id) ? 'on' + (burst[product.id] || 0) : 'off'} viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </span>
                <span className="count">{fmtCount(likeCount(product))}</span>
              </button>
              <button onClick={() => onComment(product.id)}><span className="ic">💬</span>{commentCount(product.id) || 'Comment'}</button>
              <button onClick={() => onShare(product.id)}><span className="ic">🔗</span>Share</button>
              <button onClick={() => go('dm', { pid: product.id })}><span className="ic">✉️</span>DM</button>
              <button onClick={() => addToCart(product.id, product.sizes[0])}><span className="ic">🛒</span>Add to cart</button>
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
