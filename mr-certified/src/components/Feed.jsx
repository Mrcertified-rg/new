import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PRODUCTS, money } from '../data.js';
import Popover, { useOutside } from './ui/Popover.jsx';
import AccountMenu from './layout/AccountMenu.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  SearchIcon, SlidersIcon, ChevronDownIcon, CloseIcon, BellIcon,
  StarIcon, ResetIcon, BagIcon, MessageIcon,
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
const CATEGORY_TABS = [
  { value: 'For You', label: 'For You' },
  { value: 'Women', label: 'Women' },
  { value: 'Men', label: 'Men' },
  { value: 'Kids', label: 'Kids' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Shoes', label: 'Shoes' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Home & Household', label: 'Home & household' },
  { value: 'Services', label: 'Services' },
];

const PROMO_SLIDES = [
  { product: PRODUCTS.find(product => product.id === 1), type: 'FEATURED SHOP', title: 'Find your next everyday favorite.' },
  { product: PRODUCTS.find(product => product.id === 4), type: 'SHOP ANNOUNCEMENT', title: 'A little local care goes a long way.' },
  { product: PRODUCTS.find(product => product.id === 6), type: 'POPULAR PICK', title: 'Good finds for growing days.' },
].filter(slide => slide.product);

const SORTS = [
  { id: 'featured',   label: 'Featured' },
  { id: 'price-asc',  label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating',     label: 'Top rated' },
  { id: 'orders',     label: 'Most orders' },
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

// Intro/standout/mood block: how far to scroll down before it hides, and how far to scroll back up (long lists) before it returns
const HERO_HIDE_AFTER_PX = 12;
const HERO_REVEAL_UP_PX = 360;

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
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoPaused, setPromoPaused] = useState(false);
  const promoTouchStart = useRef(null);
  const [city, setCity] = useState('any');
  const [color, setColor] = useState('any');
  const [size, setSize] = useState('any');
  const [pmin, setPmin] = useState('');
  const [pmax, setPmax] = useState('');

  const barRef = useRef(null);

  useEffect(() => {
    if (promoPaused || PROMO_SLIDES.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setPromoIndex(index => (index + 1) % PROMO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [promoPaused, promoIndex]);

  // Collapse the intro / standout / mood block while scrolling down so more products fit on small screens;
  // bring it back as soon as the user scrolls up.
  const [heroHidden, setHeroHidden] = useState(false);
  const heroRef = useRef(null);
  const lastScrollTop = useRef(0);
  const heroLockUntil = useRef(0);

  const upTravel = useRef(0);

  const handleFeedScroll = useCallback((e) => {
    const el = e.currentTarget;
    const top = Math.max(0, el.scrollTop);
    const delta = top - lastScrollTop.current;
    lastScrollTop.current = top;

    // ignore the scroll events caused by the collapse/expand animation itself
    if (Date.now() < heroLockUntil.current) { upTravel.current = 0; return; }

    // distance scrolled up in one go (resets whenever the user scrolls down again)
    if (delta < 0) upTravel.current += -delta;
    else if (delta > 0) upTravel.current = 0;

    const room = el.scrollHeight - el.clientHeight;          // how far the list can scroll
    const manyProducts = room > el.clientHeight * 2;         // long list vs. just a few products

    if (heroHidden) {
      // few products: only come back at the very top; many products: come back after ~3 upward swipes
      if (top <= 4 || (manyProducts && upTravel.current >= HERO_REVEAL_UP_PX)) {
        setHeroHidden(false);
        heroLockUntil.current = Date.now() + 400;
        upTravel.current = 0;
      }
    } else if (delta > 2 && top > HERO_HIDE_AFTER_PX) {
      // hide as soon as the first products have moved up a little, if the list stays scrollable afterwards
      const heroH = heroRef.current ? heroRef.current.offsetHeight : 0;
      if (room > heroH + 80) {
        setHeroHidden(true);
        heroLockUntil.current = Date.now() + 400;
        upTravel.current = 0;
      }
    }
  }, [heroHidden]);
  const closeSug = useCallback(() => setShowSug(false), []);
  useOutside(barRef, closeSug, showSug);

  const terms = useMemo(() => getSearchTerms(query), [query]);
  const activeFilters = (city !== 'any' ? 1 : 0) + (color !== 'any' ? 1 : 0) + (size !== 'any' ? 1 : 0) + (pmin !== '' || pmax !== '' ? 1 : 0);
  const activeOptions = activeFilters + (sort !== 'featured' ? 1 : 0);

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

  return (
    <React.Fragment>
      <div className="mc-masthead">
        <div className="mc-wordmark">MERQO<span>.</span></div>
        <div className="mc-masthead-right">
          <div className="mc-edition"><span>THE BUYER'S EDIT</span><b>KENYA · 001</b></div>
          <ThemeToggle />
        </div>
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
          className={'icon-btn mc-filterbtn' + (panelOpen || activeOptions ? ' on' : '')}
          onClick={() => { setPanelOpen(o => !o); setShowSug(false); }}
          aria-label="Filters and sorting"
          aria-expanded={panelOpen}
        >
          <SlidersIcon size={19} />
          {activeOptions > 0 && <span className="mc-count">{activeOptions}</span>}
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

      {/* ---------- filters panel (opens in place, pushes content down) ---------- */}
      {panelOpen && (
        <div className="mc-panel" role="region" aria-label="Filters">
          <div className="fgrid">
            <FilterSelect label="Sort by" value={sort} onChange={setSort}>
              {SORTS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </FilterSelect>
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

      <div className={'mc-collapsible' + (heroHidden ? ' is-hidden' : '')} ref={heroRef} aria-hidden={heroHidden}>
      <div className="mc-collapsible-inner">
      <div className="mc-intro">
        <p>Meet standout goods from Kenyan shops with a track record.</p>
      </div>

      {showSpotlight && (
        <section
          className="market-spotlight"
          aria-label="Featured shop promotions"
          aria-roledescription="carousel"
          onMouseEnter={() => setPromoPaused(true)}
          onMouseLeave={() => setPromoPaused(false)}
          onFocusCapture={() => setPromoPaused(true)}
          onBlurCapture={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPromoPaused(false);
          }}
          onTouchStart={event => {
            promoTouchStart.current = event.touches[0].clientX;
            setPromoPaused(true);
          }}
          onTouchEnd={event => {
            if (promoTouchStart.current === null) return;
            const distance = event.changedTouches[0].clientX - promoTouchStart.current;
            if (Math.abs(distance) > 40) {
              setPromoIndex(index => (index + (distance < 0 ? 1 : -1) + PROMO_SLIDES.length) % PROMO_SLIDES.length);
            }
            promoTouchStart.current = null;
            setPromoPaused(false);
          }}
          onTouchCancel={() => {
            promoTouchStart.current = null;
            setPromoPaused(false);
          }}
        >
          <div className="promo-track" style={{ transform: `translateX(-${promoIndex * 100}%)` }}>
            {PROMO_SLIDES.map((slide, index) => {
              const product = slide.product;
              return (
                <article className="promo-slide" key={product.id} aria-hidden={index !== promoIndex} aria-label={`${slide.type}: ${product.seller}`}>
                  <div className="spotlight-art" style={{ '--art-a': product.g[0], '--art-b': product.g[1] }} aria-hidden="true">
                    <span className="spotlight-orbit"></span>
                    <span className="spotlight-serial">MERQO / FEATURED</span>
                    <span className="spotlight-category">{product.cat}</span>
                  </div>
                  <div className="spotlight-copy">
                    <span className="spotlight-label"><StarIcon size={12} /> {slide.type}</span>
                    <h2>{slide.title}</h2>
                    <p className="spotlight-seller">{product.seller} <span>·</span> {product.city}</p>
                    <div className="spotlight-proof">
                      <span>★ {product.rating}</span>
                      <span>{product.orders} completed orders</span>
                    </div>
                    <div className="spotlight-bottom">
                      <b>{money(product.price)}</b>
                      <button type="button" tabIndex={index === promoIndex ? 0 : -1} onClick={() => go('product', { pid: product.id })}>View find <span aria-hidden="true">↗</span></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="promo-dots" aria-label="Choose a featured promotion">
            {PROMO_SLIDES.map((slide, index) => (
              <button
                type="button"
                key={slide.product.id}
                className={index === promoIndex ? 'on' : ''}
                aria-label={`Show promotion ${index + 1}: ${slide.type}`}
                aria-pressed={index === promoIndex}
                onClick={() => setPromoIndex(index)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- curated categories ---------- */}
      <section className="market-edits" aria-label="Product categories">
        {isFiltering && (
          <div className="market-section-head">
            <div className="market-section-actions">
              <span className="market-result-count">{list.length} result{list.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}
        <div className="market-edit-list">
          {CATEGORY_TABS.map(category => (
            <button
              type="button"
              key={category.value}
              className={'market-edit' + (category.value === catFilter ? ' on' : '')}
              onClick={() => setCatFilter(category.value)}
              aria-pressed={category.value === catFilter}
            >
              <b>{category.label}</b>
            </button>
          ))}
        </div>
      </section>
      </div>
      </div>

      {/* ---------- feed ---------- */}
      <div className="screen market-feed" onScroll={handleFeedScroll}>
        {!isFiltering && <div className="market-list-heading"><span>THE GOOD STUFF</span><span>{list.length} finds, no filler</span></div>}
        {list.length === 0 ? (
          <div className="empty-state">
            <SearchIcon size={28} />
            <h3>No products found</h3>
            <p>Try a shorter search such as "Nike", "sneakers", or "beauty", or loosen your filters.</p>
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
