import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { services, specialists, locations, calendarData } from '../../data/mockData';

const weekDays = {
  UA: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};

const Step2DateTime = ({ bookingData, updateBookingData, nextStep, prevStep }) => {
  const { lang } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? parseInt(bookingData.date.split('-')[2]) : 24);
  const [selectedTime, setSelectedTime] = useState(bookingData.time);
  const [availableSlots, setAvailableSlots] = useState([]);

  const service = services.find(s => s.id === bookingData.serviceId);
  const specialist = bookingData.specialistId ? specialists.find(s => s.id === bookingData.specialistId) : null;
  const location = bookingData.locationId ? locations.find(l => l.id === bookingData.locationId) : locations[0];

  useEffect(() => {
    const dayData = calendarData.days.find(d => d.day === selectedDate);
    setAvailableSlots(dayData?.slots || []);
  }, [selectedDate]);

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (!selectedTime) {
      alert(lang === 'UA' ? 'Оберіть час' : 'Please select a time');
      return;
    }
    const dateStr = `2026-02-${selectedDate.toString().padStart(2, '0')}`;
    updateBookingData({
      date: dateStr,
      time: selectedTime,
      locationId: location.id,
    });
    nextStep();
  };

  return (
    <div className="step step2">
      <div className="selected-summary">
        <h3>{lang === 'UA' ? 'Ваш вибір' : 'Your choice'}</h3>
        <p><strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong> {service?.name[lang]}</p>
        {specialist && <p><strong>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}:</strong> {specialist.name}</p>}
        <p><strong>{lang === 'UA' ? 'Локація' : 'Location'}:</strong> {location?.name[lang]}</p>
      </div>

      <div className="calendar-section">
        <h4>{lang === 'UA' ? 'Календар доступності' : 'Availability calendar'}</h4>
        <div className="calendar-weekdays">
          {weekDays[lang].map(day => <div key={day} className="weekday">{day}</div>)}
        </div>
        <div className="calendar-grid">
          {calendarData.days.map((dayData, idx) => (
            <button
              key={idx}
              className={`calendar-day ${dayData.slots.length > 0 ? 'has-slots' : ''} ${selectedDate === dayData.day ? 'selected' : ''}`}
              onClick={() => handleDateSelect(dayData.day)}
              disabled={dayData.slots.length === 0}
            >
              {dayData.day}
            </button>
          ))}
        </div>
      </div>

      <div className="time-slots-section">
        <h4>{lang === 'UA' ? 'Вільний час' : 'Available slots'}</h4>
        <div className="slot-grid">
          {availableSlots.length > 0 ? (
            availableSlots.map(time => (
              <button
                key={time}
                className={`slot-btn ${selectedTime === time ? 'selected' : ''}`}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </button>
            ))
          ) : (
            <p className="no-slots">{lang === 'UA' ? 'Немає вільних слотів' : 'No available slots'}</p>
          )}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-outline" onClick={prevStep}>{lang === 'UA' ? 'Назад' : 'Back'}</button>
        <button className="btn-primary" onClick={handleNext}>{lang === 'UA' ? 'Далі: дані' : 'Next: details'}</button>
      </div>
    </div>
  );
};

export default Step2DateTime;