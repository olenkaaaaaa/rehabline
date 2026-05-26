import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardShell from '../../components/DashboardShell';

const ClientDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    {
      path: '/client',
      label: { UA: 'Огляд', EN: 'Overview' },
      icon: '🏠',
      end: true,
    },
    {
      path: '/client/records',
      label: { UA: 'Мої записи', EN: 'My appointments' },
      icon: '📄',
    },
    {
      path: '/client/documents',
      label: { UA: 'Мої документи', EN: 'My documents' },
      icon: '📁',
    },
    {
      path: '/client/reviews',
      label: { UA: 'Мої відгуки', EN: 'My reviews' },
      icon: '⭐',
    },
    {
      path: '/client/recommendations',
      label: { UA: 'Рекомендації', EN: 'Recommendations' },
      icon: '💡',
    },
    {
      path: '/client/profile',
      label: { UA: 'Профіль', EN: 'Profile' },
      icon: '👤',
    },
    {
      path: '/client/settings',
      label: { UA: 'Налаштування', EN: 'Settings' },
      icon: '⚙️',
    },
    {
  label: lang === 'UA' ? 'Повідомлення' : 'Messages',
  path: '/client/messages',
  icon: '🔔',
},
  ];

  return (
    <DashboardShell
      role="client"
      title={lang === 'UA' ? 'Кабінет клієнта' : 'Client dashboard'}
      subtitle={
        lang === 'UA'
          ? 'Керуйте записами, документами та профілем'
          : 'Manage appointments, documents and profile'
      }
      menuItems={menuItems}
    />
  );
};

export default ClientDashboard;