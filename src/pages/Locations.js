import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { locations } from '../data/mockData';

const Locations = () => {
  const { lang } = useLanguage();
  return (
    <div className="container">
      <h1>{lang === 'UA' ? 'Локації' : 'Locations'}</h1>
      <div className="locations-grid">
        {locations.map(loc => (
          <div key={loc.id} className="location-card">
            <h3>{loc.name[lang]}</h3>
            <p>{loc.address}</p>
            <p>{loc.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Locations;