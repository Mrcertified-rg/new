import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS } from '../data.js';
import ProductPreview from './ProductPreview.jsx';
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

export default function Chat({ me, otherId, go, onBack }) {
  const other = getPerson(otherId);
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const [sending, setSending] = useState(false);
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
    if (!text.trim() || sending) return;
    setSending(true);
    sendMessage(me.id, otherId, { text });
    setText('');
    bump();
    setTimeout(() => setSending(false), 150);
  };
  const shareProduct = (productId) => { sendMessage(me.id, otherId, { productId }); setPicker(false); bump(); };
  const unfriend = () => {
    if (window.confirm('Remove ' + fullName(other) + ' from your friends?')) { removeLink(me.id, otherId); go('friends'); }
  };

  return (
    <div className="mq-chat-screen mq-friend-chat">
      <div className="mq-chat-header">
        <button type="button" className="mq-chat-back" onClick={onBack || (() => go('friends'))} aria-label="Go back" title="Go back">←</button>
        <span className={'mq-chat-person-avatar' + (other.profilePicture ? ' has-photo' : '')}>
          {other.profilePicture ? <img src={other.profilePicture} alt="" /> : personInitials(other)}
        </span>
        <div className="mq-chat-head-copy">
          <b>{fullName(other)}</b>
          <span>Buyer conversation · {status === 'friends' ? 'Connected' : 'Not connected'}</span>
        </div>
        <span className={'mq-chat-header-profile' + (me.profilePicture ? ' has-photo' : '')} aria-label="Your profile picture">
          {me.profilePicture ? <img src={me.profilePicture} alt="" /> : (me.firstName?.[0] || me.name?.[0] || 'U')}
        </span>
      </div>

      <div className="mq-chat-messages">
        {!messages.length && <div className="mq-chat-empty"><b>Start the conversation</b><span>Share product details, pricing, or delivery information.</span></div>}
        {messages.map((message, index) => {
          const product = message.productId ? PRODUCTS.find((item) => item.id === message.productId) : null;
          return (
            <React.Fragment key={message.id}>
            {(index===0||new Date(message.time).toDateString()!==new Date(messages[index-1].time).toDateString())&&<div className="mq-chat-date">{new Date(message.time).toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'})}</div>}
            <div className={'mq-chat-bubble ' + (message.from === me.id ? 'sent' : 'received')}>
              {product && (
                <ProductPreview product={product} compact onView={() => go('product', { pid: product.id })} />
              )}
              {message.text && <div style={{ wordBreak: 'break-word' }}>{renderText(message.text, go)}</div>}
              <span className="mq-chat-time">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {message.from===me.id&&<span className="mq-chat-status">✓</span>}
            </div>
            </React.Fragment>
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
          <button type="button" className="mq-chat-attach" onClick={() => setPicker(!picker)} aria-label="Share a product">＋</button>
          <button type="button" className="mq-chat-emoji" onClick={()=>setText((value)=>value+'🙂')} aria-label="Add emoji">☺</button>
          <textarea value={text} placeholder="Write a message..." rows="1" onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter'&&!event.shiftKey){event.preventDefault();submit();} }} />
          <button type="button" className="mq-chat-send" onClick={submit} disabled={sending||!text.trim()}>{sending?'…':'Send'}</button>
        </div>
      ) : (
        <div className="mq-chat-compose mq-chat-disabled">You can only message people who are your friends.</div>
      )}
    </div>
  );
}
