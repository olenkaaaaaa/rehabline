import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Home = () => {
  const { lang } = useLanguage();

  return (
    <main>
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

      <section className="features">
        <div className="container">
          <h2 className="section-title">
            {lang === 'UA' ? 'Чому RehabLine' : 'Why RehabLine'}
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>{lang === 'UA' ? 'Швидкий запис' : 'Quick booking'}</h3>
              <p>{lang === 'UA' ? 'Без черг, перенесення у 2 кліки.' : 'No queues, reschedule in 2 clicks.'}</p>
            </div>
            <div className="feature-card">
              <h3>{lang === 'UA' ? 'Розумний календар' : 'Smart calendar'}</h3>
              <p>{lang === 'UA' ? 'Показує тільки реальні вільні слоти.' : 'Shows only real available slots.'}</p>
            </div>
            <div className="feature-card">
              <h3>{lang === 'UA' ? 'Двомовність' : 'Bilingual'}</h3>
              <p>{lang === 'UA' ? 'Інтерфейс українською та англійською.' : 'Interface in Ukrainian and English.'}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;