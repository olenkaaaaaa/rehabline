import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const Step3ClientData = ({ bookingData, updateBookingData, nextStep, prevStep }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clientName: bookingData.clientName || user?.name || '',
    clientEmail: bookingData.clientEmail || user?.email || '',
    clientPhone: bookingData.clientPhone || user?.phone || '',
    clientNotes: bookingData.clientNotes || '',
    agree: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = lang === 'UA' ? "Введіть ім'я" : 'Name is required';
    if (!formData.clientEmail.trim()) newErrors.clientEmail = lang === 'UA' ? 'Введіть email' : 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.clientEmail)) newErrors.clientEmail = lang === 'UA' ? 'Некоректний email' : 'Invalid email';
    if (!formData.clientPhone.trim()) newErrors.clientPhone = lang === 'UA' ? 'Введіть телефон' : 'Phone is required';
    if (!formData.agree) newErrors.agree = lang === 'UA' ? 'Необхідна згода' : 'You must agree';
    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    updateBookingData(formData);
    nextStep();
  };

  return (
    <div className="step step3">
      <div className="selected-summary">
        <h3>{lang === 'UA' ? 'Ваш вибір' : 'Your choice'}</h3>
        <p><strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong> {bookingData.serviceId}</p> {/* В реальному коді треба підставити назву */}
        <p><strong>{lang === 'UA' ? 'Дата/час' : 'Date/time'}:</strong> {bookingData.date} {bookingData.time}</p>
        <p><strong>{lang === 'UA' ? 'Локація' : 'Location'}:</strong> {bookingData.locationId}</p>
      </div>

      <h4>{lang === 'UA' ? 'Ваші дані' : 'Your details'}</h4>
      <p className="hint">{lang === 'UA' ? 'Нагадування надішлемо за 24 год та за 2 год до візиту.' : 'We will send reminders 24h and 2h before the visit.'}</p>

      <div className="form-group">
        <label htmlFor="clientName">{lang === 'UA' ? 'ПІБ' : 'Full name'}</label>
        <input
          type="text"
          id="clientName"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          className={errors.clientName ? 'error' : ''}
        />
        {errors.clientName && <span className="error-message">{errors.clientName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="clientEmail">Email</label>
        <input
          type="email"
          id="clientEmail"
          name="clientEmail"
          value={formData.clientEmail}
          onChange={handleChange}
          className={errors.clientEmail ? 'error' : ''}
        />
        {errors.clientEmail && <span className="error-message">{errors.clientEmail}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="clientPhone">{lang === 'UA' ? 'Телефон' : 'Phone'}</label>
        <input
          type="tel"
          id="clientPhone"
          name="clientPhone"
          value={formData.clientPhone}
          onChange={handleChange}
          placeholder="+380..."
          className={errors.clientPhone ? 'error' : ''}
        />
        {errors.clientPhone && <span className="error-message">{errors.clientPhone}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="clientNotes">{lang === 'UA' ? 'Коментар для спеціаліста (опційно)' : 'Notes for specialist (optional)'}</label>
        <textarea
          id="clientNotes"
          name="clientNotes"
          rows="3"
          value={formData.clientNotes}
          onChange={handleChange}
        />
      </div>

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="agree"
            checked={formData.agree}
            onChange={handleChange}
          />
          <span>{lang === 'UA' ? 'Погоджуюсь на обробку персональних даних' : 'I agree to the processing of personal data'}</span>
        </label>
        {errors.agree && <span className="error-message">{errors.agree}</span>}
      </div>

      <div className="step-actions">
        <button className="btn-outline" onClick={prevStep}>{lang === 'UA' ? 'Назад' : 'Back'}</button>
        <button className="btn-primary" onClick={handleNext}>{lang === 'UA' ? 'Далі: підтвердити' : 'Next: confirm'}</button>
      </div>
    </div>
  );
};

export default Step3ClientData;