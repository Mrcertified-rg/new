import React, { useMemo, useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Customers({ orders = [], sellerName = 'Urban Kicks Kenya' }) {
  const [query, setQuery] = useState('');
  const customers = useMemo(() => {
    const records = new Map();
    orders.forEach((order) => {
      const product = PRODUCTS.find((item) => item.id === order.pid);
      if (product?.seller !== sellerName || !order.customer?.id) return;
      const customer = order.customer;
      const existing = records.get(customer.id) || {
        ...customer,
        orderCount: 0,
        totalSpent: 0,
        lastOrder: order.date,
      };
      existing.orderCount += 1;
      existing.totalSpent += product.price * order.qty;
      records.set(customer.id, existing);
    });
    return [...records.values()].filter((customer) => (
      `${customer.name} ${customer.email || ''} ${customer.phone || ''}`.toLowerCase().includes(query.toLowerCase())
    ));
  }, [orders, query, sellerName]);

  return (
    <React.Fragment>
      <div className="topbar seller-page-topbar">
        <div><span className="seller-eyebrow">RELATIONSHIPS</span><h1>Customers</h1></div>
        <span className="seller-certified">{customers.length} customers</span>
      </div>
      <div className="screen pad seller-page">
        <div className="seller-customer-summary">
          <span className="seller-customer-icon">♙</span>
          <div><b>Get to know your customers</b><p>Customer profiles are created from completed checkouts.</p></div>
        </div>
        {customers.length > 0 && (
          <label className="seller-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" aria-label="Search customers" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </label>
        )}
        {customers.length ? <div className="seller-customer-list">
          {customers.map((customer) => (
            <article className="seller-customer-card" key={customer.id}>
              <span className="seller-customer-avatar">{customer.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
              <div className="seller-customer-info">
                <b>{customer.name}</b>
                <span>{customer.email || customer.phone || 'Contact details not provided'}</span>
                <small>{customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'} · Last order {customer.lastOrder}</small>
              </div>
              <strong>{money(customer.totalSpent)}</strong>
            </article>
          ))}
        </div> : (
          <div className="seller-empty-state">
            <span>♙</span><h3>{query ? 'No matching customers' : 'Your customers will appear here'}</h3>
            <p>{query ? 'Try another name or contact detail.' : 'When a signed-in buyer orders one of your products, their order history will be available here.'}</p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
