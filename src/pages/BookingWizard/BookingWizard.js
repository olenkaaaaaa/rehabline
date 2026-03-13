import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { services, specialists, locations } from '../../data/mockData';

// Імпорт компонентів кроків
import Step1Service from './Step1Service';
import Step2DateTime from './Step2DateTime';
import Step3ClientData from './Step3ClientData';
import Step4Confirm from './Step4Confirm';
import Step5Success from './Step5Success';

const BookingWizard = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Стан для всіх даних бронювання
  const [bookingData, setBookingData] = useState({
    serviceId: searchParams.get('service') ? parseInt(searchParams.get('service')) : null,
    specialistId: searchParams.get('specialist') ? parseInt(searchParams.get('specialist')) : null,
    locationId: null,
    date: searchParams.get('date') || null,
    time: searchParams.get('time') || null,
    clientName: user?.name || '',
    clientPhone: user?.phone || '',
    clientEmail: user?.email || '',
    clientNotes: '',
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Якщо є specialistId, але немає locationId, підставляємо першу доступну локацію цього спеціаліста
  useEffect(() => {
    if (bookingData.specialistId && !bookingData.locationId) {
      const specialist = specialists.find(s => s.id === bookingData.specialistId);
      if (specialist?.locationIds?.length) {
        setBookingData(prev => ({ ...prev, locationId: specialist.locationIds[0] }));
      }
    }
  }, [bookingData.specialistId, bookingData.locationId]);

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const updateBookingData = (newData) => {
    setBookingData(prev => ({ ...prev, ...newData }));
  };

  const handleConfirm = async () => {
    // Тут буде виклик API для створення запису
    console.log('Creating appointment with data:', bookingData);
    // Імітація успіху
    nextStep(); // переходимо до Step5Success
  };

  // Рендер поточного кроку
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Service
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <Step2DateTime
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Step3ClientData
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <Step4Confirm
            bookingData={bookingData}
            onConfirm={handleConfirm}
            prevStep={prevStep}
          />
        );
      case 5:
        return <Step5Success bookingData={bookingData} />;
      default:
        return null;
    }
  };

  return (
    <div className="booking-wizard">
      <div className="container">
        {/* Індикатор кроків (не показуємо на останньому кроці) */}
        {currentStep < 5 && (
          <div className="wizard-header">
            <h1>{lang === 'UA' ? 'Запис на прийом' : 'Booking appointment'}</h1>
            <div className="wizard-steps">
              <span className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>1</span>
              <span className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>2</span>
              <span className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>3</span>
              <span className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>4</span>
            </div>
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
};

export default BookingWizard;