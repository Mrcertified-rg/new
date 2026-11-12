// MC
const UNLOCKED_KEY = 'merqo.unlocked-workspace';
const PLACE_KEY = 'merqo.workspace-place';

function read(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function rememberUnlocked(role, user) {
  if (!user?.id || role !== 'seller') return;
  try {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify({ role, userId: user.id }));
  } catch {
    // The workspace remains unlocked for this visit if storage is unavailable.
  }
}

export function forgetUnlocked() {
  try {
    localStorage.removeItem(UNLOCKED_KEY);
  } catch {
    // Nothing else can be done when browser storage is unavailable.
  }
}

export function forgetPlace() {
  try {
    localStorage.removeItem(PLACE_KEY);
  } catch {
    // Nothing else can be done when browser storage is unavailable.
  }
}

export function rememberPlace(mode, screen, isSellerScreen, userId) {
  if (!userId || (mode !== 'buyer' && mode !== 'seller')) return;
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify({
      userId,
      workspace: mode,
      sellerScreen: isSellerScreen ? screen : null,
    }));
  } catch {
    // The current workspace remains available if storage is unavailable.
  }
}

export function recallPlace(userId) {
  if (!userId) return null;
  const saved = read(PLACE_KEY);
  return saved?.userId === userId ? saved : null;
}

export function recallUnlocked(user) {
  if (!user?.id) return null;
  const saved = read(UNLOCKED_KEY);
  const status = user.roles?.[saved?.role]?.status;
  if (
    saved?.userId === user.id
    && saved.role === 'seller'
    && user.roles?.seller
    && status !== 'rejected'
    && status !== 'suspended'
  ) {
    return saved.role;
  }
  forgetUnlocked();
  return null;
}
