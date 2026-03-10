import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  services, 
  specialists, 
  locations, 
  calendarData,
  timeSlots 
} from '../data/mockData';

// Дні тижня для календаря
const weekDays = {
  UA: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};

const ServiceDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  
  const [service, setService] = useState(null);
  const [specialist, setSpecialist] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('24'); // за замовчуванням 24 лютого
  const [availableSlots, setAvailableSlots] = useState([]);

  // Завантаження даних при монтуванні
  useEffect(() => {
    const foundService = services.find(s => s.id === parseInt(id));
    if (foundService) {
      setService(foundService);
      
      // Якщо є спеціалісти, беремо першого (або "будь-який доступний")
      if (foundService.specialistIds && foundService.specialistIds.length > 0) {
        const firstSpecialist = specialists.find(s => s.id === foundService.specialistIds[0]);
        setSpecialist(firstSpecialist);
      }
      
      // Якщо є локації, беремо першу
      if (foundService.locationIds && foundService.locationIds.length > 0) {
        const firstLocation = locations.find(l => l.id === foundService.locationIds[0]);
        setLocation(firstLocation);
      }
    }
  }, [id]);

  // Оновлення слотів при виборі дати
  useEffect(() => {
    const dayData = calendarData.days.find(d => d.day === parseInt(selectedDate));
    setAvailableSlots(dayData?.slots || []);
  }, [selectedDate]);

  if (!service) {
    return <div className="container">{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</div>;
  }

  return (
    <div className="service-detail">
      <div className="container">
        {/* Заголовок та кнопка запису */}
        <div className="detail-header">
          <h1>{service.name[lang]}</h1>
          <Link to={`/booking?service=${service.id}`} className="btn-primary">
            {lang === 'UA' ? 'Записатися' : 'Book'}
          </Link>
        </div>

        {/* Основний контент: дві колонки */}
        <div className="detail-grid">
          {/* Ліва колонка - опис */}
          <div className="description">
            <section className="description-section">
              <h3>{lang === 'UA' ? 'Коротко' : 'Overview'}</h3>
              <p>{service.description[lang]}</p>
            </section>

            <section className="indications-section">
              <h3>{lang === 'UA' ? 'Показання' : 'Indications'}</h3>
              <ul>
                {service.indications[lang].map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="preparation-section">
              <h3>{lang === 'UA' ? 'Підготовка' : 'Preparation'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Візьміть попередні результати обстежень (за наявності). Одяг - зручний, що не обмежує рухи. При гострому болю повідомте спеціаліста.'
                  : 'Take previous examination results (if available). Wear comfortable clothing that does not restrict movement. If you have acute pain, inform the specialist.'}
              </p>
            </section>

            <section className="contraindications-section">
              <h3>{lang === 'UA' ? 'Протипоказання' : 'Contraindications'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Температура, гострі інфекції, загострення хронічних станів, відкриті рани у зоні впливу. Остаточне рішення - після консультації.'
                  : 'Fever, acute infections, exacerbation of chronic conditions, open wounds in the area of influence. Final decision - after consultation.'}
              </p>
            </section>

            {/* FAQ секція */}
            <section className="faq-section">
              <h3>{lang === 'UA' ? 'Питання та відповіді' : 'FAQ'}</h3>
              
              <div className="faq-item">
                <h4>{lang === 'UA' ? 'Скільки потрібно процедур?' : 'How many sessions are needed?'}</h4>
                <p>
                  {lang === 'UA'
                    ? 'Залежить від стану. Часто курс 6-10 процедур з оцінкою прогресу.'
                    : 'Depends on the condition. Often a course of 6-10 sessions with progress evaluation.'}
                </p>
              </div>

              <div className="faq-item">
                <h4>{lang === 'UA' ? 'Чи буде боляче?' : 'Will it hurt?'}</h4>
                <p>
                  {lang === 'UA'
                    ? 'Процедури підбираються так, щоб уникати сильного болю.'
                    : 'Procedures are selected to avoid severe pain.'}
                </p>
              </div>
            </section>
          </div>

          {/* Права колонка - бронювання */}
          <div className="booking-sidebar">
            {/* Інформація про спеціаліста */}
            <div className="specialist-info">
              <h4>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</h4>
              {specialist ? (
                <>
                  <p className="specialist-name">{specialist.name}</p>
                  <p className="specialist-specialty">{specialist.specialty[lang]}</p>
                </>
              ) : (
                <p>{lang === 'UA' ? 'Будь-який доступний' : 'Any available'}</p>
              )}
            </div>

            {/* Інформація про локацію */}
            {location && (
              <div className="location-info">
                <h4>{lang === 'UA' ? 'Локація' : 'Location'}</h4>
                <p>{location.name[lang]}</p>
                <p className="location-address">{location.address}</p>
              </div>
            )}

            {/* Календар */}
            <div className="calendar-section">
              <h4>{lang === 'UA' ? calendarData.month : 'February 2026'}</h4>
              
              {/* Дні тижня */}
              <div className="calendar-weekdays">
                {weekDays[lang].map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>

              {/* Дні місяця */}
              <div className="calendar-grid">
                {calendarData.days.map((dayData, index) => (
                  <button
                    key={index}
                    className={`calendar-day ${dayData.slots.length > 0 ? 'has-slots' : ''} ${
                      selectedDate === dayData.day.toString() ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedDate(dayData.day.toString())}
                    disabled={dayData.slots.length === 0}
                  >
                    {dayData.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Вільний час */}
            <div className="time-slots">
              <h4>
                {lang === 'UA' ? 'Вільний час' : 'Available slots'}
                {selectedDate && (
                  <span className="selected-date">
                    {lang === 'UA' ? ' (вт ' : ' (Tue '}
                    {selectedDate})
                  </span>
                )}
              </h4>
              
              {availableSlots.length > 0 ? (
                <div className="slot-grid">
                  {availableSlots.map(time => (
                    <button key={time} className="slot-btn">
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="no-slots">
                  {lang === 'UA' ? 'Немає вільних слотів' : 'No available slots'}
                </p>
              )}
            </div>

            {/* Кнопка продовжити */}
            <Link
              to={`/booking?service=${service.id}&specialist=${specialist?.id || ''}&date=2026-02-${selectedDate}`}
              className="btn-primary continue-btn"
            >
              {lang === 'UA' ? 'Продовжити' : 'Continue'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;