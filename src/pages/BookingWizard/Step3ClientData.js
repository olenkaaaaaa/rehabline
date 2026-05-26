import React, { useState } from 'react';

import { useLanguage } from '../../contexts/LanguageContext';

import {
  getServiceName,
  getLocationName,
} from './BookingWizard';

const Step3ClientData = ({
  bookingData,
  updateBookingData,
  selectedService,
  selectedLocation,
  nextStep,
  prevStep,
}) => {
  const { lang } = useLanguage();

  const [formData, setFormData] =
    useState({
      clientName:
        bookingData.clientName || '',

      clientEmail:
        bookingData.clientEmail || '',

      clientPhone:
        bookingData.clientPhone || '',

      clientNotes:
        bookingData.clientNotes || '',

      agree:
        bookingData.agree || false,
    });

  const [errors, setErrors] =
    useState({});

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (
      !formData.clientName.trim()
    ) {
      newErrors.clientName =
        lang === 'UA'
          ? "Введіть ім'я"
          : 'Name is required';
    }

    if (
      !formData.clientEmail.trim()
    ) {
      newErrors.clientEmail =
        lang === 'UA'
          ? 'Введіть email'
          : 'Email is required';
    } else if (
      !/\S+@\S+\.\S+/.test(
        formData.clientEmail
      )
    ) {
      newErrors.clientEmail =
        lang === 'UA'
          ? 'Некоректний email'
          : 'Invalid email';
    }

    if (
      !formData.clientPhone.trim()
    ) {
      newErrors.clientPhone =
        lang === 'UA'
          ? 'Введіть телефон'
          : 'Phone is required';
    }

    if (!formData.agree) {
      newErrors.agree =
        lang === 'UA'
          ? 'Необхідна згода'
          : 'You must agree';
    }

    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validate();

    if (
      Object.keys(newErrors).length >
      0
    ) {
      setErrors(newErrors);
      return;
    }

    updateBookingData(formData);

    nextStep();
  };

  return (
    <div className="booking-card">
      <h2>
        {lang === 'UA'
          ? 'Ваші дані'
          : 'Your details'}
      </h2>

      <div className="booking-summary">
        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA'
              ? 'Послуга'
              : 'Service'}
          </span>

          <span className="summary-value">
            {getServiceName(
              selectedService,
              lang
            )}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA'
              ? 'Дата та час'
              : 'Date & time'}
          </span>

          <span className="summary-value">
            {bookingData.date}{' '}
            {bookingData.time}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA'
              ? 'Локація'
              : 'Location'}
          </span>

          <span className="summary-value">
            {getLocationName(
              selectedLocation,
              lang
            )}
          </span>
        </div>
      </div>

      <p className="hint">
        {lang === 'UA'
          ? 'Нагадування про візит буде надіслано перед записом.'
          : 'Appointment reminders will be sent before your visit.'}
      </p>

      <div className="booking-grid">
        <div className="form-group">
          <label htmlFor="clientName">
            {lang === 'UA'
              ? 'ПІБ'
              : 'Full name'}
          </label>

          <input
            type="text"
            id="clientName"
            name="clientName"
            value={
              formData.clientName
            }
            onChange={handleChange}
            className={
              errors.clientName
                ? 'error'
                : ''
            }
          />

          {errors.clientName && (
            <span className="error-message">
              {
                errors.clientName
              }
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="clientPhone">
            {lang === 'UA'
              ? 'Телефон'
              : 'Phone'}
          </label>

          <input
            type="tel"
            id="clientPhone"
            name="clientPhone"
            placeholder="+380..."
            value={
              formData.clientPhone
            }
            onChange={handleChange}
            className={
              errors.clientPhone
                ? 'error'
                : ''
            }
          />

          {errors.clientPhone && (
            <span className="error-message">
              {
                errors.clientPhone
              }
            </span>
          )}
        </div>

        <div className="form-group booking-grid-full">
          <label htmlFor="clientEmail">
            Email
          </label>

          <input
            type="email"
            id="clientEmail"
            name="clientEmail"
            value={
              formData.clientEmail
            }
            onChange={handleChange}
            className={
              errors.clientEmail
                ? 'error'
                : ''
            }
          />

          {errors.clientEmail && (
            <span className="error-message">
              {
                errors.clientEmail
              }
            </span>
          )}
        </div>

        <div className="form-group booking-grid-full">
          <label htmlFor="clientNotes">
            {lang === 'UA'
              ? 'Коментар для спеціаліста'
              : 'Notes for specialist'}
          </label>

          <textarea
            id="clientNotes"
            name="clientNotes"
            rows="4"
            value={
              formData.clientNotes
            }
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="agree"
            checked={formData.agree}
            onChange={handleChange}
          />

          <span>
            {lang === 'UA'
              ? 'Погоджуюсь на обробку персональних даних'
              : 'I agree to personal data processing'}
          </span>
        </label>

        {errors.agree && (
          <span className="error-message">
            {errors.agree}
          </span>
        )}
      </div>

      <div className="booking-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={prevStep}
        >
          {lang === 'UA'
            ? 'Назад'
            : 'Back'}
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
        >
          {lang === 'UA'
            ? 'Далі: підтвердити'
            : 'Next: confirm'}
        </button>
      </div>
    </div>
  );
};

export default Step3ClientData;