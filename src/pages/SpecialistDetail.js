import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const weekDays = {
  UA: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getDayOfWeekForDb = (date) => {
  const jsDay = date.getDay();

  if (jsDay === 0) return 7;

  return jsDay;
};

const getSpecialistSpecialty = (specialist, lang) => {
  return lang === 'UA'
    ? specialist?.specialty_ua || ''
    : specialist?.specialty_en || specialist?.specialty_ua || '';
};

const getSpecialistDescription = (specialist, lang) => {
  return lang === 'UA'
    ? specialist?.description_ua || ''
    : specialist?.description_en || specialist?.description_ua || '';
};

const getSpecialistEducation = (specialist, lang) => {
  const value = lang === 'UA'
    ? specialist?.education_ua
    : specialist?.education_en || specialist?.education_ua;

  return Array.isArray(value) ? value : [];
};

const getSpecialistDirections = (specialist, lang) => {
  const value = lang === 'UA'
    ? specialist?.directions_ua
    : specialist?.directions_en || specialist?.directions_ua;

  return Array.isArray(value) ? value : [];
};

const getReviewText = (review) => {
  return review.text || review.comment || review.body || review.message || '';
};

const getReviewClientName = (review, lang) => {
  return (
    review.client_name ||
    review.clientName ||
    review.profiles?.full_name ||
    review.profiles?.name ||
    (lang === 'UA' ? 'Клієнт' : 'Client')
  );
};

const SpecialistDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [specialist, setSpecialist] = useState(null);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const photoRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSpecialist = async () => {
      try {
        setLoading(true);
        setPageError('');

        const specialistId = Number(id);

        const [
          specialistResponse,
          specialistServicesResponse,
          specialistLocationsResponse,
          reviewsResponse,
          schedulesResponse,
          appointmentsResponse,
        ] = await Promise.all([
          supabase
            .from('specialists')
            .select('*')
            .eq('id', specialistId)
            .single(),

          supabase
            .from('specialist_services')
            .select('service_id')
            .eq('specialist_id', specialistId),

          supabase
            .from('specialist_locations')
            .select('location_id')
            .eq('specialist_id', specialistId),

          supabase
            .from('reviews')
            .select('*')
            .eq('specialist_id', specialistId)
            .order('created_at', { ascending: false })
            .limit(6),

          supabase
            .from('specialist_schedules')
            .select('*')
            .eq('specialist_id', specialistId)
            .eq('is_working', true),

          supabase
            .from('appointments')
            .select('id, specialist_id, appointment_date, appointment_time, status')
            .eq('specialist_id', specialistId)
            .gte('appointment_date', toDateString(new Date()))
            .lte('appointment_date', toDateString(addDays(new Date(), 21)))
            .in('status', ['pending', 'confirmed']),
        ]);

        if (specialistResponse.error) throw specialistResponse.error;
        if (specialistServicesResponse.error) throw specialistServicesResponse.error;
        if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;
        if (reviewsResponse.error) throw reviewsResponse.error;
        if (schedulesResponse.error) throw schedulesResponse.error;
        if (appointmentsResponse.error) throw appointmentsResponse.error;

        const specialistData = specialistResponse.data;
        const specialistServiceRows = specialistServicesResponse.data || [];
        const specialistLocationRows = specialistLocationsResponse.data || [];

        const serviceIds = specialistServiceRows.map((row) => row.service_id);
        const locationIds = specialistLocationRows.map((row) => row.location_id);

        let servicesData = [];
        let locationsData = [];

        if (serviceIds.length > 0) {
          const servicesResponse = await supabase
            .from('services')
            .select('*')
            .in('id', serviceIds);

          if (servicesResponse.error) throw servicesResponse.error;

          servicesData = servicesResponse.data || [];
        }

        if (locationIds.length > 0) {
          const locationsResponse = await supabase
            .from('locations')
            .select('*')
            .in('id', locationIds);

          if (locationsResponse.error) throw locationsResponse.error;

          locationsData = locationsResponse.data || [];
        }

        const schedules = schedulesResponse.data || [];
        const appointments = appointmentsResponse.data || [];

        const busySlotKeys = new Set(
          appointments.map((appointment) => {
            return `${appointment.appointment_date}_${normalizeTime(appointment.appointment_time)}`;
          })
        );

        const generatedDays = [];

        for (let i = 0; i < 14; i += 1) {
          const currentDate = addDays(new Date(), i);
          const dateString = toDateString(currentDate);
          const dayOfWeek = getDayOfWeekForDb(currentDate);

          const daySchedules = schedules.filter(
            (schedule) => Number(schedule.day_of_week) === Number(dayOfWeek)
          );

          const slots = [];

          daySchedules.forEach((schedule) => {
            const startMinutes = timeToMinutes(schedule.start_time);
            const endMinutes = timeToMinutes(schedule.end_time);
            const durationMinutes = 45;
            const stepMinutes = 30;

            if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
              return;
            }

            for (
              let slotMinutes = startMinutes;
              slotMinutes + durationMinutes <= endMinutes;
              slotMinutes += stepMinutes
            ) {
              const time = minutesToTime(slotMinutes);
              const busyKey = `${dateString}_${time}`;

              if (!busySlotKeys.has(busyKey)) {
                slots.push(time);
              }
            }
          });

          generatedDays.push({
            date: dateString,
            dayNumber: currentDate.getDate(),
            monthLabel: currentDate.toLocaleDateString(
              lang === 'UA' ? 'uk-UA' : 'en-US',
              { month: 'long' }
            ),
            fullLabel: currentDate.toLocaleDateString(
              lang === 'UA' ? 'uk-UA' : 'en-US',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }
            ),
            weekdayIndex: dayOfWeek,
            slots,
          });
        }

        if (!isMounted) return;

        setSpecialist(specialistData);
        setServices(servicesData);
        setLocations(locationsData);
        setReviews(reviewsResponse.data || []);
        setCalendarDays(generatedDays);

        const firstAvailableDay = generatedDays.find((day) => day.slots.length > 0);
        setSelectedDate(firstAvailableDay?.date || generatedDays[0]?.date || '');
      } catch (error) {
        console.error('Specialist detail loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити дані спеціаліста з бази'
            : 'Failed to load specialist data from database'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSpecialist();

    return () => {
      isMounted = false;
    };
  }, [id, lang]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (photoRef.current && !photoRef.current.contains(e.target)) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isZoomed]);

  const selectedDay = useMemo(() => {
    return calendarDays.find((day) => day.date === selectedDate);
  }, [calendarDays, selectedDate]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;

    const total = reviews.reduce((acc, review) => {
      return acc + Number(review.rating || 0);
    }, 0);

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handlePhotoClick = () => {
    setIsZoomed((prev) => !prev);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleBookClick = () => {
    if (!specialist) return;

    const bookingUrl = selectedTime
      ? `/booking?specialist=${specialist.id}&date=${selectedDate}&time=${selectedTime}`
      : `/booking?specialist=${specialist.id}`;

    if (user) {
      navigate(bookingUrl);
    } else {
      navigate('/login', {
        state: {
          from: bookingUrl,
        },
      });
    }
  };

  const getLocationName = (location) => {
    return lang === 'UA'
      ? location.name_ua || location.name || ''
      : location.name_en || location.name || '';
  };

  const getServiceName = (service) => {
    return lang === 'UA'
      ? service.name_ua || service.name || ''
      : service.name_en || service.name || '';
  };

  if (loading) {
    return (
      <div className="container loading">
        {lang === 'UA' ? 'Завантаження...' : 'Loading...'}
      </div>
    );
  }

  if (pageError || !specialist) {
    return (
      <div className="container loading">
        <p>
          {pageError ||
            (lang === 'UA'
              ? 'Спеціаліста не знайдено'
              : 'Specialist not found')}
        </p>

        <Link to="/specialists" className="btn-primary">
          {lang === 'UA' ? 'До спеціалістів' : 'Back to specialists'}
        </Link>
      </div>
    );
  }

  const specialty = getSpecialistSpecialty(specialist, lang);
  const description = getSpecialistDescription(specialist, lang);
  const directions = getSpecialistDirections(specialist, lang);
  const education = getSpecialistEducation(specialist, lang);
  const certificates = Array.isArray(specialist.certificates)
    ? specialist.certificates
    : [];

  return (
    <div className="specialist-detail">
      <div className="container">
        <div className="specialist-header">
          <div className="specialist-photo-wrapper">
            <div
              className={`specialist-photo ${isZoomed ? 'zoomed' : ''}`}
              onClick={handlePhotoClick}
              ref={photoRef}
            >
              {specialist.photo_url ? (
                <img src={specialist.photo_url} alt={specialist.name} />
              ) : (
                <div className="photo-placeholder">
                  {specialist.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>

          <div className="specialist-info">
            <h1>{specialist.name}</h1>

            {specialty && (
              <p className="specialist-title">{specialty}</p>
            )}

            <p className="specialist-experience">
              {specialist.experience_years || 0}{' '}
              {lang === 'UA' ? 'років досвіду' : 'years experience'}
            </p>

            {avgRating && (
              <div className="specialist-rating">
                <span className="rating-stars">⭐</span>
                <span className="rating-value">{avgRating}</span>
                <span className="rating-count">
                  ({reviews.length} {lang === 'UA' ? 'відгуків' : 'reviews'})
                </span>
              </div>
            )}

            {locations.length > 0 && (
              <div className="specialist-locations">
                {locations.map((location) => (
                  <span key={location.id} className="tag">
                    {getLocationName(location)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleBookClick} className="btn-primary book-btn">
            {selectedTime
              ? lang === 'UA'
                ? `Записатися на ${selectedTime}`
                : `Book at ${selectedTime}`
              : lang === 'UA'
                ? 'Записатися'
                : 'Book'}
          </button>
        </div>

        <div className="specialist-grid">
          <div className="specialist-left">
            {description && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Про спеціаліста' : 'About'}</h2>
                <p>{description}</p>
              </section>
            )}

            {directions.length > 0 && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Напрямки' : 'Directions'}</h2>

                <div className="directions-tags">
                  {directions.map((direction, index) => (
                    <span key={index} className="tag">
                      {direction}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {services.length > 0 && (
              <section className="info-card">
                <h2>{lang === 'UA' ? 'Послуги спеціаліста' : 'Specialist services'}</h2>

                <div className="directions-tags">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      to={`/services/${service.id}`}
                      className="tag"
                    >
                      {getServiceName(service)}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(education.length > 0 || certificates.length > 0) && (
              <section className="info-card">
                <h2>
                  {lang === 'UA'
                    ? 'Освіта та сертифікати'
                    : 'Education & Certificates'}
                </h2>

                {education.length > 0 && (
                  <ul className="education-list">
                    {education.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}

                {certificates.length > 0 && (
                  <ul className="certificates-list">
                    {certificates.map((certificate, index) => (
                      <li key={index}>• {certificate}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="specialist-right">
            <section className="info-card calendar-card">
              <h2>{lang === 'UA' ? 'Вільний час' : 'Available slots'}</h2>

              <div className="calendar-weekdays">
                {weekDays[lang].map((day) => (
                  <div key={day} className="weekday">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <button
                    key={day.date}
                    className={`calendar-day ${
                      day.slots.length > 0 ? 'has-slots' : ''
                    } ${selectedDate === day.date ? 'selected' : ''}`}
                    onClick={() => handleDateClick(day.date)}
                    disabled={day.slots.length === 0}
                    title={day.fullLabel}
                  >
                    {day.dayNumber}
                  </button>
                ))}
              </div>

              <div className="slots-container">
                <h4>
                  {selectedDay
                    ? selectedDay.fullLabel
                    : lang === 'UA'
                      ? 'Оберіть дату'
                      : 'Choose a date'}
                </h4>

                <div className="slot-grid">
                  {selectedDay?.slots?.length > 0 ? (
                    selectedDay.slots.map((time) => (
                      <button
                        key={time}
                        className={`slot-btn ${
                          selectedTime === time ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <p className="no-slots">
                      {lang === 'UA'
                        ? 'Немає вільних слотів'
                        : 'No available slots'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="info-card reviews-card">
                <div className="reviews-header">
                  <h2>{lang === 'UA' ? 'Відгуки' : 'Reviews'}</h2>

                  <Link
                    to={`/specialists/${specialist.id}/reviews`}
                    className="view-all-link"
                  >
                    {lang === 'UA' ? 'Переглянути всі' : 'View all'}
                  </Link>
                </div>

                <div className="reviews-list">
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <strong>{getReviewClientName(review, lang)}</strong>

                        <span className="review-date">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString(
                                lang === 'UA' ? 'uk-UA' : 'en-US'
                              )
                            : ''}
                        </span>
                      </div>

                      <div className="review-rating">
                        {'⭐'.repeat(Number(review.rating || 0))}
                      </div>

                      <p className="review-text">{getReviewText(review)}</p>
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