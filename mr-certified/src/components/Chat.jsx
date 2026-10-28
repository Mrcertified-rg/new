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
    <div className="mq-chat-screen mq-friend-chat">
      <div className="mq-chat-header">
        <button type="button" className="mq-chat-back" onClick={() => go('friends')} aria-label="Back to friends">←</button>
        <span className="mq-chat-person-avatar">{personInitials(other)}</span>
        <div className="mq-chat-head-copy">
          <b>{fullName(other)}</b>
          <span>Friends chat · {status === 'friends' ? 'Friend' : 'Not friends'}</span>
        </div>
        {status === 'friends' && <button type="button" className="mq-chat-unfriend" onClick={unfriend}>Unfriend</button>}
      </div>

      <div className="mq-chat-messages">
        {!messages.length && <div className="mq-chat-empty">Say hi, or tap + to share a product with your friend.</div>}
        {messages.map((message) => {
          const product = message.productId ? PRODUCTS.find((item) => item.id === message.productId) : null;
          return (
            <div key={message.id} className={'mq-chat-bubble ' + (message.from === me.id ? 'sent' : 'received')}>
              {product && (
                <div className="mq-chat-shared-product" onClick={() => go('product', { pid: product.id })}>
                  <div className="mq-chat-thumb" style={{ background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
                  <div className="mq-chat-context-info"><b>{product.name}</b><span>{money(product.price)} · {product.seller}</span></div>
                  <span className="mq-chat-context-action">View ›</span>
                </div>
              )}
              {message.text && <div style={{ wordBreak: 'break-word' }}>{renderText(message.text, go)}</div>}
              <span className="mq-chat-time">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {picker && (
        <div className="mq-chat-picker">
          <div className="mq-chat-section-label">SHARE A PRODUCT WITH YOUR FRIEND</div>
          {PRODUCTS.map((product) => (
            <div className="mq-chat-picker-item" key={product.id} onClick={() => shareProduct(product.id)}>
              <div className="mq-chat-thumb" style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
              <div className="mq-chat-context-info"><b>{product.name}</b><span>{money(product.price)} · {product.seller}</span></div>
              <span className="mq-chat-context-action">Send</span>
            </div>
          ))}
        </div>
      )}

      {status === 'friends' ? (
        <div className="mq-chat-compose">
          <button type="button" className="mq-chat-attach" onClick={() => setPicker(!picker)} aria-label="Send a product">＋</button>
          <input value={text} placeholder="Message your friend..." onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} />
          <button type="button" className="mq-chat-send" onClick={submit}>Send</button>
        </div>
      ) : (
        <div className="mq-chat-compose mq-chat-disabled">You can only message people who are your friends.</div>
      )}
    </div>
  );
}
