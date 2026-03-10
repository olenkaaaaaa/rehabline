import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { specialists, locations, calendarData } from '../data/mockData'; // Імпортуємо calendarData

// Дні тижня (не змінюються, можна залишити тут)
const weekDays = {
  UA: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};

const SpecialistDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [specialist, setSpecialist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('24'); // За замовчуванням 24 лютого
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const photoRef = useRef(null);

  // Завантаження даних спеціаліста
  useEffect(() => {
    const found = specialists.find(s => s.id === parseInt(id));
    setSpecialist(found);
  }, [id]);

  // Оновлення слотів при виборі дати
  useEffect(() => {
    const dayData = calendarData.days.find(d => d.day === parseInt(selectedDate));
    setAvailableSlots(dayData?.slots || []);
  }, [selectedDate]);

  // Закриття збільшеного фото при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (photoRef.current && !photoRef.current.contains(e.target)) {
        setIsZoomed(false);
      }
    };
    if (isZoomed) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isZoomed]);

  const handlePhotoClick = () => {
    setIsZoomed(!isZoomed);
  };

  if (!specialist) {
    return <div className="container loading">{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</div>;
  }

  const avgRating = specialist.reviews?.length
    ? (specialist.reviews.reduce((acc, r) => acc + r.rating, 0) / specialist.reviews.length).toFixed(1)
    : null;

    console.log('specialist', specialist);
console.log('specialist.specialty', specialist.specialty);
console.log('specialist.description', specialist.description);
console.log('specialist.directions', specialist.directions);
console.log('specialist.education', specialist.education);
console.log('specialist.certificates', specialist.certificates);
console.log('calendarData.month', calendarData.month);

  return (
    <div className="specialist-detail">
      <div className="container">
        {/* Верхній блок з фото, інфо та кнопкою */}
        <div className="specialist-header">
          <div className="specialist-photo-wrapper">
            <div 
              className={`specialist-photo ${isZoomed ? 'zoomed' : ''}`}
              onClick={handlePhotoClick}
              ref={photoRef}
            >
              {specialist.photo ? (
                <img src={specialist.photo} alt={specialist.name} />
              ) : (
                <div className="photo-placeholder">
                  {specialist.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="specialist-info">
            <h1>{specialist.name}</h1>
            <p className="specialist-title">{specialist.specialty[lang]}</p>
            <p className="specialist-experience">
              {specialist.experience} {lang === 'UA' ? 'років досвіду' : 'years experience'}
            </p>
            {avgRating && (
              <div className="specialist-rating">
                <span className="rating-stars">⭐</span>
                <span className="rating-value">{avgRating}</span>
                <span className="rating-count">
                  ({specialist.reviews.length} {lang === 'UA' ? 'відгуків' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          <Link to={`/booking?specialist=${specialist.id}`} className="btn-primary book-btn">
            {lang === 'UA' ? 'Записатися' : 'Book'}
          </Link>
        </div>

        {/* Основний двоколонковий макет */}
        <div className="specialist-grid">
          {/* Ліва колонка – опис, напрямки, освіта */}
          <div className="specialist-left">
            {specialist.description && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Про спеціаліста' : 'About'}</h2>
                <p>{specialist.description[lang]}</p>
              </section>
            )}

            {specialist.directions && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Напрямки' : 'Directions'}</h2>
                <div className="directions-tags">
                  {specialist.directions[lang].map((dir, idx) => (
                    <span key={idx} className="tag">{dir}</span>
                  ))}
                </div>
              </section>
            )}

            {(specialist.education || specialist.certificates) && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Освіта та сертифікати' : 'Education & Certificates'}</h2>
                {specialist.education && (
                  <ul className="education-list">
                    {specialist.education[lang].map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                {specialist.certificates && (
                  <ul className="certificates-list">
                    {specialist.certificates.map((cert, idx) => (
                      <li key={idx}>• {cert}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Права колонка – календар та відгуки */}
          <div className="specialist-right">
            <section className="info-card calendar-card">
              <h2>{lang === 'UA' ? 'Вільний час' : 'Available slots'}</h2>
              <h3>{calendarData.month[lang]}</h3>
              <div className="calendar-weekdays">
                {weekDays[lang].map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
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

              <div className="slots-container">
                <h4>
                  {selectedDate && (
                    <span>
                      {lang === 'UA' ? `Слоти на ${selectedDate} лютого` : `Slots for Feb ${selectedDate}`}
                    </span>
                  )}
                </h4>
                <div className="slot-grid">
                  {availableSlots.length > 0 ? (
                    availableSlots.map(time => (
                      <button key={time} className="slot-btn">{time}</button>
                    ))
                  ) : (
                    <p className="no-slots">
                      {lang === 'UA' ? 'Немає вільних слотів' : 'No available slots'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {specialist.reviews && specialist.reviews.length > 0 && (
              <section className="info-card reviews-card">
                <div className="reviews-header">
                  <h2>{lang === 'UA' ? 'Відгуки' : 'Reviews'}</h2>
                  <Link to={`/specialists/${specialist.id}/reviews`} className="view-all-link">
                    {lang === 'UA' ? 'Переглянути всі' : 'View all'}
                  </Link>
                </div>
                <div className="reviews-list">
                  {specialist.reviews.slice(0, 2).map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <strong>{review.clientName}</strong>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                      <p className="review-text">{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDetail;