/**
 * social/socialService.js
 * Demo friend and chat store using localStorage. It works between accounts in
 * the same browser; a backend can replace these exports for real-time chat.
 */
import { getPerson } from '../auth/authService.js';

const KEYS = { links: 'mrc.demo.friendlinks', chats: 'mrc.demo.chats', reads: 'mrc.demo.chatreads', follows: 'mrc.demo.sellerfollows' };

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
};

export const pairKey = (a, b) => [a, b].sort().join('|');
export const fullName = (person) => (person ? person.firstName + ' ' + person.lastName : 'Unknown');
export const personInitials = (person) => (person ? (person.firstName[0] + (person.lastName[0] || '')).toUpperCase() : '?');

// MC - local friend requests and relationships
const links = () => read(KEYS.links, []);
const findLink = (a, b) => links().find((link) => link.key === pairKey(a, b));
const otherOf = (link, me) => (link.from === me ? link.to : link.from);

export function relation(me, other) {
  const link = findLink(me, other);
  if (!link) return 'none';
  if (link.status === 'accepted') return 'friends';
  return link.from === me ? 'sent' : 'received';
}

export function acceptRequest(me, other) {
  const allLinks = links();
  const link = allLinks.find((item) => item.key === pairKey(me, other));
  if (link && link.status === 'pending' && link.to === me) {
    link.status = 'accepted';
    link.at = Date.now();
    write(KEYS.links, allLinks);
  }
  return relation(me, other);
}

export function sendFriendRequest(me, other) {
  if (me === other) return 'none';
  const link = findLink(me, other);
  if (link) return link.status === 'pending' && link.to === me ? acceptRequest(me, other) : relation(me, other);
  write(KEYS.links, [...links(), { key: pairKey(me, other), from: me, to: other, status: 'pending', at: Date.now() }]);
  return 'sent';
}

export function removeLink(me, other) {
  write(KEYS.links, links().filter((link) => link.key !== pairKey(me, other)));
}

export const listIncoming = (me) => links().filter((link) => link.status === 'pending' && link.to === me).map((link) => getPerson(link.from)).filter(Boolean);
export const listOutgoing = (me) => links().filter((link) => link.status === 'pending' && link.from === me).map((link) => getPerson(link.to)).filter(Boolean);
export const countIncoming = (me) => listIncoming(me).length;

// MC - local friend chat messages and read receipts
const chats = () => read(KEYS.chats, {});

export const getMessages = (me, other) => chats()[pairKey(me, other)] || [];

export function sendMessage(me, other, { text = '', productId = null } = {}) {
  if (relation(me, other) !== 'friends') return null;
  const content = text.trim();
  if (!content && !productId) return null;
  const allChats = chats();
  const key = pairKey(me, other);
  const message = { id: Date.now() + '-' + Math.random().toString(16).slice(2, 6), from: me, text: content.slice(0, 1000), productId, time: Date.now() };
  allChats[key] = [...(allChats[key] || []), message].slice(-300);
  write(KEYS.chats, allChats);
  markRead(me, other);
  return message;
}

export function markRead(me, other) {
  const reads = read(KEYS.reads, {});
  reads[me] = { ...(reads[me] || {}), [pairKey(me, other)]: Date.now() };
  write(KEYS.reads, reads);
}

export function unreadFrom(me, other) {
  const lastRead = (read(KEYS.reads, {})[me] || {})[pairKey(me, other)] || 0;
  return getMessages(me, other).filter((message) => message.from !== me && message.time > lastRead).length;
}

export function listChats(me) {
  return links()
    .filter((link) => link.status === 'accepted' && (link.from === me || link.to === me))
    .map((link) => {
      const id = otherOf(link, me);
      const messages = getMessages(me, id);
      return { person: getPerson(id), last: messages[messages.length - 1] || null, unread: unreadFrom(me, id), since: link.at };
    })
    .filter((chat) => chat.person)
    .sort((a, b) => ((b.last && b.last.time) || b.since) - ((a.last && a.last.time) || a.since));
}

export const unreadTotal = (me) => listChats(me).reduce((sum, chat) => sum + chat.unread, 0);

// MC - keep seller follows connected to each buyer account across sessions
export function listFollowedSellers(me) {
  const all = read(KEYS.follows, {});
  return Array.isArray(all[me]) ? all[me] : [];
}

export function toggleFollowedSeller(me, seller) {
  if (!me || !seller) throw new Error('A buyer and seller are required to update follows.');
  const all = read(KEYS.follows, {});
  const current = Array.isArray(all[me]) ? all[me] : [];
  const next = current.includes(seller) ? current.filter((name) => name !== seller) : [...current, seller];
  all[me] = next;
  write(KEYS.follows, all);
  return next;
}
