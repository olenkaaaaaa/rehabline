import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

import {
  getServiceName,
  getSpecialistName,
  getLocationName,
} from './BookingWizard';

const Step5Success = ({
  bookingData,
  appointment,
  selectedService,
  selectedSpecialist,
  selectedLocation,
}) => {
  const { lang } = useLanguage();

  return (
    <div className="booking-card success-card">
      <div className="success-icon">✓</div>

      <h1>
        {lang === 'UA'
          ? 'Запис успішно створено'
          : 'Appointment created successfully'}
      </h1>

      <p>
        {lang === 'UA'
          ? 'Ваш запис очікує підтвердження. Деталі запису нижче.'
          : 'Your appointment is waiting for confirmation. Details are below.'}
      </p>

      <div className="booking-summary">
        {appointment?.id && (
          <div className="summary-row">
            <span className="summary-label">
              {lang === 'UA' ? 'Номер запису' : 'Appointment ID'}
            </span>
            <span className="summary-value">#{appointment.id}</span>
          </div>
        )}

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA' ? 'Послуга' : 'Service'}
          </span>
          <span className="summary-value">{getServiceName(selectedService, lang)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA' ? 'Спеціаліст' : 'Specialist'}
          </span>
          <span className="summary-value">{getSpecialistName(selectedSpecialist)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA' ? 'Локація' : 'Location'}
          </span>
          <span className="summary-value">{getLocationName(selectedLocation, lang)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA' ? 'Дата' : 'Date'}
          </span>
          <span className="summary-value">{bookingData.date}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA' ? 'Час' : 'Time'}
          </span>
          <span className="summary-value">{bookingData.time}</span>
        </div>
      </div>

      <div className="booking-actions">
        <Link to="/profile" className="btn btn-outline">
          {lang === 'UA' ? 'Мої записи' : 'My appointments'}
        </Link>

        <Link to="/" className="btn btn-primary">
          {lang === 'UA' ? 'На головну' : 'Go home'}
        </Link>
      </div>
    </div>
  );
};

export default Step5Success;