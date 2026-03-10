import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { specialists as allSpecialists, locations } from '../data/mockData';

const Specialists = () => {
  const { lang } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Унікальні спеціальності (залежать тільки від мови)
  const specialties = useMemo(() => {
    const specs = allSpecialists.map(s => s.specialty[lang]);
    return [...new Set(specs)];
  }, [lang]);

  // Локації для фільтра (залежать тільки від мови)
  const locationOptions = useMemo(() => {
    return locations.map(loc => loc.name[lang]);
  }, [lang]);

  // Фільтрація спеціалістів
  const filteredSpecialists = useMemo(() => {
    return allSpecialists.filter(specialist => {
      const matchesSearch = specialist.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? specialist.specialty[lang] === selectedSpecialty : true;
      const matchesLocation = selectedLocation ? specialist.locationIds?.some(id => {
        const loc = locations.find(l => l.id === id);
        return loc && loc.name[lang] === selectedLocation;
      }) : true;
      return matchesSearch && matchesSpecialty && matchesLocation;
    });
  }, [searchTerm, selectedSpecialty, selectedLocation, lang]); // allSpecialists прибрано

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedLocation('');
  };

  return (
    <div className="page-layout">
      {/* Бічна панель фільтрів */}
      <aside className="filters-sidebar">
        <h3>{lang === 'UA' ? 'Фільтри' : 'Filters'}</h3>

        <input
          type="text"
          placeholder={lang === 'UA' ? 'Пошук...' : 'Search...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="">{lang === 'UA' ? 'Усі спеціальності' : 'All specialties'}</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">{lang === 'UA' ? 'Усі локації' : 'All locations'}</option>
          {locationOptions.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <button onClick={resetFilters}>
          {lang === 'UA' ? 'Скинути' : 'Reset'}
        </button>
      </aside>

      {/* Основний контент */}
      <section className="content">
        <div className="results-header">
          <span>
            {filteredSpecialists.length} {lang === 'UA' ? 'спеціалістів' : 'specialists'}
          </span>
        </div>

        <div className="cards-list">
          {filteredSpecialists.map(specialist => (
            <div key={specialist.id} className="specialist-card horizontal">
              {/* Аватар */}
              <div className="specialist-avatar">
                {specialist.photo ? (
                  <img src={specialist.photo} alt={specialist.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {specialist.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="card-info">
                <h3>{specialist.name}</h3>
                <p className="specialist-specialty">
                  {specialist.specialty[lang]} • {specialist.experience} {lang === 'UA' ? 'років досвіду' : 'years experience'}
                </p>
                {specialist.directions && (
                  <p className="specialist-directions">
                    {lang === 'UA' ? 'Напрями: ' : 'Directions: '}
                    {specialist.directions[lang].join(', ')}
                  </p>
                )}
              </div>

              <Link to={`/specialists/${specialist.id}`} className="btn-outline">
                {lang === 'UA' ? 'Профіль' : 'Profile'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Specialists;