import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getHomeData } from '../api/catalogApi';
import '../styles/pages/home.css';

const Home = () => {
  const { lang } = useLanguage();

  const [popularServices, setPopularServices] = useState([]);
  const [nearestSlots, setNearestSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        setPageError('');

        const data = await getHomeData(lang);

        if (!isMounted) return;

        setPopularServices(data.popularServices || []);
        setNearestSlots(data.nearestSlots || []);
      } catch (error) {
        console.error('Home data loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити дані'
            : 'Failed to load data'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="container">
          <div className="hero-card">
            <div className="hero-content">
              <span className="hero-badge">
                RehabLine
              </span>

              <h1 className="hero-title">
                {lang === 'UA'
                  ? 'Онлайн-запис на медичні та реабілітаційні послуги'
                  : 'Online booking for medical and rehabilitation services'}
              </h1>

              <p className="hero-subtitle">
                {lang === 'UA'
                  ? 'Обирайте послугу, спеціаліста та зручний час. Підтвердження і нагадування — автоматично.'
                  : 'Choose a service, specialist and convenient time. Confirmation and reminders — automatically.'}
              </p>

              <div className="hero-actions">
                <Link
                  to="/services"
                  className="btn btn-primary"
                >
                  {lang === 'UA'
                    ? 'Записатись'
                    : 'Book now'}
                </Link>

                <Link
                  to="/specialists"
                  className="btn btn-secondary"
                >
                  {lang === 'UA'
                    ? 'Спеціалісти'
                    : 'Specialists'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="page-header">
            <h2>
              {lang === 'UA'
                ? 'Чому RehabLine'
                : 'Why RehabLine'}
            </h2>

            <p>
              {lang === 'UA'
                ? 'Система створена для зручного онлайн-запису'
                : 'The system is built for convenient online booking'}
            </p>
          </div>

          <div className="dashboard-grid dashboard-grid-3">
            <div className="card feature-card">
              <div className="feature-icon">
                📅
              </div>

              <h3>
                {lang === 'UA'
                  ? 'Розумний календар'
                  : 'Smart calendar'}
              </h3>

              <p>
                {lang === 'UA'
                  ? 'Показує тільки реальні доступні слоти.'
                  : 'Shows only real available slots.'}
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                ⚡
              </div>

              <h3>
                {lang === 'UA'
                  ? 'Без черг'
                  : 'No queues'}
              </h3>

              <p>
                {lang === 'UA'
                  ? 'Швидкий запис до потрібного спеціаліста.'
                  : 'Fast booking with the needed specialist.'}
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                👥
              </div>

              <h3>
                {lang === 'UA'
                  ? 'Панелі для всіх ролей'
                  : 'Dashboards for all roles'}
              </h3>

              <p>
                {lang === 'UA'
                  ? 'Клієнт, спеціаліст, реєстратор та адміністратор.'
                  : 'Client, specialist, registrar and administrator.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {pageError && (
        <section className="page-section">
          <div className="container">
            <div className="empty-state">
              <p>{pageError}</p>
            </div>
          </div>
        </section>
      )}

      <section className="page-section">
        <div className="container">
          <div className="page-header">
            <h2>
              {lang === 'UA'
                ? 'Найближчі вікна'
                : 'Nearest slots'}
            </h2>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Завантаження...'
                  : 'Loading...'}
              </p>
            </div>
          ) : nearestSlots.length > 0 ? (
            <div className="dashboard-grid dashboard-grid-3">
              {nearestSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="card slot-card"
                >
                  <div className="slot-top">
                    <span className="badge badge-primary">
                      {slot.dateLabel}
                    </span>

                    <strong>
                      {slot.time}
                    </strong>
                  </div>

                  <h3>
                    {slot.service}
                  </h3>

                  <p className="muted-text">
                    {slot.specialist}
                  </p>

                  {slot.location && (
                    <p className="muted-text">
                      {slot.location}
                    </p>
                  )}

                  <Link
                    to={`/booking?service=${slot.serviceId}&specialist=${slot.specialistId}&location=${slot.locationId}&date=${slot.date}&time=${slot.time}`}
                    className="btn btn-primary"
                  >
                    {lang === 'UA'
                      ? 'Обрати'
                      : 'Select'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Поки немає доступних слотів'
                  : 'No available slots yet'}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="page-header">
            <h2>
              {lang === 'UA'
                ? 'Популярні послуги'
                : 'Popular services'}
            </h2>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Завантаження...'
                  : 'Loading...'}
              </p>
            </div>
          ) : popularServices.length > 0 ? (
            <div className="dashboard-grid dashboard-grid-3">
              {popularServices.map((service) => (
                <div
                  key={service.id}
                  className="card service-card"
                >
                  <div className="service-card-top">
                    <span className="badge badge-success">
                      {service.category}
                    </span>
                  </div>

                  <h3>
                    {service.name}
                  </h3>

                  <p className="muted-text">
                    {service.duration}
                  </p>

                  <p className="service-price">
                    {service.priceLabel}
                  </p>

                  <Link
                    to={`/services/${service.id}`}
                    className="btn btn-secondary"
                  >
                    {lang === 'UA'
                      ? 'Деталі'
                      : 'Details'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Послуги ще не додані'
                  : 'Services have not been added yet'}
              </p>
            </div>
          )}

          <div className="section-actions">
            <Link
              to="/services"
              className="btn btn-primary"
            >
              {lang === 'UA'
                ? 'Переглянути всі послуги'
                : 'View all services'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;