import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { services } from '../data/mockData';

const Services = () => {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');

  const filtered = services.filter(s => 
    s.name[lang].toLowerCase().includes(filter.toLowerCase()) &&
    (category ? s.category[lang] === category : true)
  );

  return (
    <div className="page-layout">
      <aside className="filters-sidebar">
        <h3>{lang === 'UA' ? 'Фільтри' : 'Filters'}</h3>
        <input
          type="text"
          placeholder={lang === 'UA' ? 'Пошук...' : 'Search...'}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{lang === 'UA' ? 'Усі категорії' : 'All categories'}</option>
          <option value="Реабілітація">Реабілітація</option>
          <option value="Діагностика">Діагностика</option>
          <option value="Масаж">Масаж</option>
        </select>
        <button onClick={() => { setFilter(''); setCategory(''); }}>
          {lang === 'UA' ? 'Скинути' : 'Reset'}
        </button>
      </aside>

      <section className="content">
        <div className="results-header">
          <span>{filtered.length} {lang === 'UA' ? 'послуг знайдено' : 'services found'}</span>
        </div>
        <div className="cards-list">
          {filtered.map(service => (
            <div key={service.id} className="service-card">
              <h3>{service.name[lang]}</h3>
              <p>{service.duration} • від {service.price} грн</p>
              <p className="category">{service.category[lang]}</p>
              <Link to={`/services/${service.id}`} className="btn-outline">
                {lang === 'UA' ? 'Деталі' : 'Details'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Services;