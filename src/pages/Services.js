import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';

import { getAllPublicServices } from '../api/catalogApi';
import '../styles/pages/services.css';

const Services = () => {
  const { lang } = useLanguage();

  const [services, setServices] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState('');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('popular');

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);

        setPageError('');

        const servicesData =
          await getAllPublicServices(lang);

        if (!isMounted) return;

        setServices(servicesData || []);
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити послуги'
            : 'Failed to load services'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const categories = useMemo(() => {
    const unique = services
      .map((service) => service.category)
      .filter(Boolean);

    return [
      'all',
      ...Array.from(new Set(unique)),
    ];
  }, [services]);

  const filteredServices = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    const result = services.filter(
      (service) => {
        const matchesSearch =
          !normalizedSearch ||
          service.name
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          service.name_ua
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          service.name_en
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          service.category
            ?.toLowerCase()
            .includes(normalizedSearch);

        const matchesCategory =
          selectedCategory === 'all' ||
          service.category ===
            selectedCategory;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

    result.sort((a, b) => {
      if (sortBy === 'popular') {
        return (
          (b.visitCount || 0) -
          (a.visitCount || 0)
        );
      }

      if (sortBy === 'price_asc') {
        return (
          Number(a.price || 0) -
          Number(b.price || 0)
        );
      }

      if (sortBy === 'price_desc') {
        return (
          Number(b.price || 0) -
          Number(a.price || 0)
        );
      }

      if (sortBy === 'duration_asc') {
        return (
          Number(
            a.durationMinutes || 0
          ) -
          Number(
            b.durationMinutes || 0
          )
        );
      }

      if (sortBy === 'duration_desc') {
        return (
          Number(
            b.durationMinutes || 0
          ) -
          Number(
            a.durationMinutes || 0
          )
        );
      }

      return 0;
    });

    return result;
  }, [
    services,
    searchTerm,
    selectedCategory,
    sortBy,
  ]);

  return (
    <div className="services-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {lang === 'UA'
              ? 'Послуги'
              : 'Services'}
          </h1>

          <p className="page-subtitle">
            {lang === 'UA'
              ? 'Оберіть потрібну послугу та запишіться онлайн'
              : 'Choose a service and book online'}
          </p>
        </div>
      </div>

      <div className="services-toolbar card">
        <div className="toolbar-group">
          <label>
            {lang === 'UA'
              ? 'Пошук'
              : 'Search'}
          </label>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            placeholder={
              lang === 'UA'
                ? 'Масаж, ЛФК...'
                : 'Massage, therapy...'
            }
          />
        </div>

        <div className="toolbar-group">
          <label>
            {lang === 'UA'
              ? 'Категорія'
              : 'Category'}
          </label>

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
          >
            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === 'all'
                    ? lang === 'UA'
                      ? 'Всі'
                      : 'All'
                    : category}
                </option>
              )
            )}
          </select>
        </div>

        <div className="toolbar-group">
          <label>
            {lang === 'UA'
              ? 'Сортування'
              : 'Sort'}
          </label>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
          >
            <option value="popular">
              {lang === 'UA'
                ? 'Популярні'
                : 'Popular'}
            </option>

            <option value="price_asc">
              {lang === 'UA'
                ? 'Дешевші'
                : 'Price low'}
            </option>

            <option value="price_desc">
              {lang === 'UA'
                ? 'Дорожчі'
                : 'Price high'}
            </option>

            <option value="duration_asc">
              {lang === 'UA'
                ? 'Коротші'
                : 'Shortest'}
            </option>

            <option value="duration_desc">
              {lang === 'UA'
                ? 'Довші'
                : 'Longest'}
            </option>
          </select>
        </div>
      </div>

      {pageError && (
        <div className="card empty-state">
          <p>{pageError}</p>
        </div>
      )}

      {loading ? (
        <div className="card empty-state">
          <p>
            {lang === 'UA'
              ? 'Завантаження...'
              : 'Loading...'}
          </p>
        </div>
      ) : filteredServices.length > 0 ? (
        <>
          <div className="services-results">
            {lang === 'UA'
              ? `Знайдено: ${filteredServices.length}`
              : `Found: ${filteredServices.length}`}
          </div>

          <div className="services-grid">
            {filteredServices.map(
              (service) => (
                <article
                  key={service.id}
                  className="service-card card"
                >
                  <div className="service-top">
                    <h3>
                      {service.name}
                    </h3>

                    {!!service.visitCount && (
                      <span className="popular-badge">
                        {lang === 'UA'
                          ? `Записів ${service.visitCount}`
                          : `Bookings ${service.visitCount}`}
                      </span>
                    )}
                  </div>

                  <div className="service-meta">
                    <span>
                      ⏱{' '}
                      {service.duration}
                    </span>

                    <span>
                      💰{' '}
                      {service.priceLabel}
                    </span>
                  </div>

                  {!!service.category && (
                    <div className="service-tags">
                      <span className="tag">
                        {service.category}
                      </span>
                    </div>
                  )}

                  {!!service.description && (
                    <p className="service-description">
                      {service
                        .description
                        .length > 150
                        ? `${service.description.slice(
                            0,
                            150
                          )}...`
                        : service.description}
                    </p>
                  )}

                  <div className="service-bottom">
                    <div className="service-stats">
                      <span>
                        👨‍⚕️{' '}
                        {service
                          .specialists
                          ?.length || 0}
                      </span>

                      <span>
                        📍{' '}
                        {service
                          .locations
                          ?.length || 0}
                      </span>
                    </div>

                    <div className="service-actions">
                      <Link
                        to={`/services/${service.id}`}
                        className="btn btn-outline"
                      >
                        {lang === 'UA'
                          ? 'Деталі'
                          : 'Details'}
                      </Link>

                      <Link
                        to={`/booking?service=${service.id}`}
                        className="btn btn-primary"
                      >
                        {lang === 'UA'
                          ? 'Запис'
                          : 'Book'}
                      </Link>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <p>
            {lang === 'UA'
              ? 'Послуг не знайдено'
              : 'No services found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Services;