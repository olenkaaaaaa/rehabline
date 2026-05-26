import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import { getAvailableSlots, createAppointmentSafe } from '../../utils/availability';
import '../../styles/pages/registrar-create-appointment.css';

const getServiceName = (service, lang) =>
  lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';

const getLocationName = (location, lang) =>
  lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';

const getLocationCity = (location, lang) =>
  lang === 'UA'
    ? location?.city_ua || location?.city || ''
    : location?.city_en || location?.city_ua || location?.city || '';

const normalizeSlot = (slot) => {
  if (typeof slot === 'string') return slot.slice(0, 5);
  if (slot?.time) return String(slot.time).slice(0, 5);
  if (slot?.start_time) return String(slot.start_time).slice(0, 5);
  return '';
};

const CreateAppointment = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timesLoading, setTimesLoading] = useState(false);

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);

  const [specialistServices, setSpecialistServices] = useState([]);
  const [specialistLocations, setSpecialistLocations] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);

  const [availableTimes, setAvailableTimes] = useState([]);

  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    specialistId: '',
    locationId: '',
    date: '',
    time: '',
    status: 'confirmed',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          clientsRes,
          servicesRes,
          specialistsRes,
          locationsRes,
          specialistServicesRes,
          specialistLocationsRes,
          serviceLocationsRes,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .in('role', ['patient', 'client'])
            .order('full_name', { ascending: true }),

          supabase.from('services').select('*').order('id', { ascending: true }),
          supabase.from('specialists').select('*').order('id', { ascending: true }),
          supabase.from('locations').select('*').order('id', { ascending: true }),
          supabase.from('specialist_services').select('*'),
          supabase.from('specialist_locations').select('*'),
          supabase.from('service_locations').select('*'),
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (servicesRes.error) throw servicesRes.error;
        if (specialistsRes.error) throw specialistsRes.error;
        if (locationsRes.error) throw locationsRes.error;
        if (specialistServicesRes.error) throw specialistServicesRes.error;
        if (specialistLocationsRes.error) throw specialistLocationsRes.error;
        if (serviceLocationsRes.error) throw serviceLocationsRes.error;

        setClients(clientsRes.data || []);
        setServices(servicesRes.data || []);
        setSpecialists(specialistsRes.data || []);
        setLocations(locationsRes.data || []);
        setSpecialistServices(specialistServicesRes.data || []);
        setSpecialistLocations(specialistLocationsRes.data || []);
        setServiceLocations(serviceLocationsRes.data || []);
      } catch (error) {
        console.error('Create appointment data loading failed:', error);
        alert(lang === 'UA' ? 'Не вдалося завантажити дані' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lang]);

  const availableServices = useMemo(() => {
    if (!formData.specialistId) return services;

    const ids = specialistServices
      .filter((row) => Number(row.specialist_id) === Number(formData.specialistId))
      .map((row) => Number(row.service_id));

    return services.filter((service) => ids.includes(Number(service.id)));
  }, [services, specialistServices, formData.specialistId]);

  const availableSpecialists = useMemo(() => {
    if (!formData.serviceId) return specialists;

    const ids = specialistServices
      .filter((row) => Number(row.service_id) === Number(formData.serviceId))
      .map((row) => Number(row.specialist_id));

    return specialists.filter((specialist) => ids.includes(Number(specialist.id)));
  }, [specialists, specialistServices, formData.serviceId]);

  const availableLocations = useMemo(() => {
    if (!formData.serviceId && !formData.specialistId) return locations;

    const serviceLocationIds = formData.serviceId
      ? serviceLocations
          .filter((row) => Number(row.service_id) === Number(formData.serviceId))
          .map((row) => Number(row.location_id))
      : locations.map((location) => Number(location.id));

    const specialistLocationIds = formData.specialistId
      ? specialistLocations
          .filter((row) => Number(row.specialist_id) === Number(formData.specialistId))
          .map((row) => Number(row.location_id))
      : locations.map((location) => Number(location.id));

    const allowedIds = serviceLocationIds.filter((id) =>
      specialistLocationIds.includes(Number(id))
    );

    return locations.filter((location) => allowedIds.includes(Number(location.id)));
  }, [
    locations,
    serviceLocations,
    specialistLocations,
    formData.serviceId,
    formData.specialistId,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadTimes = async () => {
      if (
        !formData.date ||
        !formData.serviceId ||
        !formData.specialistId ||
        !formData.locationId
      ) {
        setAvailableTimes([]);
        return;
      }

      try {
        setTimesLoading(true);

        const slots = await getAvailableSlots({
          specialistId: formData.specialistId,
          serviceId: formData.serviceId,
          locationId: formData.locationId,
          date: formData.date,
        });

        const normalizedSlots = (slots || [])
          .map(normalizeSlot)
          .filter(Boolean);

        if (isMounted) setAvailableTimes(normalizedSlots);
      } catch (error) {
        console.error('Registrar slots loading failed:', error);
        if (isMounted) setAvailableTimes([]);
      } finally {
        if (isMounted) setTimesLoading(false);
      }
    };

    loadTimes();

    return () => {
      isMounted = false;
    };
  }, [
    formData.date,
    formData.serviceId,
    formData.specialistId,
    formData.locationId,
  ]);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'serviceId') {
        next.specialistId = '';
        next.locationId = '';
        next.date = '';
        next.time = '';
      }

      if (field === 'specialistId') {
        next.locationId = '';
        next.date = '';
        next.time = '';
      }

      if (field === 'locationId') {
        next.date = '';
        next.time = '';
      }

      if (field === 'date') {
        next.time = '';
      }

      return next;
    });
  };

  const selectedClient = clients.find((client) => client.id === formData.clientId);

  const selectedService = services.find(
    (service) => Number(service.id) === Number(formData.serviceId)
  );

  const selectedSpecialist = specialists.find(
    (specialist) => Number(specialist.id) === Number(formData.specialistId)
  );

  const selectedLocation = locations.find(
    (location) => Number(location.id) === Number(formData.locationId)
  );

  const hasAnySummary =
    selectedClient ||
    selectedService ||
    selectedSpecialist ||
    selectedLocation ||
    formData.date ||
    formData.time ||
    formData.status;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.clientId ||
      !formData.serviceId ||
      !formData.specialistId ||
      !formData.locationId ||
      !formData.date ||
      !formData.time
    ) {
      alert(
        lang === 'UA'
          ? 'Заповніть усі обовʼязкові поля'
          : 'Please fill in all required fields'
      );
      return;
    }

    try {
      setSaving(true);

      await createAppointmentSafe({
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        specialistId: formData.specialistId,
        locationId: formData.locationId,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        notes: formData.notes.trim() || null,
      });

      alert(lang === 'UA' ? 'Запис створено' : 'Appointment created');
      navigate('/registrar');
    } catch (error) {
      console.error('Create appointment failed:', error);

      const isSlotError =
        error?.message?.includes('SLOT_NOT_AVAILABLE') ||
        error?.details?.includes('SLOT_NOT_AVAILABLE');

      alert(
        isSlotError
          ? lang === 'UA'
            ? 'Цей час уже недоступний. Оберіть інший слот.'
            : 'This time is no longer available. Please choose another slot.'
          : lang === 'UA'
            ? `Не вдалося створити запис: ${error.message || 'Спробуйте ще раз'}`
            : `Failed to create appointment: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page registrar-page">
        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page registrar-page registrar-create-page">
      <div className="dashboard-header registrar-create-header">
        <div>
          <h1>{lang === 'UA' ? 'Створити запис' : 'Create appointment'}</h1>

          <p>
            {lang === 'UA'
              ? 'Запис пацієнта лише через доступні слоти'
              : 'Patient booking only through available slots'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/registrar')}
        >
          {lang === 'UA' ? 'Назад' : 'Back'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="registrar-create-form">
        <div className="registrar-create-layout">
          <section className="card registrar-form-card">
            <div className="section-heading">
              <div>
                <h2>{lang === 'UA' ? 'Дані запису' : 'Appointment details'}</h2>

                <p>
                  {lang === 'UA'
                    ? 'Оберіть пацієнта, послугу, лікаря, локацію та час'
                    : 'Select patient, service, doctor, location and time'}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Пацієнт' : 'Patient'}</label>

              <select
                value={formData.clientId}
                onChange={(event) => updateField('clientId', event.target.value)}
                required
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть пацієнта' : 'Select patient'}
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email || client.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Послуга' : 'Service'}</label>

              <select
                value={formData.serviceId}
                onChange={(event) => updateField('serviceId', event.target.value)}
                required
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть послугу' : 'Select service'}
                </option>

                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {getServiceName(service, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Лікар' : 'Doctor'}</label>

              <select
                value={formData.specialistId}
                onChange={(event) => updateField('specialistId', event.target.value)}
                required
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть лікаря' : 'Select doctor'}
                </option>

                {availableSpecialists.map((specialist) => (
                  <option key={specialist.id} value={specialist.id}>
                    {specialist.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Локація' : 'Location'}</label>

              <select
                value={formData.locationId}
                onChange={(event) => updateField('locationId', event.target.value)}
                disabled={!formData.specialistId}
                required
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть локацію' : 'Select location'}
                </option>

                {availableLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {[getLocationCity(location, lang), getLocationName(location, lang)]
                      .filter(Boolean)
                      .join(', ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{lang === 'UA' ? 'Дата' : 'Date'}</label>

                <input
                  type="date"
                  value={formData.date}
                  onChange={(event) => updateField('date', event.target.value)}
                  disabled={!formData.locationId}
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Час' : 'Time'}</label>

                <select
                  value={formData.time}
                  onChange={(event) => updateField('time', event.target.value)}
                  disabled={
                    !formData.date ||
                    !formData.serviceId ||
                    !formData.specialistId ||
                    !formData.locationId ||
                    timesLoading
                  }
                  required
                >
                  <option value="">
                    {timesLoading
                      ? lang === 'UA'
                        ? 'Завантаження...'
                        : 'Loading...'
                      : lang === 'UA'
                        ? 'Оберіть час'
                        : 'Select time'}
                  </option>

                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Статус' : 'Status'}</label>

              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                <option value="confirmed">
                  {lang === 'UA' ? 'Підтверджено' : 'Confirmed'}
                </option>

                <option value="pending">
                  {lang === 'UA' ? 'Очікує підтвердження' : 'Pending'}
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Нотатки' : 'Notes'}</label>

              <textarea
                rows={4}
                value={formData.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder={
                  lang === 'UA'
                    ? 'Додаткова інформація'
                    : 'Additional information'
                }
              />
            </div>

            <div className="registrar-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/registrar')}
              >
                {lang === 'UA' ? 'Скасувати' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || timesLoading}
              >
                {saving
                  ? lang === 'UA'
                    ? 'Створення...'
                    : 'Creating...'
                  : lang === 'UA'
                    ? 'Створити запис'
                    : 'Create appointment'}
              </button>
            </div>
          </section>

          <aside className="appointment-summary-card">
            <div className="section-heading">
              <div>
                <h2>{lang === 'UA' ? 'Підсумок запису' : 'Appointment summary'}</h2>

                <p>
                  {lang === 'UA'
                    ? 'Перевірте дані перед створенням'
                    : 'Review details before creating'}
                </p>
              </div>
            </div>

            {hasAnySummary ? (
              <div className="appointment-summary-list">
                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Пацієнт' : 'Patient'}</span>
                  <strong>
                    {selectedClient?.full_name || selectedClient?.email || '—'}
                  </strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Послуга' : 'Service'}</span>
                  <strong>
                    {selectedService ? getServiceName(selectedService, lang) : '—'}
                  </strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Лікар' : 'Doctor'}</span>
                  <strong>{selectedSpecialist?.name || '—'}</strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Локація' : 'Location'}</span>
                  <strong>
                    {selectedLocation
                      ? [
                          getLocationCity(selectedLocation, lang),
                          getLocationName(selectedLocation, lang),
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : '—'}
                  </strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Дата' : 'Date'}</span>
                  <strong>{formData.date || '—'}</strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Час' : 'Time'}</span>
                  <strong>{formData.time || '—'}</strong>
                </div>

                <div className="appointment-summary-item">
                  <span>{lang === 'UA' ? 'Статус' : 'Status'}</span>
                  <strong>
                    {formData.status === 'confirmed'
                      ? lang === 'UA'
                        ? 'Підтверджено'
                        : 'Confirmed'
                      : lang === 'UA'
                        ? 'Очікує підтвердження'
                        : 'Pending'}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="empty-state compact-empty-state">
                <p>
                  {lang === 'UA'
                    ? 'Підсумок зʼявиться після вибору даних'
                    : 'Summary will appear after selecting details'}
                </p>
              </div>
            )}

            {formData.date &&
              formData.serviceId &&
              formData.specialistId &&
              formData.locationId &&
              !timesLoading &&
              availableTimes.length === 0 && (
                <div className="empty-state compact-empty-state">
                  <p>
                    {lang === 'UA'
                      ? 'На цю дату немає доступного часу'
                      : 'No available time for this date'}
                  </p>
                </div>
              )}
          </aside>
        </div>
      </form>
    </div>
  );
};

export default CreateAppointment;