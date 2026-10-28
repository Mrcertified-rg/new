import React, { useState } from 'react';
import { PRODUCTS } from '../data.js';
import { useAuth } from '../auth/AuthContext.jsx';

const ago = (time) => {
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
  return Math.floor(seconds / 86400) + 'd';
};

export default function CommentsModal({ pid, comments, onAdd, onDelete, close }) {
  const { user, requireAuth } = useAuth();
  const [text, setText] = useState('');
  const product = PRODUCTS.find((item) => item.id === pid);

  const send = () => {
    const comment = text.trim();
    if (!comment) return;
    requireAuth('comment', () => {
      onAdd(pid, comment);
      setText('');
    });
  };

  return (
    <div className="modal-wrap" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal cm-sheet">
        <div className="row">
          <b>Comments{comments.length ? ' (' + comments.length + ')' : ''}</b>
          <span onClick={close} style={{ cursor: 'pointer' }}>✕</span>
        </div>
        {product && <p className="pill" style={{ marginTop: 2 }}>{product.name}</p>}

        <div className="cm-list">
          {!comments.length && <p style={{ color: 'var(--sub)', fontSize: 13.5, textAlign: 'center', padding: '28px 0' }}>No comments yet. Be the first to comment.</p>}
          {comments.map((comment) => (
            <div className="cm-item" key={comment.id}>
              <span className="menu-avatar">{comment.name.slice(0, 2).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5 }}><b>{comment.name}</b> <span style={{ color: 'var(--sub)' }}>· {ago(comment.time)}</span></div>
                <div style={{ fontSize: 13.5, marginTop: 2, wordBreak: 'break-word' }}>{comment.text}</div>
              </div>
              {user && comment.uid === user.id && (
                <button type="button" className="rm" onClick={() => onDelete(pid, comment.id)} aria-label="Delete comment">🗑</button>
              )}
            </div>
          ))}
        </div>

        <div className="cm-input">
          <input
            value={text}
            maxLength={300}
            placeholder={user ? 'Add a comment...' : 'Sign in to comment...'}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') send(); }}
          />
          <button type="button" className="btn green" style={{ padding: '10px 16px', opacity: text.trim() ? 1 : 0.4 }} onClick={send}>Post</button>
        </div>
      </div>
    </div>
  );
}
