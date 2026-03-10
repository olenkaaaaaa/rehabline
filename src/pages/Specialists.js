import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { specialists } from '../data/mockData';

const Specialists = () => {
  const { lang } = useLanguage();
  return (
    <div className="container">
      <h1>{lang === 'UA' ? 'Спеціалісти' : 'Specialists'}</h1>
      <div className="specialists-grid">
        {specialists.map(spec => (
          <div key={spec.id} className="specialist-card">
            <h3>{spec.name}</h3>
            <p>{spec.specialty[lang]}</p>
            <Link to={`/specialists/${spec.id}`} className="btn-outline">
              {lang === 'UA' ? 'Профіль' : 'Profile'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Specialists;