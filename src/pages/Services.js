import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  services as allServices, 
  locations,
  getServicePopularity 
} from '../data/mockData';

const Services = () => {
  const { lang } = useLanguage();

  // Стан для фільтрів
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'price-asc', 'price-desc', 'name'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Отримуємо дані популярності
  const popularityData = useMemo(() => getServicePopularity(), []);

  // Отримуємо унікальні значення для фільтрів
  const categories = [...new Set(allServices.map(s => s.category[lang]))];
  const durations = [...new Set(allServices.map(s => s.duration))];
  const locationOptions = locations.map(loc => loc.name[lang]);

  // Фільтрація та сортування послуг
  const processedServices = useMemo(() => {
    // Спочатку фільтруємо
    let filtered = allServices.filter(service => {
      const matchesSearch = service.name[lang].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? service.category[lang] === selectedCategory : true;
      const matchesDuration = selectedDuration ? service.duration === selectedDuration : true;
      const matchesLocation = selectedLocation ? service.locationIds?.some(id => {
        const loc = locations.find(l => l.id === id);
        return loc && loc.name[lang] === selectedLocation;
      }) : true;
      return matchesSearch && matchesCategory && matchesDuration && matchesLocation;
    });

    // Потім сортуємо
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => {
          const popA = popularityData[a.id]?.score || 0;
          const popB = popularityData[b.id]?.score || 0;
          return popB - popA; // від більшої до меншої
        });
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
        break;
      default:
        break;
    }

    return filtered;
  }, [allServices, searchTerm, selectedCategory, selectedDuration, selectedLocation, sortBy, lang, popularityData]);

  // Пагінація
  const totalPages = Math.ceil(processedServices.length / itemsPerPage);
  const paginatedServices = processedServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDuration('');
    setSelectedLocation('');
    setSortBy('popularity');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDuration, selectedLocation, sortBy]);

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
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">{lang === 'UA' ? 'Усі категорії' : 'All categories'}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(e.target.value)}
        >
          <option value="">{lang === 'UA' ? 'Будь-яка тривалість' : 'Any duration'}</option>
          {durations.map(dur => (
            <option key={dur} value={dur}>{dur}</option>
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
            {processedServices.length} {lang === 'UA' ? 'послуг знайдено' : 'services found'}
          </span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity">
              {lang === 'UA' ? 'За популярністю' : 'By popularity'}
            </option>
            <option value="price-asc">
              {lang === 'UA' ? 'Від дешевих до дорогих' : 'Price: Low to High'}
            </option>
            <option value="price-desc">
              {lang === 'UA' ? 'Від дорогих до дешевих' : 'Price: High to Low'}
            </option>
            <option value="name">
              {lang === 'UA' ? 'За назвою' : 'By name'}
            </option>
          </select>
        </div>

        <div className="cards-list">
          {paginatedServices.map(service => {
            const popularity = popularityData[service.id];
            return (
              <div key={service.id} className="service-card horizontal">
                <div className="card-info">
                  <h3>{service.name[lang]}</h3>
                  <p className="service-duration">
                    {service.duration} • від {service.price} грн
                  </p>
                  <p className="category">{service.category[lang]}</p>
                  {service.tags && (
                    <p className="service-tags">{service.tags[lang]}</p>
                  )}
                  {/* Показуємо популярність (для демо) */}
                  {popularity && (
                    <div className="popularity-info">
                      <small>
                        {lang === 'UA' 
                          ? `📊 ${popularity.appointments} записів • ⭐ ${popularity.avgRating}`
                          : `📊 ${popularity.appointments} bookings • ⭐ ${popularity.avgRating}`
                        }
                      </small>
                    </div>
                  )}
                </div>
                <Link to={`/services/${service.id}`} className="btn-outline">
                  {lang === 'UA' ? 'Деталі' : 'Details'}
                </Link>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span>
              {lang === 'UA'
                ? `Показано ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, processedServices.length)} з ${processedServices.length}`
                : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, processedServices.length)} of ${processedServices.length}`}
            </span>
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {lang === 'UA' ? 'Далі' : 'Next'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Services;