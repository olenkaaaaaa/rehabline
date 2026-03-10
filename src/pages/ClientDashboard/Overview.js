import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Overview = () => {
  const { lang } = useLanguage();
  return (
    <div className="dashboard">
      <h2>{lang === 'UA' ? 'Огляд' : 'Overview'}</h2>
      <p>Тут буде список записів клієнта.</p>
    </div>
  );
};

export default Overview;