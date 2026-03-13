import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { services, specialists, locations } from '../../data/mockData';

const Step4Confirm = ({ bookingData, onConfirm, prevStep }) => {
  const { lang } = useLanguage();

  const service = services.find(s => s.id === bookingData.serviceId);
  const specialist = bookingData.specialistId ? specialists.find(s => s.id === bookingData.specialistId) : null;
  const location = bookingData.locationId ? locations.find(l => l.id === bookingData.locationId) : null;

  return (
    <div className="step step4">
      <h2>{lang === 'UA' ? 'Підтвердження запису' : 'Confirm appointment'}</h2>
      <p className="subtitle">{lang === 'UA' ? 'Перевірте дані перед створенням' : 'Check the details before confirming'}</p>

      <div className="confirmation-details">
        <div className="detail-row">
          <span className="detail-label">{lang === 'UA' ? 'Послуга' : 'Service'}:</span>
          <span className="detail-value">{service?.name[lang]}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{lang === 'UA' ? 'Дата та час' : 'Date & time'}:</span>
          <span className="detail-value">{bookingData.date} • {bookingData.time}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{lang === 'UA' ? 'Локація' : 'Location'}:</span>
          <span className="detail-value">{location?.name[lang]}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}:</span>
          <span className="detail-value">{specialist ? specialist.name : (lang === 'UA' ? 'Будь-який доступний' : 'Any available')}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{lang === 'UA' ? 'Клієнт' : 'Client'}:</span>
          <span className="detail-value">{bookingData.clientName} • {bookingData.clientPhone} • {bookingData.clientEmail}</span>
        </div>
        {bookingData.clientNotes && (
          <div className="detail-row">
            <span className="detail-label">{lang === 'UA' ? 'Коментар' : 'Notes'}:</span>
            <span className="detail-value">{bookingData.clientNotes}</span>
          </div>
        )}
      </div>

      <p className="info">
        {lang === 'UA'
          ? 'Після створення запису ви отримаєте підтвердження та зможете додати подію в календар.'
          : 'After creating the appointment, you will receive a confirmation and can add it to your calendar.'}
      </p>

      <div className="step-actions">
        <button className="btn-outline" onClick={prevStep}>{lang === 'UA' ? 'Повернутися' : 'Back'}</button>
        <button className="btn-primary" onClick={onConfirm}>{lang === 'UA' ? 'Підтвердити запис' : 'Confirm appointment'}</button>
      </div>
    </div>
  );
};

export default Step4Confirm;