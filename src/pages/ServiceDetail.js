import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabaseClient';
import { getAvailableSlots } from '../utils/availability';
import '../styles/pages/service-detail.css';

const getServiceName = (service, lang) =>
  lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';

const getServiceDescription = (service, lang) =>
  lang === 'UA'
    ? service?.description_ua || service?.description || ''
    : service?.description_en ||
      service?.description_ua ||
      service?.description ||
      '';

const getServiceCategory = (service, lang) =>
  lang === 'UA'
    ? service?.category_ua || service?.category || ''
    : service?.category_en || service?.category_ua || service?.category || '';

const getLocationName = (location, lang) =>
  lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';

const getLocationAddress = (location, lang) =>
  lang === 'UA'
    ? location?.address_ua || location?.address || ''
    : location?.address_en || location?.address_ua || location?.address || '';

const getLocationCity = (location, lang) =>
  lang === 'UA'
    ? location?.city_ua || location?.city || ''
    : location?.city_en || location?.city_ua || location?.city || '';

const getSpecialistSpecialty = (specialist, lang) =>
  lang === 'UA'
    ? specialist?.specialty_ua || specialist?.specialty || ''
    : specialist?.specialty_en ||
      specialist?.specialty_ua ||
      specialist?.specialty ||
      '';

const getSpecialistDescription = (specialist, lang) =>
  lang === 'UA'
    ? specialist?.description_ua || specialist?.description || ''
    : specialist?.description_en ||
      specialist?.description_ua ||
      specialist?.description ||
      '';

const getTodayISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeSlot = (slot) => {
  if (typeof slot === 'string') return slot.slice(0, 5);

  if (slot?.time) return String(slot.time).slice(0, 5);
  if (slot?.start_time) return String(slot.start_time).slice(0, 5);
  if (slot?.appointment_time) return String(slot.appointment_time).slice(0, 5);

  return '';
};

const ServiceDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [specialistServices, setSpecialistServices] = useState([]);
  const [specialistLocations, setSpecialistLocations] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);

  const [selectedSpecialistId, setSelectedSpecialistId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadServiceDetail = async () => {
      try {
        setLoading(true);
        setPageError('');

        const [
          serviceResponse,
          specialistsResponse,
          locationsResponse,
          specialistServicesResponse,
          specialistLocationsResponse,
          serviceLocationsResponse,
        ] = await Promise.all([
          supabase.from('services').select('*').eq('id', id).single(),
          supabase.from('specialists').select('*').order('name', { ascending: true }),
          supabase.from('locations').select('*').order('id', { ascending: true }),
          supabase.from('specialist_services').select('*'),
          supabase.from('specialist_locations').select('*'),
          supabase.from('service_locations').select('*'),
        ]);

        if (serviceResponse.error) throw serviceResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;
        if (specialistServicesResponse.error) throw specialistServicesResponse.error;
        if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;
        if (serviceLocationsResponse.error) throw serviceLocationsResponse.error;

        if (!isMounted) return;

        setService(serviceResponse.data || null);
        setSpecialists(specialistsResponse.data || []);
        setLocations(locationsResponse.data || []);
        setSpecialistServices(specialistServicesResponse.data || []);
        setSpecialistLocations(specialistLocationsResponse.data || []);
        setServiceLocations(serviceLocationsResponse.data || []);
      } catch (error) {
        console.error('Service detail loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити сторінку послуги'
            : 'Failed to load service page'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServiceDetail();

    return () => {
      isMounted = false;
    };
  }, [id, lang]);

  const serviceLocationIds = useMemo(() => {
    return serviceLocations
      .filter((row) => Number(row.service_id) === Number(id))
      .map((row) => Number(row.location_id));
  }, [serviceLocations, id]);

  const availableSpecialists = useMemo(() => {
    const allowedSpecialistIds = specialistServices
      .filter((row) => Number(row.service_id) === Number(id))
      .map((row) => Number(row.specialist_id));

    return specialists
      .filter((specialist) => allowedSpecialistIds.includes(Number(specialist.id)))
      .map((specialist) => {
        const specialistLocationIds = specialistLocations
          .filter((row) => Number(row.specialist_id) === Number(specialist.id))
          .map((row) => Number(row.location_id));

        const allowedLocationIds =
          serviceLocationIds.length > 0
            ? specialistLocationIds.filter((locationId) =>
                serviceLocationIds.includes(locationId)
              )
            : specialistLocationIds;

        const specialistAvailableLocations = locations.filter((location) =>
          allowedLocationIds.includes(Number(location.id))
        );

        return {
          ...specialist,
          availableLocations: specialistAvailableLocations,
        };
      })
      .filter((specialist) => specialist.availableLocations.length > 0);
  }, [
    specialists,
    specialistServices,
    specialistLocations,
    locations,
    serviceLocationIds,
    id,
  ]);

  const selectedSpecialist = useMemo(() => {
    return (
      availableSpecialists.find(
        (specialist) => Number(specialist.id) === Number(selectedSpecialistId)
      ) || null
    );
  }, [availableSpecialists, selectedSpecialistId]);

  const selectedLocation = useMemo(() => {
    return (
      locations.find((location) => Number(location.id) === Number(selectedLocationId)) ||
      null
    );
  }, [locations, selectedLocationId]);

  useEffect(() => {
    setSelectedLocationId('');
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
  }, [selectedSpecialistId]);

  useEffect(() => {
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
  }, [selectedLocationId]);

  useEffect(() => {
    let isMounted = true;

    const loadSlots = async () => {
      if (!selectedSpecialistId || !selectedLocationId || !selectedDate || !service?.id) {
        setAvailableSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        setSelectedTime('');

        const slots = await getAvailableSlots({
          specialistId: selectedSpecialistId,
          serviceId: service.id,
          locationId: selectedLocationId,
          date: selectedDate,
        });

        if (!isMounted) return;

        const normalizedSlots = (slots || [])
          .map(normalizeSlot)
          .filter(Boolean);

        setAvailableSlots(normalizedSlots);
      } catch (error) {
        console.error('Slots loading failed:', error);

        if (!isMounted) return;

        setAvailableSlots([]);
      } finally {
        if (isMounted) {
          setSlotsLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedSpecialistId, selectedLocationId, selectedDate, service?.id]);

  const handleBooking = () => {
    if (!service?.id || !selectedSpecialistId || !selectedLocationId || !selectedDate || !selectedTime) {
      return;
    }

    const query = new URLSearchParams({
      service: String(service.id),
      specialist: String(selectedSpecialistId),
      location: String(selectedLocationId),
      date: selectedDate,
      time: selectedTime,
    });

    navigate(`/booking?${query.toString()}`);
  };

  if (loading) {
    return (
      <main className="service-detail-page">
        <div className="container">
          <div className="empty-state">
            <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
          </div>
        </div>
      </main>
    );
  }

  if (pageError || !service) {
    return (
      <main className="service-detail-page">
        <div className="container">
          <div className="empty-state">
            <p>
              {pageError ||
                (lang === 'UA'
                  ? 'Послугу не знайдено'
                  : 'Service not found')}
            </p>
            <Link to="/services" className="btn btn-secondary">
              {lang === 'UA' ? 'До послуг' : 'Back to services'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="service-detail-page">
      <section className="service-detail-hero">
        <div className="container">
          <Link to="/services" className="back-link">
            {lang === 'UA' ? '← Назад до послуг' : '← Back to services'}
          </Link>

          <div className="service-detail-main-card">
            <div className="service-detail-info">
              {getServiceCategory(service, lang) && (
                <span className="service-detail-badge">
                  {getServiceCategory(service, lang)}
                </span>
              )}

              <h1>{getServiceName(service, lang)}</h1>

              {getServiceDescription(service, lang) && (
                <p>{getServiceDescription(service, lang)}</p>
              )}

              <div className="service-detail-meta">
                <span>
                  ⏱ {Number(service.duration_minutes || service.duration || 30)}{' '}
                  {lang === 'UA' ? 'хв' : 'min'}
                </span>

                <span>
                  💰 {lang === 'UA' ? 'від' : 'from'}{' '}
                  {Number(service.price || 0)} грн
                </span>
              </div>
            </div>

            <div className="service-booking-summary">
              <h2>{lang === 'UA' ? 'Швидкий запис' : 'Quick booking'}</h2>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</span>
                <strong>{selectedSpecialist?.name || '—'}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Локація' : 'Location'}</span>
                <strong>
                  {selectedLocation
                    ? getLocationName(selectedLocation, lang)
                    : '—'}
                </strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Дата' : 'Date'}</span>
                <strong>{selectedDate || '—'}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Час' : 'Time'}</span>
                <strong>{selectedTime || '—'}</strong>
              </div>

              {selectedTime ? (
                <button type="button" className="btn btn-primary" onClick={handleBooking}>
                  {lang === 'UA' ? 'Записатись' : 'Book appointment'}
                </button>
              ) : (
                <p className="summary-hint">
                  {lang === 'UA'
                    ? 'Оберіть спеціаліста, локацію, дату та час.'
                    : 'Select specialist, location, date and time.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="service-booking-section">
        <div className="container">
          <div className="booking-flow-grid">
            <div className="booking-flow-main">
              <div className="flow-step-card">
                <div className="flow-step-header">
                  <span>1</span>
                  <div>
                    <h2>
                      {lang === 'UA'
                        ? 'Оберіть спеціаліста'
                        : 'Choose specialist'}
                    </h2>
                    <p>
                      {lang === 'UA'
                        ? 'Показані тільки спеціалісти, які виконують цю послугу.'
                        : 'Only specialists who provide this service are shown.'}
                    </p>
                  </div>
                </div>

                {availableSpecialists.length > 0 ? (
                  <div className="service-specialists-grid">
                    {availableSpecialists.map((specialist) => (
                      <button
                        key={specialist.id}
                        type="button"
                        className={`service-specialist-card ${
                          Number(selectedSpecialistId) === Number(specialist.id)
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => setSelectedSpecialistId(String(specialist.id))}
                      >
                        <div className="specialist-mini-photo">
                          {specialist.photo_url ? (
                            <img src={specialist.photo_url} alt={specialist.name} />
                          ) : (
                            <span>
                              {String(specialist.name || '?')
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="specialist-mini-info">
                          <strong>{specialist.name}</strong>

                          {getSpecialistSpecialty(specialist, lang) && (
                            <span>{getSpecialistSpecialty(specialist, lang)}</span>
                          )}

                          {specialist.experience_years !== null &&
                            specialist.experience_years !== undefined && (
                              <small>
                                {lang === 'UA'
                                  ? `Досвід: ${specialist.experience_years} років`
                                  : `Experience: ${specialist.experience_years} years`}
                              </small>
                            )}

                          {getSpecialistDescription(specialist, lang) && (
                            <p>{getSpecialistDescription(specialist, lang)}</p>
                          )}

                          <div className="mini-location-tags">
                            {specialist.availableLocations.map((location) => (
                              <span key={location.id}>
                                {getLocationCity(location, lang)
                                  ? `${getLocationCity(location, lang)}, `
                                  : ''}
                                {getLocationName(location, lang)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>
                      {lang === 'UA'
                        ? 'Для цієї послуги поки немає доступних спеціалістів.'
                        : 'No specialists are available for this service yet.'}
                    </p>
                  </div>
                )}
              </div>

              {selectedSpecialist && (
                <div className="flow-step-card">
                  <div className="flow-step-header">
                    <span>2</span>
                    <div>
                      <h2>{lang === 'UA' ? 'Оберіть локацію' : 'Choose location'}</h2>
                      <p>
                        {lang === 'UA'
                          ? 'Спеціаліст приймає в цих локаціях.'
                          : 'This specialist works at these locations.'}
                      </p>
                    </div>
                  </div>

                  <div className="location-choice-grid">
                    {selectedSpecialist.availableLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        className={`location-choice-card ${
                          Number(selectedLocationId) === Number(location.id)
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => setSelectedLocationId(String(location.id))}
                      >
                        <strong>{getLocationName(location, lang)}</strong>

                        <span>
                          {[getLocationCity(location, lang), getLocationAddress(location, lang)]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSpecialist && selectedLocationId && (
                <div className="flow-step-card">
                  <div className="flow-step-header">
                    <span>3</span>
                    <div>
                      <h2>{lang === 'UA' ? 'Оберіть дату' : 'Choose date'}</h2>
                      <p>
                        {lang === 'UA'
                          ? 'Після вибору дати система покаже вільний час.'
                          : 'After selecting a date, available time slots will appear.'}
                      </p>
                    </div>
                  </div>

                  <div className="date-choice-row">
                    <input
                      type="date"
                      min={getTodayISO()}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  </div>
                </div>
              )}

              {selectedSpecialist && selectedLocationId && selectedDate && (
                <div className="flow-step-card">
                  <div className="flow-step-header">
                    <span>4</span>
                    <div>
                      <h2>{lang === 'UA' ? 'Оберіть час' : 'Choose time'}</h2>
                      <p>
                        {lang === 'UA'
                          ? 'Показані тільки реальні вільні слоти.'
                          : 'Only real available slots are shown.'}
                      </p>
                    </div>
                  </div>

                  {slotsLoading ? (
                    <div className="empty-state">
                      <p>
                        {lang === 'UA'
                          ? 'Завантаження слотів...'
                          : 'Loading slots...'}
                      </p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="slots-grid">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-button ${
                            selectedTime === slot ? 'active' : ''
                          }`}
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>
                        {lang === 'UA'
                          ? 'На цю дату немає доступних слотів.'
                          : 'No available slots for this date.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="booking-sticky-card">
              <h2>{lang === 'UA' ? 'Ваш вибір' : 'Your selection'}</h2>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Послуга' : 'Service'}</span>
                <strong>{getServiceName(service, lang)}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</span>
                <strong>{selectedSpecialist?.name || '—'}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Локація' : 'Location'}</span>
                <strong>
                  {selectedLocation
                    ? getLocationName(selectedLocation, lang)
                    : '—'}
                </strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Дата' : 'Date'}</span>
                <strong>{selectedDate || '—'}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Час' : 'Time'}</span>
                <strong>{selectedTime || '—'}</strong>
              </div>

              <div className="summary-row">
                <span>{lang === 'UA' ? 'Вартість' : 'Price'}</span>
                <strong>
                  {lang === 'UA' ? 'від' : 'from'} {Number(service.price || 0)} грн
                </strong>
              </div>

              {selectedTime ? (
                <button type="button" className="btn btn-primary" onClick={handleBooking}>
                  {lang === 'UA' ? 'Записатись' : 'Book appointment'}
                </button>
              ) : (
                <p className="summary-hint">
                  {lang === 'UA'
                    ? 'Запис стане доступним після вибору часу.'
                    : 'Booking becomes available after choosing a time.'}
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServiceDetail;