import React, { useState } from 'react';
import { PRODUCTS } from '../data.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { listChats, sendMessage, fullName, personInitials } from '../social/socialService.js';

// MC - share a product with friends or via an external product link
export default function ShareSheet({ pid, close, onExternal, go, showToast }) {
  const { user, promptAuth } = useAuth();
  const [sent, setSent] = useState([]);
  const product = PRODUCTS.find((item) => item.id === pid);
  const friends = user ? listChats(user.id).map((chat) => chat.person) : [];

  const send = (friend) => {
    if (sendMessage(user.id, friend.id, { productId: pid })) {
      setSent((current) => [...current, friend.id]);
      showToast('Sent to ' + friend.firstName);
    }
  };

  return (
    <div className="modal-wrap" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal">
        <div className="row"><b>Share</b><span onClick={close} style={{ cursor: 'pointer' }}>✕</span></div>
        {product && <p className="pill" style={{ marginTop: 2 }}>{product.name}</p>}

        <div className="menu-label" style={{ padding: '12px 0 4px' }}>SEND TO A FRIEND</div>
        {!user && (
          <button type="button" className="btn ghost" style={{ width: '100%' }} onClick={() => { close(); promptAuth('send to friends', null); }}>Sign in to send to friends</button>
        )}
        {user && !friends.length && (
          <div style={{ color: 'var(--sub)', fontSize: 13 }}>
            You have no friends here yet.
            <button type="button" className="mini" style={{ marginLeft: 8 }} onClick={() => { close(); go('friends'); }}>Find people</button>
          </div>
        )}
        {friends.map((friend) => (
          <div className="person" key={friend.id}>
            <span className="pa">{personInitials(friend)}</span>
            <div className="pi"><b>{fullName(friend)}</b></div>
            {sent.includes(friend.id)
              ? <span className="mini ghost">Sent ✓</span>
              : <button type="button" className="mini green" onClick={() => send(friend)}>Send</button>}
          </div>
        ))}

        <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => { close(); onExternal(pid); }}>🔗 Share link outside the app…</button>
      </div>
    </div>
  );
}
