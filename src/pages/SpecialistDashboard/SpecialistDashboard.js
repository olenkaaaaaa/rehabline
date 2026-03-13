import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const SpecialistDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    { path: '/specialist', label: { UA: 'Мій розклад', EN: 'My Schedule' } },
    { path: '/specialist/appointments', label: { UA: 'Записи', EN: 'Appointments' } },
    { path: '/specialist/clients', label: { UA: 'Клієнти', EN: 'Clients' } },
    { path: '/specialist/schedule-settings', label: { UA: 'Налаштування графіка', EN: 'Schedule Settings' } },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/specialist'}
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

export default SpecialistDashboard;