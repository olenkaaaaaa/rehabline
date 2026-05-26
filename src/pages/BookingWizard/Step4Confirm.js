import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

import {
  getServiceName,
  getSpecialistName,
  getLocationName,
} from './BookingWizard';

const Step4Confirm = ({
  bookingData,
  selectedService,
  selectedSpecialist,
  selectedLocation,
  prevStep,
  onConfirm,
  submitting,
}) => {
  const { lang } = useLanguage();

  return (
    <div className="booking-card">
      <h2>{lang === 'UA' ? 'Підтвердження запису' : 'Confirm booking'}</h2>

      <p className="hint">
        {lang === 'UA'
          ? 'Перевірте дані перед створенням запису.'
          : 'Please check the details before creating the appointment.'}
      </p>

      <div className="booking-summary">
        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Послуга' : 'Service'}</span>
          <span className="summary-value">{getServiceName(selectedService, lang)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</span>
          <span className="summary-value">{getSpecialistName(selectedSpecialist)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Локація' : 'Location'}</span>
          <span className="summary-value">{getLocationName(selectedLocation, lang)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Дата' : 'Date'}</span>
          <span className="summary-value">{bookingData.date}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Час' : 'Time'}</span>
          <span className="summary-value">{bookingData.time}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Імʼя' : 'Name'}</span>
          <span className="summary-value">{bookingData.clientName}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">{lang === 'UA' ? 'Телефон' : 'Phone'}</span>
          <span className="summary-value">{bookingData.clientPhone}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Email</span>
          <span className="summary-value">{bookingData.clientEmail}</span>
        </div>

        {bookingData.clientNotes && (
          <div className="summary-row">
            <span className="summary-label">{lang === 'UA' ? 'Коментар' : 'Notes'}</span>
            <span className="summary-value">{bookingData.clientNotes}</span>
          </div>
        )}
      </div>

      <div className="booking-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={prevStep}
          disabled={submitting}
        >
          {lang === 'UA' ? 'Назад' : 'Back'}
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting
            ? lang === 'UA'
              ? 'Створюємо запис...'
              : 'Creating appointment...'
            : lang === 'UA'
              ? 'Підтвердити запис'
              : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
};

export default Step4Confirm;