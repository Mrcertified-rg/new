/**
 * components/layout/menuConfig.js
 * What each mode shows in the account menu. To add a page to a menu, add one
 * line here (label, screen name used by App.jsx, icon key).
 */

export const MENU_BY_MODE = {
  buyer: [
    { label: 'My profile', screen: 'buyerprofile', icon: 'user' },
    { label: 'My orders', screen: 'orders', icon: 'orders' },
  ],
  seller: [
    { label: 'Dashboard', screen: 'dash', icon: 'grid' },
    { label: 'Products', screen: 'sellerproducts', icon: 'box' },
    { label: 'Orders', screen: 'sellerorders', icon: 'orders' },
    { label: 'Customers', screen: 'customers', icon: 'user' },
    { label: 'Records', screen: 'records', icon: 'records' },
    { label: 'Marketing', screen: 'marketing', icon: 'megaphone' },
    { label: 'Inbox', screen: 'inbox', icon: 'inbox' },
    { label: 'Certified AI', screen: 'ai', icon: 'ai' },
    { label: 'Settings', screen: 'sellerprofilepage', icon: 'settings' },
  ],
  marketer: [
    { label: 'Promote products', screen: 'mfeed', icon: 'megaphone' },
    { label: 'My promotions', screen: 'mypromos', icon: 'records' },
  ],
};

/** The "Switch mode" list at the bottom of the menu. */
export const MODE_OPTIONS = [
  { id: 'buyer', label: 'Buyer', icon: 'bag' },
  { id: 'seller', label: 'Seller', icon: 'store' },
  { id: 'marketer', label: 'Marketer', icon: 'megaphone' },
];
