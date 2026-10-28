import React, { useMemo, useRef, useState, useCallback } from 'react';
import { PRODUCTS, money } from '../data.js';
import Popover, { useOutside } from './ui/Popover.jsx';
import AccountMenu from './layout/AccountMenu.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  SearchIcon, SlidersIcon, ChevronDownIcon, CheckIcon, CloseIcon, BellIcon, CartIcon,
  PackageIcon, StarIcon, TagIcon, ResetIcon, FlameIcon, BagIcon, MessageIcon,
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
const CATEGORY_EDITS = [
  { category: 'Shoes', title: 'Street rotation', note: 'Pairs with a point of view' },
  { category: 'Men', title: 'Everyday layers', note: 'Easy pieces, made to wear' },
  { category: 'Beauty', title: 'Soft life', note: 'Small rituals, good energy' },
  { category: 'Kids', title: 'Little legends', note: 'Good finds for growing days' },
];

const CATS = ['For You', ...new Set(PRODUCTS.map(product => product.cat))];
const SPOTLIGHT = [...PRODUCTS].sort((a, b) => b.rating - a.rating || b.orders - a.orders)[0];

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
  const isLiked = (id) => liked.includes(id);
  const likeCount = (product) => product.orders * 4 + product.id * 13 + (isLiked(product.id) ? 1 : 0);
  const fmtCount = (count) => (count >= 1000 ? (count / 1000).toFixed(1).replace('.0', '') + 'k' : String(count));

  const toggleLike = (id) => requireAuth('like products', () => {
    if (liked.includes(id)) {
      setLiked((current) => current.filter((productId) => productId !== id));
      return;
    }
    setLiked((current) => [...current, id]);
  });

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
  const showSpotlight = !isFiltering;
  const categoryEdits = CATEGORY_EDITS.filter(edit => CATS.includes(edit.category));
  const currentSort = SORTS.find(s => s.id === sort) || SORTS[0];
  const SortCurrentIcon = currentSort.icon;

  return (
    <React.Fragment>
      <div className="mc-masthead">
        <div className="mc-wordmark">MERQO<span>.</span></div>
        <div className="mc-edition"><span>THE BUYER'S EDIT</span><b>KENYA · 001</b></div>
      </div>
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

      <div className="mc-intro">
        <span className="mc-kicker">GOOD TASTE. SOLID PROOF.</span>
        <h1>Find the one that feels like you.</h1>
        <p>Meet standout goods from Kenyan shops with a track record.</p>
      </div>

      {showSpotlight && (
        <section className="market-spotlight" aria-label="MERQO standout pick">
          <div className="spotlight-art" style={{ '--art-a': SPOTLIGHT.g[0], '--art-b': SPOTLIGHT.g[1] }} aria-hidden="true">
            <span className="spotlight-orbit"></span>
            <span className="spotlight-serial">MQ / PICK 001</span>
            <span className="spotlight-category">{SPOTLIGHT.cat}</span>
          </div>
          <div className="spotlight-copy">
            <span className="spotlight-label"><StarIcon size={12} /> THE MERQO STANDOUT</span>
            <h2>{SPOTLIGHT.name}</h2>
            <p className="spotlight-seller">{SPOTLIGHT.seller} <span>·</span> {SPOTLIGHT.city}</p>
            <div className="spotlight-proof">
              <span>★ {SPOTLIGHT.rating}</span>
              <span>{SPOTLIGHT.orders} completed orders</span>
              <span>{SPOTLIGHT.delivery}% delivery rate</span>
            </div>
            <div className="spotlight-bottom">
              <b>{money(SPOTLIGHT.price)}</b>
              <button type="button" onClick={() => go('product', { pid: SPOTLIGHT.id })}>Meet the find <span aria-hidden="true">↗</span></button>
            </div>
          </div>
        </section>
      )}

      {/* ---------- mood-led discovery ---------- */}
      <section className="market-edits" aria-label="Shop by mood">
        <div className="market-section-head">
          <div><span className="mc-kicker">YOUR VIBE, YOUR FINDS</span><h2>Shop by mood</h2></div>
          <div className="market-section-actions">
            {isFiltering && <span className="market-result-count">{list.length} result{list.length === 1 ? '' : 's'}</span>}
            <button
              type="button"
              className={'market-budget' + (pmax === '2500' && pmin === '' ? ' on' : '')}
              aria-pressed={pmax === '2500' && pmin === ''}
              onClick={() => {
                const active = pmax === '2500' && pmin === '';
                setPmin('');
                setPmax(active ? '' : '2500');
                setSort('price-asc');
              }}
            >
              <span>₭</span><b>Under 2.5k</b><i>{pmax === '2500' && pmin === '' ? '✓' : '↗'}</i>
            </button>
          </div>
        </div>
        <div className="market-edit-list">
          <button
            type="button"
            className={'market-edit market-edit-all' + (catFilter === 'For You' ? ' on' : '')}
            onClick={() => setCatFilter('For You')}
            aria-pressed={catFilter === 'For You'}
          >
            <span className="market-edit-mark">✳</span><span><b>Surprise me</b><small>The whole good list</small></span><i>↗</i>
          </button>
          {categoryEdits.map((edit, index) => (
            <button
              type="button"
              key={edit.category}
              className={'market-edit market-edit-' + index + (edit.category === catFilter ? ' on' : '')}
              onClick={() => setCatFilter(edit.category)}
              aria-pressed={edit.category === catFilter}
            >
              <span className="market-edit-mark">{['◌', '▧', '✷', '⌂'][index]}</span>
              <span><b>{edit.title}</b><small>{edit.note}</small></span>
              <i>↗</i>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- feed ---------- */}
      <div className="screen market-feed">
        {!isFiltering && <div className="market-list-heading"><span>THE GOOD STUFF</span><span>{list.length} finds, no filler</span></div>}
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
        ) : list.map((product, index) => (
          <article className="market-card" key={product.id}>
            <button
              type="button"
              className={'market-art market-tone-' + (index % 4)}
              style={{ '--art-a': product.g[0], '--art-b': product.g[1] }}
              onClick={() => go('product', { pid: product.id })}
              aria-label={'View ' + product.name}
            >
              <span className="market-art-head"><span>MERQO / {product.cat.toUpperCase()}</span><span>№ {String(product.id).padStart(3, '0')}</span></span>
              <span className="market-orbit" aria-hidden="true"></span>
              <span className="market-art-title">{product.cat}</span>
              <span className="market-art-stamp">SHOP<br />CHECKED</span>
            </button>
            <div className="market-card-body">
              <div className="market-seller">
                <button type="button" onClick={() => go('sellerprofile', { pid: product.id })}>{product.seller}<span className="market-verified">✓</span></button>
                <button
                  type="button"
                  className={'market-follow' + (following.includes(product.seller) ? ' on' : '')}
                  onClick={() => onFollow && onFollow(product.seller)}
                  aria-label={following.includes(product.seller) ? 'Unfollow ' + product.seller : 'Follow ' + product.seller}
                >
                  {following.includes(product.seller) ? 'Following' : '+ Follow'}
                </button>
              </div>
              <button type="button" className="market-product-title" onClick={() => go('product', { pid: product.id })}>{product.name}</button>
              <div className="market-rating"><span>★ {product.rating}</span><span>·</span><span>{product.city}</span></div>
              <div className="market-buy-row">
                <span className="market-price">{money(product.price)}</span>
                <button type="button" className="market-add" onClick={() => addToCart(product.id, product.sizes[0])}><BagIcon size={15} /> Add</button>
              </div>
              <div className="market-actions">
                <button type="button" className={'market-like' + (isLiked(product.id) ? ' on' : '')} onClick={() => toggleLike(product.id)} aria-pressed={isLiked(product.id)} aria-label={isLiked(product.id) ? 'Unlike product' : 'Like product'} title="Like">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                  <span>{fmtCount(likeCount(product))}</span>
                </button>
                <button type="button" onClick={() => onComment(product.id)} aria-label="View comments" title="Comments"><MessageIcon size={16} /><span>{commentCount(product.id) || ''}</span></button>
                <button type="button" onClick={() => onShare(product.id)} aria-label="Share product" title="Share">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" /></svg>
                </button>
                <button type="button" onClick={() => go('dm', { pid: product.id })} aria-label="Message seller" title="Message seller"><span className="market-dm">DM</span></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </React.Fragment>
  );
}
