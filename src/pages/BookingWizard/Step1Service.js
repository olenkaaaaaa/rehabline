import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getServiceName } from './BookingWizard';

const Step1Service = ({
  bookingData,
  updateBookingData,
  availableServices,
  nextStep,
}) => {
  const { lang } = useLanguage();
  const [selectedServiceId, setSelectedServiceId] = useState(
    bookingData.serviceId
  );

  const services = useMemo(() => availableServices || [], [availableServices]);

  const handleNext = () => {
    if (!selectedServiceId) {
      alert(lang === 'UA' ? 'Оберіть послугу' : 'Please select a service');
      return;
    }

    updateBookingData({
      serviceId: selectedServiceId,
      time: null,
    });

    nextStep();
  };

  return (
    <div className="booking-card">
      <h2>{lang === 'UA' ? 'Оберіть послугу' : 'Choose a service'}</h2>

      {!bookingData.specialistId && (
        <p className="hint">
          {lang === 'UA'
            ? 'Якщо не впевнені, оберіть консультацію реабілітолога — спеціаліст підкаже оптимальну програму.'
            : 'If unsure, choose a rehabilitation consultation — the specialist will recommend the best program.'}
        </p>
      )}

      <div className="booking-selection-grid">
        {services.length > 0 ? (
          services.map((service) => (
            <button
              type="button"
              key={service.id}
              className={`selection-card ${
                selectedServiceId === service.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedServiceId(service.id)}
            >
              <h3>{getServiceName(service, lang)}</h3>

              <p>
                {service.duration_minutes} {lang === 'UA' ? 'хв' : 'min'} ·{' '}
                {lang === 'UA' ? 'від' : 'from'} {Number(service.price || 0)} грн
              </p>

              <div className="selection-meta">
                {(service.category_ua || service.category_en) && (
                  <span>
                    {lang === 'UA'
                      ? service.category_ua
                      : service.category_en || service.category_ua}
                  </span>
                )}

                {(service.tag_ua || service.tag_en) && (
                  <span>
                    {lang === 'UA'
                      ? service.tag_ua
                      : service.tag_en || service.tag_ua}
                  </span>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Доступних послуг не знайдено'
                : 'No available services found'}
            </p>
          </div>
        )}
      </div>

      <div className="booking-actions">
        <span />

        <button type="button" className="btn btn-primary" onClick={handleNext}>
          {lang === 'UA' ? 'Далі: обрати час' : 'Next: choose time'}
        </button>
      </div>
    </div>
  );
};

export default Step1Service;