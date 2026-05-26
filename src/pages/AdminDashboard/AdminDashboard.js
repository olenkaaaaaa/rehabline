import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardShell from '../../components/DashboardShell';

const AdminDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    {
      path: '/admin',
      label: { UA: 'Дашборд', EN: 'Dashboard' },
      icon: '📊',
      end: true,
    },
    {
      path: '/admin/appointments',
      label: { UA: 'Записи', EN: 'Appointments' },
      icon: '🗓️',
    },
    {
      path: '/admin/schedule-requests',
      label: { UA: 'Запити графіку', EN: 'Schedule requests' },
      icon: '✅',
    },
    {
      path: '/admin/services',
      label: { UA: 'Послуги', EN: 'Services' },
      icon: '🧩',
    },
    {
      path: '/admin/specialists',
      label: { UA: 'Спеціалісти', EN: 'Specialists' },
      icon: '🩺',
    },
    {
      path: '/admin/users',
      label: { UA: 'Користувачі', EN: 'Users' },
      icon: '👥',
    },
    {
      path: '/admin/locations',
      label: { UA: 'Локації', EN: 'Locations' },
      icon: '📍',
    },
    {
      path: '/admin/settings',
      label: { UA: 'Налаштування', EN: 'Settings' },
      icon: '⚙️',
    },
  ];

  return (
    <DashboardShell
      role="admin"
      title={lang === 'UA' ? 'Панель адміністратора' : 'Admin dashboard'}
      subtitle={
        lang === 'UA'
          ? 'Керування записами, користувачами, послугами та заявками лікарів'
          : 'Manage appointments, users, services and doctor requests'
      }
      menuItems={menuItems}
    />
  );
};

export default AdminDashboard;