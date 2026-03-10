import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { services, specialists, appointments } from '../data/mockData'; // імпортуємо

const Home = () => {
  const { lang } = useLanguage();

  // Отримуємо найближчі записи (наприклад, перші 3)
  const nearestSlots = appointments
    .filter(app => app.status === 'confirmed' || app.status === 'pending')
    .slice(0, 3)
    .map(app => {
      const service = services.find(s => s.id === app.serviceId);
      const specialist = specialists.find(s => s.id === app.specialistId);
      return {
        id: app.id,
        date: new Date(app.date).toLocaleDateString('uk-UA', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
        time: app.time,
        service: service?.name[lang] || '',
        specialist: specialist?.name || ''
      };
    });

  // Отримуємо популярні послуги (перші 3)
  const popularServices = services.slice(0, 3);

  return (
    <main>
      {/* Hero секція */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              {lang === 'UA'
                ? 'Онлайн-запис на медичні та реабілітаційні послуги'
                : 'Online booking for medical and rehabilitation services'}
            </h1>
            <p className="hero-subtitle">
              {lang === 'UA'
                ? 'Обирайте послугу, спеціаліста та зручний час. Підтвердження і нагадування – автоматично.'
                : 'Choose a service, specialist and convenient time. Confirmation and reminders – automatically.'}
            </p>
            <Link to="/services" className="cta-btn">
              {lang === 'UA' ? 'Записатись' : 'Book now'}
            </Link>
          </div>
        </div>
      </section>

      {/* Секція переваг */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">
            {lang === 'UA' ? 'Чому RehabLine' : 'Why RehabLine'}
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>{lang === 'UA' ? 'Розумний календар' : 'Smart calendar'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Показує тільки реальні вільні слоти з урахуванням тривалості та буферів.'
                  : 'Shows only real available slots considering duration and buffers.'}
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>{lang === 'UA' ? 'Без черг' : 'No queues'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Перенесення або скасування у 2 кліки, правила відміни – прозорі.'
                  : 'Reschedule or cancel in 2 clicks, clear cancellation rules.'}
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>{lang === 'UA' ? 'Кабінети для всіх ролей' : 'Dashboards for all roles'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Клієнт, спеціаліст, реєстратор та адміністратор мають свої панелі.'
                  : 'Client, specialist, registrar and admin each have their own dashboard.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Секція "Найближчі вікна" */}
      <section className="nearest-slots">
        <div className="container">
          <h2 className="section-title">
            {lang === 'UA' ? 'Найближчі вікна' : 'Nearest slots'}
          </h2>
          <div className="slots-grid">
            {nearestSlots.map((slot) => (
              <div key={slot.id} className="slot-card">
                <div className="slot-datetime">
                  <span className="slot-date">{slot.date}</span>
                  <span className="slot-time">{slot.time}</span>
                </div>
                <div className="slot-info">
                  <p className="slot-service">{slot.service}</p>
                  <p className="slot-specialist">{slot.specialist}</p>
                </div>
                <button className="btn-outline slot-select">
                  {lang === 'UA' ? 'Обрати' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Секція "Популярні послуги" */}
      <section className="popular-services">
        <div className="container">
          <h2 className="section-title">
            {lang === 'UA' ? 'Популярні послуги' : 'Popular services'}
          </h2>
          <div className="services-grid">
            {popularServices.map((service) => (
              <div key={service.id} className="service-card">
                <h3>{service.name[lang]}</h3>
                <p className="service-duration">
                  {service.duration} • від {service.price} грн
                </p>
                <p className="service-tags">{service.tags?.[lang] || service.category[lang]}</p>
                <Link to={`/services/${service.id}`} className="btn-outline">
                  {lang === 'UA' ? 'Деталі' : 'Details'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;