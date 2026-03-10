import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Panel = () => {
  const { lang } = useLanguage();
  return (
    <div className="dashboard">
      <h2>{lang === 'UA' ? 'Панель реєстратора' : 'Registrar panel'}</h2>
      <p>Тут буде управління записами.</p>
    </div>
  );
};

export default Panel;