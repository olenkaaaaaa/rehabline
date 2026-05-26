import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import DashboardShell from '../../components/DashboardShell';

const RegistrarDashboard = () => {
  const { lang } = useLanguage();

  const menuItems = [
    {
      path: '/registrar',
      label: { UA: 'Панель', EN: 'Panel' },
      icon: '📊',
      end: true,
    },
    {
      path: '/registrar/appointments',
      label: { UA: 'Записи', EN: 'Appointments' },
      icon: '📅',
    },
    {
      path: '/registrar/create',
      label: { UA: 'Створити запис', EN: 'Create appointment' },
      icon: '➕',
    },
    {
      path: '/registrar/schedule-requests',
      label: { UA: 'Запити графіку', EN: 'Schedule requests' },
      icon: '✅',
    },
    {
      path: '/registrar/waitlist',
      label: { UA: 'Лист очікування', EN: 'Waitlist' },
      icon: '⏳',
    },
    {
      path: '/registrar/clients',
      label: { UA: 'Клієнти', EN: 'Clients' },
      icon: '👥',
    },
    {
      path: '/registrar/communications',
      label: { UA: 'Комунікації', EN: 'Communications' },
      icon: '💬',
    },
  ];

  return (
    <DashboardShell
      role="registrar"
      title={lang === 'UA' ? 'Кабінет реєстратора' : 'Registrar panel'}
      subtitle={
        lang === 'UA'
          ? 'Операційна панель записів, клієнтів і комунікацій'
          : 'Operational panel for appointments, clients and communications'
      }
      menuItems={menuItems}
    />
  );
};

export default RegistrarDashboard;