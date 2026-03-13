import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const ClientDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    { path: '/client', label: { UA: 'Огляд', EN: 'Overview' } },
    { path: '/client/records', label: { UA: 'Мої записи', EN: 'My Records' } },
    { path: '/client/documents', label: { UA: 'Мої документи', EN: 'My Documents' } },
    { path: '/client/reviews', label: { UA: 'Мої відгуки', EN: 'My Reviews' } },
    { path: '/client/recommendations', label: { UA: 'Рекомендації', EN: 'Recommendations' } },
    { path: '/client/profile', label: { UA: 'Профіль', EN: 'Profile' } },
    { path: '/client/settings', label: { UA: 'Налаштування', EN: 'Settings' } },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/client'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.label[lang]}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientDashboard;