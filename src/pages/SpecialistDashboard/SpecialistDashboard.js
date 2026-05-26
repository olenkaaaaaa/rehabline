import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardShell from '../../components/DashboardShell';

const SpecialistDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    {
      path: '/specialist',
      label: { UA: 'Огляд', EN: 'Overview' },
      icon: '📊',
      end: true,
    },
    {
      path: '/specialist/appointments',
      label: { UA: 'Записи', EN: 'Appointments' },
      icon: '📅',
    },
    {
      path: '/specialist/clients',
      label: { UA: 'Клієнти', EN: 'Clients' },
      icon: '👥',
    },
    {
      path: '/specialist/schedule-settings',
      label: { UA: 'Графік роботи', EN: 'Schedule settings' },
      icon: '🕘',
    },
    {
      path: '/specialist/profile',
      label: { UA: 'Мій профіль', EN: 'My profile' },
      icon: '👤',
    },
  ];

  return (
    <DashboardShell
      role="specialist"
      title={lang === 'UA' ? 'Кабінет спеціаліста' : 'Specialist panel'}
      subtitle={
        lang === 'UA'
          ? 'Робоча панель лікаря, записи, клієнти та графік'
          : 'Doctor workspace for appointments, clients and schedule'
      }
      menuItems={menuItems}
    />
  );
};

export default SpecialistDashboard;