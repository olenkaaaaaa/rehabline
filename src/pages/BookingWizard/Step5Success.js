import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { services, locations } from '../../data/mockData';

const Step5Success = ({ bookingData }) => {
  const { lang } = useLanguage();
  const service = services.find(s => s.id === bookingData.serviceId);
  const location = bookingData.locationId ? locations.find(l => l.id === bookingData.locationId) : null;

  return (
    <div className="step step5 success">
      <h2>{lang === 'UA' ? 'Запис створено!' : 'Appointment created!'}</h2>
      <p>{lang === 'UA' ? 'Ми надіслали підтвердження' : 'We have sent a confirmation'}</p>

      <div className="success-details">
        <p><strong>{lang === 'UA' ? 'Візит' : 'Visit'}:</strong> {bookingData.date} • {bookingData.time}</p>
        <p><strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong> {service?.name[lang]}</p>
        <p><strong>{lang === 'UA' ? 'Локація' : 'Location'}:</strong> {location?.name[lang]}</p>
        <p><strong>{lang === 'UA' ? 'Нагадування' : 'Reminders'}:</strong> {lang === 'UA' ? 'за 24 год та за 2 год до початку' : '24h and 2h before'}</p>
        <p><strong>{lang === 'UA' ? 'Статус' : 'Status'}:</strong> {lang === 'UA' ? 'підтверджено' : 'confirmed'}</p>
      </div>

      <div className="success-actions">
        <Link to="/client/records" className="btn-primary">
          {lang === 'UA' ? 'До моїх записів' : 'My appointments'}
        </Link>
        <button className="btn-outline" onClick={() => window.open('/api/ics', '_blank')}>
          {lang === 'UA' ? 'Додати в календар' : 'Add to calendar'}
        </button>
        <Link to="/" className="btn-link">
          {lang === 'UA' ? 'На головну' : 'Home'}
        </Link>
      </div>
    </div>
  );
};

export default Step5Success;