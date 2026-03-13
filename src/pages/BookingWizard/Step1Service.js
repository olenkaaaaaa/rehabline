import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { services, specialists } from '../../data/mockData';

const Step1Service = ({ bookingData, updateBookingData, nextStep }) => {
  const { lang } = useLanguage();
  const [selectedServiceId, setSelectedServiceId] = useState(bookingData.serviceId);

  // Якщо вказано specialist, фільтруємо тільки його послуги
  const availableServices = useMemo(() => {
    if (bookingData.specialistId) {
      const specialist = specialists.find(s => s.id === bookingData.specialistId);
      return services.filter(s => specialist?.serviceIds.includes(s.id));
    }
    return services;
  }, [bookingData.specialistId]);

  const handleSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
  };

  const handleNext = () => {
    if (selectedServiceId) {
      updateBookingData({ serviceId: selectedServiceId });
      nextStep();
    } else {
      alert(lang === 'UA' ? 'Оберіть послугу' : 'Please select a service');
    }
  };

  return (
    <div className="step step1">
      <h2>{lang === 'UA' ? 'Оберіть послугу' : 'Choose a service'}</h2>
      {!bookingData.specialistId && (
        <p className="tip">
          {lang === 'UA'
            ? 'Якщо не впевнені, оберіть консультацію реабілітолога - він підкаже оптимальну програму.'
            : 'If unsure, choose a rehabilitation consultation - they will recommend the best program.'}
        </p>
      )}
      <div className="services-list">
        {availableServices.map(service => (
          <div
            key={service.id}
            className={`service-card ${selectedServiceId === service.id ? 'selected' : ''}`}
            onClick={() => handleSelect(service.id)}
          >
            <h3>{service.name[lang]}</h3>
            <p className="service-duration">{service.duration} • від {service.price} грн</p>
            <p className="service-category">{service.category[lang]}</p>
            {service.tags && <span className="service-tag">{service.tags[lang]}</span>}
          </div>
        ))}
      </div>
      <div className="step-actions">
        <button className="btn-primary" onClick={handleNext}>
          {lang === 'UA' ? 'Далі: обрати час' : 'Next: choose time'}
        </button>
      </div>
    </div>
  );
};

export default Step1Service;