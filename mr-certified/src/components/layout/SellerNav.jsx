import React from 'react';
import { HomeIcon, PackageIcon, ReceiptIcon, UserIcon, StoreIcon } from '../ui/Icons.jsx';

const TABS = [
  { screen: 'dash', label: 'Home', Icon: HomeIcon },
  { screen: 'sellerproducts', label: 'Products', Icon: PackageIcon },
  { screen: 'sellerorders', label: 'Orders', Icon: ReceiptIcon },
  { screen: 'customers', label: 'Customers', Icon: UserIcon },
  { screen: 'sellerprofilepage', label: 'Store', Icon: StoreIcon },
];

export default function SellerNav({ screen, go }) {
  return (
    <nav className="seller-nav" aria-label="Seller navigation">
      {TABS.map(({ screen: target, label, Icon }) => (
        <button
          type="button"
          key={target}
          className={screen === target ? 'on' : ''}
          aria-current={screen === target ? 'page' : undefined}
          onClick={() => go(target)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
