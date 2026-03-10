import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { services, specialists, locations } from '../data/mockData';

const ServiceDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const service = services.find(s => s.id === parseInt(id));
  const specialist = specialists[0];
  const location = locations[0];

  if (!service) return <div>Service not found</div>;

  return (
    <div className="service-detail">
      <div className="container">
        <div className="detail-header">
          <h1>{service.name[lang]}</h1>
          <Link to={`/booking?service=${service.id}`} className="btn-primary">
            {lang === 'UA' ? 'Записатися' : 'Book'}
          </Link>
        </div>

        <div className="detail-grid">
          <div className="description">
            <h3>{lang === 'UA' ? 'Опис' : 'Description'}</h3>
            <p>{service.description[lang]}</p>
            <h4>{lang === 'UA' ? 'Показання' : 'Indications'}</h4>
            <ul>
              {service.indications[lang].map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>

          <div className="booking-sidebar">
            <div className="specialist-info">
              <h4>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</h4>
              <p>{specialist.name} · {specialist.specialty[lang]}</p>
            </div>
            <div className="location-info">
              <h4>{lang === 'UA' ? 'Локація' : 'Location'}</h4>
              <p>{location.name[lang]}, {location.address}</p>
            </div>
            <div className="time-slots">
              <h4>{lang === 'UA' ? 'Вільний час' : 'Available slots'}</h4>
              <div className="slot-grid">
                {['09:00', '10:30', '12:15', '16:30', '18:15'].map(t => (
                  <button key={t} className="slot-btn">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;