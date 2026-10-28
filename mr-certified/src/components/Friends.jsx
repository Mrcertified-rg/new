import React, { useEffect, useState } from 'react';
import { PRODUCTS } from '../data.js';
import { findPeople } from '../auth/authService.js';
import {
  relation, sendFriendRequest, acceptRequest, removeLink,
  listChats, listIncoming, listOutgoing, fullName, personInitials,
} from '../social/socialService.js';

function Person({ person, sub, children, className = '' }) {
  return (
    <div className={'person mq-chat-person-row ' + className}>
      <span className="pa mq-chat-list-avatar">{personInitials(person)}</span>
      <div className="pi mq-chat-list-copy"><b>{fullName(person)}</b>{sub && <span>{sub}</span>}</div>
      {children}
    </div>
  );
}

export default function Friends({ me, go, openChat, following = [], onFollow, showToast, dms = {} }) {
  const [tab, setTab] = useState('Chats');
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);
  const bump = () => setTick((tick) => tick + 1);

  // MC - refresh locally stored friend requests and messages while this screen is open
  useEffect(() => {
    const timer = setInterval(bump, 2000);
    return () => clearInterval(timer);
  }, []);

  const chats = listChats(me.id);
  const incoming = listIncoming(me.id);
  const outgoing = listOutgoing(me.id);
  // MC - surface product DM threads alongside friend conversations
  const productChats = PRODUCTS
    .filter((product) => dms[product.id]?.length)
    .map((product) => ({ product, last: dms[product.id][dms[product.id].length - 1] }));
  const results = tab === 'Find people' ? findPeople(query, me.id) : [];
  // MC - search seller stores by name, location, and the products they offer
  const searchTerm = query.trim().toLowerCase();
  const storeResults = tab === 'Find people' && searchTerm.length >= 2
    ? [...new Map(PRODUCTS.map((product) => [product.seller, product])).values()]
      .filter((store) => PRODUCTS.some((product) =>
        product.seller === store.seller
        && (store.seller.toLowerCase().includes(searchTerm)
          || product.city.toLowerCase().includes(searchTerm)
          || product.name.toLowerCase().includes(searchTerm))))
    : [];
  const tabs = ['Chats', 'Requests', 'Find people', 'Sellers'];
  const tabLabel = (name) => (name === 'Requests' && incoming.length ? 'Requests (' + incoming.length + ')' : name);
  const preview = (message) => {
    if (!message) return 'Say hi 👋';
    const sender = message.from === me.id ? 'You: ' : '';
    return sender + (message.productId ? '🛍 Shared a product' : message.text);
  };

  return (
    <React.Fragment>
      <div className="topbar"><h1>Friends &amp; chats</h1></div>
      <div className="tabs sm">
        {tabs.map((name) => <span key={name} className={name === tab ? 'on' : ''} onClick={() => setTab(name)}>{tabLabel(name)}</span>)}
      </div>

      <div className="screen pad" style={{ paddingTop: 8 }}>
        {tab === 'Chats' && (
          <React.Fragment>
            {!chats.length && !productChats.length && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 13.5 }}>
                No friends yet. Tap <b>Find people</b> to search for a friend and send a request.
                <div><button className="btn" style={{ marginTop: 12 }} onClick={() => setTab('Find people')}>Find people</button></div>
              </div>
            )}
            {chats.length > 0 && <div className="mq-chat-section-label">FRIENDS CHATS</div>}
            {chats.map((chat) => (
              <div key={chat.person.id} onClick={() => openChat(chat.person.id)} style={{ cursor: 'pointer' }}>
                <Person person={chat.person} sub={preview(chat.last)}>
                  {chat.unread > 0 && <span className="unread">{chat.unread}</span>}
                </Person>
              </div>
            ))}
            {productChats.length > 0 && <div className="mq-chat-section-label">PRODUCT / SELLER CHATS</div>}
            {productChats.map(({ product, last }) => (
              <div className="mq-chat-person-row" key={product.id} onClick={() => go('dm', { pid: product.id })} style={{ cursor: 'pointer' }}>
                <span className="mq-chat-list-avatar product-avatar" style={{ background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></span>
                <div className="mq-chat-list-copy">
                  <b>{product.seller}</b>
                  <span>{product.name} · {(last.from === 'buyer' ? 'You: ' : 'Seller: ') + last.text}</span>
                </div>
                <span className="mq-chat-type product">Product</span>
              </div>
            ))}
          </React.Fragment>
        )}

        {tab === 'Requests' && (
          <React.Fragment>
            {!incoming.length && !outgoing.length && <div className="card" style={{ color: 'var(--sub)', fontSize: 13.5 }}>No pending friend requests.</div>}
            {incoming.length > 0 && <div className="menu-label" style={{ padding: '6px 0' }}>WANT TO BE YOUR FRIEND</div>}
            {incoming.map((person) => (
              <Person key={person.id} person={person}>
                <button type="button" className="mini green" onClick={() => { acceptRequest(me.id, person.id); showToast('You are now friends'); bump(); }}>Accept</button>
                <button type="button" className="mini ghost" onClick={() => { removeLink(me.id, person.id); bump(); }}>Decline</button>
              </Person>
            ))}
            {outgoing.length > 0 && <div className="menu-label" style={{ padding: '14px 0 6px' }}>REQUESTS YOU SENT</div>}
            {outgoing.map((person) => (
              <Person key={person.id} person={person} sub="Waiting for them to accept">
                <button type="button" className="mini ghost" onClick={() => { removeLink(me.id, person.id); bump(); }}>Cancel</button>
              </Person>
            ))}
          </React.Fragment>
        )}

        {tab === 'Find people' && (
          <React.Fragment>
            <div className="cm-input" style={{ marginBottom: 8 }}>
              <input value={query} placeholder="Search people or stores..." onChange={(event) => setQuery(event.target.value)} autoFocus />
            </div>
            {query.trim().length < 2 && <p style={{ color: 'var(--sub)', fontSize: 13 }}>Type at least 2 letters of their name.</p>}
            {query.trim().length >= 2 && !results.length && !storeResults.length && <p style={{ color: 'var(--sub)', fontSize: 13 }}>No people or stores found.</p>}
            {results.length > 0 && <div className="menu-label" style={{ padding: '10px 0 4px' }}>PEOPLE</div>}
            {results.map((person) => {
              const status = relation(me.id, person.id);
              return (
                <Person key={person.id} person={person}>
                  {status === 'none' && <button type="button" className="mini green" onClick={() => { sendFriendRequest(me.id, person.id); showToast('Friend request sent'); bump(); }}>+ Add friend</button>}
                  {status === 'sent' && <button type="button" className="mini ghost" onClick={() => { removeLink(me.id, person.id); bump(); }}>Requested ✓</button>}
                  {status === 'received' && <button type="button" className="mini green" onClick={() => { acceptRequest(me.id, person.id); showToast('You are now friends'); bump(); }}>Accept</button>}
                  {status === 'friends' && <button type="button" className="mini" onClick={() => openChat(person.id)}>Message</button>}
                </Person>
              );
            })}
            {storeResults.length > 0 && <div className="menu-label" style={{ padding: '14px 0 4px' }}>SELLER STORES</div>}
            {storeResults.map((store) => {
              const isFollowing = following.includes(store.seller);
              const productCount = PRODUCTS.filter((product) => product.seller === store.seller).length;
              return (
                <div className="person" key={store.seller}>
                  <span className="pa" style={{ background: 'var(--gold)', color: '#101214' }}>
                    {store.seller.split(' ').map((word) => word[0]).slice(0, 2).join('')}
                  </span>
                  <div className="pi" onClick={() => go('sellerprofile', { pid: store.id })} style={{ cursor: 'pointer' }}>
                    <b>{store.seller} <span className="badge">✓</span></b>
                    <span>{store.city} · {productCount} product{productCount === 1 ? '' : 's'} · View store ›</span>
                  </div>
                  <button type="button" className={'mini ' + (isFollowing ? 'ghost' : 'green')} onClick={() => onFollow && onFollow(store.seller)}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        )}

        {tab === 'Sellers' && (
          <React.Fragment>
            {!following.length && (
              <div className="card" style={{ color: 'var(--sub)', fontSize: 13.5 }}>
                You are not following any seller yet. Tap the <b>+</b> on a seller's picture in the feed to follow them.
              </div>
            )}
            {following.map((name) => {
              const product = PRODUCTS.find((item) => item.seller === name);
              if (!product) return null;
              return (
                <div className="person" key={name}>
                  <span className="pa" style={{ background: 'var(--gold)', color: '#101214' }}>{name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>
                  <div className="pi" onClick={() => go('sellerprofile', { pid: product.id })} style={{ cursor: 'pointer' }}>
                    <b>{name} <span className="badge">✓</span></b><span>View profile ›</span>
                  </div>
                  <button type="button" className="mini" onClick={() => go('dm', { pid: product.id })}>Message</button>
                  <button type="button" className="mini ghost" onClick={() => onFollow(name)}>Unfollow</button>
                </div>
              );
            })}
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
