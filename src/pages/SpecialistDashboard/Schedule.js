import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Schedule = () => {
  const { lang } = useLanguage();
  return (
    <div className="dashboard">
      <h2>{lang === 'UA' ? 'Розклад' : 'Schedule'}</h2>
      <p>Тут буде календар спеціаліста.</p>
    </div>
  );
};

export default Schedule;