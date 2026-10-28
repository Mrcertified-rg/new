import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS, money } from '../data.js';
import { getPerson } from '../auth/authService.js';
import { relation, getMessages, sendMessage, markRead, removeLink, fullName, personInitials } from '../social/socialService.js';

function renderText(text, go) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return part;
    const match = part.match(/[?&]product=(\d+)/);
    const inApp = match && part.startsWith(window.location.origin);
    return (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline', color: 'inherit', wordBreak: 'break-all' }}
        onClick={inApp ? (event) => { event.preventDefault(); go('product', { pid: Number(match[1]) }); } : undefined}
      >
        {part}
      </a>
    );
  });
}

export default function Chat({ me, otherId, go }) {
  const other = getPerson(otherId);
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const [, setTick] = useState(0);
  const endRef = useRef(null);
  const bump = () => setTick((tick) => tick + 1);

  // MC - receive chat updates from other tabs and accounts in this browser
  useEffect(() => {
    const timer = setInterval(bump, 1500);
    window.addEventListener('storage', bump);
    return () => { clearInterval(timer); window.removeEventListener('storage', bump); };
  }, []);

  const messages = other ? getMessages(me.id, otherId) : [];
  const status = other ? relation(me.id, otherId) : 'none';

  useEffect(() => { if (other) markRead(me.id, otherId); }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: 'end' }); }, [messages.length]);

  if (!other) {
    return (
      <div className="screen pad" style={{ paddingTop: 20 }}>
        <div className="card">This person could not be found.</div>
        <button className="btn" onClick={() => go('friends')}>Back to friends</button>
      </div>
    );
  }

  const submit = () => {
    if (!text.trim()) return;
    sendMessage(me.id, otherId, { text });
    setText('');
    bump();
  };
  const shareProduct = (productId) => { sendMessage(me.id, otherId, { productId }); setPicker(false); bump(); };
  const unfriend = () => {
    if (window.confirm('Remove ' + fullName(other) + ' from your friends?')) { removeLink(me.id, otherId); go('friends'); }
  };

  return (
    <React.Fragment>
      <div className="topbar" style={{ justifyContent: 'flex-start', gap: 10 }}>
        <span className="menu-avatar">{personInitials(other)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15 }}>{fullName(other)}</b>
          <div className="pill">{status === 'friends' ? 'Friend' : 'Not friends'}</div>
        </div>
        {status === 'friends' && <button type="button" className="rm" onClick={unfriend}>Unfriend</button>}
      </div>

      <div className="screen pad" style={{ paddingTop: 12 }}>
        {!messages.length && <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Say hi, or tap 🛍 to send a product you like.</p>}
        {messages.map((message) => {
          const product = message.productId ? PRODUCTS.find((item) => item.id === message.productId) : null;
          return (
            <div key={message.id} className={'ai-msg ' + (message.from === me.id ? 'me' : '')}>
              {product && (
                <div className="chat-prod" onClick={() => go('product', { pid: product.id })}>
                  <div className="th" style={{ background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
                  <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{product.name}</b><div style={{ fontSize: 12 }}>{money(product.price)} · {product.seller}</div></div>
                  <span style={{ fontSize: 12 }}>View ›</span>
                </div>
              )}
              {message.text && <div style={{ wordBreak: 'break-word' }}>{renderText(message.text, go)}</div>}
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>

      {picker && (
        <div className="picker">
          <div className="pill" style={{ padding: '4px 0' }}>Pick a product to send</div>
          {PRODUCTS.map((product) => (
            <div className="person" key={product.id} onClick={() => shareProduct(product.id)} style={{ cursor: 'pointer', padding: '7px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flex: '0 0 auto', background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
              <div className="pi"><b style={{ fontSize: 13 }}>{product.name}</b><span>{money(product.price)} · {product.seller}</span></div>
              <span className="mini">Send</span>
            </div>
          ))}
        </div>
      )}

      {status === 'friends' ? (
        <div className="ai-input">
          <button type="button" className="mini ghost" style={{ fontSize: 16 }} onClick={() => setPicker(!picker)} aria-label="Send a product">🛍</button>
          <input value={text} placeholder="Write a message..." onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} />
          <button className="btn" style={{ padding: '10px 16px' }} onClick={submit}>Send</button>
        </div>
      ) : (
        <div className="ai-input" style={{ justifyContent: 'center', color: 'var(--sub)', fontSize: 13 }}>You can only message people who are your friends.</div>
      )}
    </React.Fragment>
  );
}
