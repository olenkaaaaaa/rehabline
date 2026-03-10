import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Dashboard = () => {
  const { lang } = useLanguage();
  return (
    <div className="dashboard">
      <h2>{lang === 'UA' ? 'Адмін-панель' : 'Admin dashboard'}</h2>
      <p>Тут буде статистика та управління.</p>
    </div>
  );
};

export default Dashboard;