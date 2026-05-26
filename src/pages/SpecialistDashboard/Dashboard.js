import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/specialist-overview.css';

const statusLabels = {
  pending: { UA: 'Очікує', EN: 'Pending' },
  confirmed: { UA: 'Підтверджено', EN: 'Confirmed' },
  completed: { UA: 'Завершено', EN: 'Completed' },
  cancelled: { UA: 'Скасовано', EN: 'Cancelled' },
};

const getTodayISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const timeToMinutes = (time) => {
  const normalized = normalizeTime(time);
  if (!normalized || !normalized.includes(':')) return 0;

  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const formatDateUA = (dateString) => {
  if (!dateString) return '';

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getServiceName = (service, lang) => {
  if (!service) return '';

  return lang === 'UA'
    ? service.name_ua || service.name || ''
    : service.name_en || service.name_ua || service.name || '';
};

const getLocationName = (location, lang) => {
  if (!location) return '';

  return lang === 'UA'
    ? location.name_ua || location.name || ''
    : location.name_en || location.name_ua || location.name || '';
};

const SpecialistDashboardOverview = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [specialist, setSpecialist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setLoadError('');

      const { data: specialistData, error: specialistError } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (specialistError) throw specialistError;

      setSpecialist(specialistData);

      const [
        appointmentsResponse,
        clientsResponse,
        servicesResponse,
        locationsResponse,
        schedulesResponse,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('specialist_id', specialistData.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true }),

        supabase.from('profiles').select('*'),

        supabase.from('services').select('*'),

        supabase.from('locations').select('*'),

        supabase
          .from('specialist_schedules')
          .select('*')
          .eq('specialist_id', specialistData.id)
          .order('day_of_week', { ascending: true }),
      ]);

      if (appointmentsResponse.error) throw appointmentsResponse.error;

      if (clientsResponse.error) {
        console.warn('Clients loading failed:', clientsResponse.error);
      }

      if (servicesResponse.error) {
        console.warn('Services loading failed:', servicesResponse.error);
      }

      if (locationsResponse.error) {
        console.warn('Locations loading failed:', locationsResponse.error);
      }

      if (schedulesResponse.error) {
        console.warn('Schedules loading failed:', schedulesResponse.error);
      }

      setAppointments(appointmentsResponse.data || []);
      setClients(clientsResponse.data || []);
      setServices(servicesResponse.data || []);
      setLocations(locationsResponse.data || []);
      setSchedules(schedulesResponse.data || []);
    } catch (error) {
      console.error('Specialist dashboard loading failed:', error);

      setLoadError(
        error?.message ||
          (lang === 'UA'
            ? 'Не вдалося завантажити дані кабінету спеціаліста'
            : 'Failed to load specialist dashboard data')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const client = clients.find((item) => item.id === appointment.client_id);
      const service = services.find((item) => item.id === appointment.service_id);
      const location = locations.find((item) => item.id === appointment.location_id);

      const duration =
        Number(service?.duration_minutes) ||
        Number(service?.duration) ||
        Number(appointment.duration_minutes) ||
        30;

      return {
        ...appointment,
        clientName: client?.full_name || client?.name || 'Клієнт',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
        serviceName: getServiceName(service, lang) || 'Послуга',
        locationName: getLocationName(location, lang) || 'Локація',
        time: normalizeTime(appointment.appointment_time || appointment.time),
        date: appointment.appointment_date || appointment.date,
        duration,
      };
    });
  }, [appointments, clients, services, locations, lang]);

  const todayAppointments = useMemo(() => {
    return enrichedAppointments.filter(
      (appointment) =>
        appointment.date === getTodayISO() &&
        appointment.status !== 'cancelled'
    );
  }, [enrichedAppointments]);

  const selectedDateAppointments = useMemo(() => {
    return enrichedAppointments.filter(
      (appointment) =>
        appointment.date === selectedDate &&
        appointment.status !== 'cancelled'
    );
  }, [enrichedAppointments, selectedDate]);

  const upcomingAppointments = useMemo(() => {
    const today = getTodayISO();

    return enrichedAppointments
      .filter(
        (appointment) =>
          appointment.date >= today &&
          appointment.status !== 'cancelled' &&
          appointment.status !== 'completed'
      )
      .slice(0, 6);
  }, [enrichedAppointments]);

  const completedCount = useMemo(() => {
    return enrichedAppointments.filter(
      (appointment) => appointment.status === 'completed'
    ).length;
  }, [enrichedAppointments]);

  const pendingCount = useMemo(() => {
    return enrichedAppointments.filter(
      (appointment) => appointment.status === 'pending'
    ).length;
  }, [enrichedAppointments]);

  const uniqueClientsCount = useMemo(() => {
    const ids = new Set(
      enrichedAppointments
        .filter((appointment) => appointment.client_id)
        .map((appointment) => appointment.client_id)
    );

    return ids.size;
  }, [enrichedAppointments]);

  const selectedDaySchedule = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const jsDay = date.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    return schedules.find(
      (schedule) => Number(schedule.day_of_week) === dayOfWeek
    );
  }, [selectedDate, schedules]);

  const calendarConfig = useMemo(() => {
    if (!selectedDaySchedule || selectedDaySchedule.is_working === false) {
      return {
        startMinutes: 9 * 60,
        endMinutes: 17 * 60,
        slots: [],
      };
    }

    const startTime = normalizeTime(selectedDaySchedule.start_time) || '09:00';
    const endTime = normalizeTime(selectedDaySchedule.end_time) || '17:00';

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    const slots = [];

    for (let current = startMinutes; current < endMinutes; current += 30) {
      slots.push({
        time: minutesToTime(current),
        minutes: current,
      });
    }

    return {
      startMinutes,
      endMinutes,
      slots,
    };
  }, [selectedDaySchedule]);

  const visibleAppointments = useMemo(() => {
    return selectedDateAppointments
      .map((appointment) => {
        const start = timeToMinutes(appointment.time);
        const duration = Math.max(Number(appointment.duration) || 30, 30);
        const end = start + duration;

        return {
          ...appointment,
          start,
          end,
          duration,
          top: ((start - calendarConfig.startMinutes) / 30) * 72,
          height: Math.max((duration / 30) * 72 - 10, 62),
        };
      })
      .filter(
        (appointment) =>
          appointment.start >= calendarConfig.startMinutes &&
          appointment.start < calendarConfig.endMinutes
      );
  }, [selectedDateAppointments, calendarConfig]);

  const handleOpenClientHistory = (appointment) => {
    if (!appointment.client_id) return;

    navigate(`/specialist/clients?client=${appointment.client_id}`);
  };

  if (loading) {
    return (
      <div className="specialist-overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state">
          {lang === 'UA' ? 'Завантаження...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="specialist-overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state error-state">
          <p>
            {lang === 'UA'
              ? 'Не вдалося завантажити кабінет спеціаліста'
              : 'Failed to load specialist dashboard'}
          </p>

          <small>{loadError}</small>

          <button type="button" className="btn-outline" onClick={loadData}>
            {lang === 'UA' ? 'Спробувати ще раз' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="specialist-overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state">
          {lang === 'UA'
            ? 'Акаунт спеціаліста не прив’язаний до запису лікаря.'
            : 'Specialist account is not linked to a doctor profile.'}
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-overview">
      <div className="section-header-row">
        <div>
          <h1 className="dashboard-title">
            {lang === 'UA' ? 'Огляд' : 'Overview'}
          </h1>

          <p className="dashboard-subtitle">
            {lang === 'UA'
              ? `Сьогодні: ${formatDateUA(getTodayISO())}`
              : `Today: ${getTodayISO()}`}
          </p>
        </div>

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="dashboard-stats-grid specialist-stats-grid">
        <div className="stat-card">
          <span>{lang === 'UA' ? 'Записів сьогодні' : 'Today appointments'}</span>
          <strong>{todayAppointments.length}</strong>
        </div>

        <div className="stat-card">
          <span>{lang === 'UA' ? 'Очікують' : 'Pending'}</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="stat-card">
          <span>{lang === 'UA' ? 'Клієнтів' : 'Clients'}</span>
          <strong>{uniqueClientsCount}</strong>
        </div>

        <div className="stat-card">
          <span>{lang === 'UA' ? 'Завершено' : 'Completed'}</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="specialist-overview-grid">
        <section className="dashboard-card doctor-calendar-card">
          <div className="calendar-header-row">
            <div>
              <h2>
                {lang === 'UA'
                  ? 'Календар записів'
                  : 'Appointment calendar'}
              </h2>

              <p>
                {lang === 'UA'
                  ? 'Записи відображаються відповідно до тривалості послуги. Натисніть на запис, щоб перейти до історії клієнта.'
                  : 'Appointments are displayed according to service duration. Click an appointment to open client history.'}
              </p>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="date-picker"
            />
          </div>

          {!selectedDaySchedule || selectedDaySchedule.is_working === false ? (
            <div className="empty-state small-empty">
              {lang === 'UA'
                ? 'У цей день графік роботи не встановлено або день вихідний.'
                : 'No working schedule for this day.'}
            </div>
          ) : (
            <div className="doctor-calendar-shell">
              <div className="doctor-calendar-time-column">
                {calendarConfig.slots.map((slot) => (
                  <div key={slot.time} className="doctor-calendar-time">
                    {slot.time}
                  </div>
                ))}
              </div>

              <div
                className="doctor-calendar-grid"
                style={{
                  height: `${calendarConfig.slots.length * 72}px`,
                }}
              >
                {calendarConfig.slots.map((slot) => (
                  <div
                    key={slot.time}
                    className="doctor-calendar-slot-line"
                    style={{
                      top: `${
                        ((slot.minutes - calendarConfig.startMinutes) / 30) * 72
                      }px`,
                    }}
                  />
                ))}

                {visibleAppointments.length === 0 && (
                  <div className="doctor-calendar-empty">
                    {lang === 'UA'
                      ? 'На цю дату записів немає'
                      : 'No appointments for this date'}
                  </div>
                )}

                {visibleAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    className={`doctor-calendar-appointment status-${appointment.status || 'pending'}`}
                    style={{
                      top: `${appointment.top}px`,
                      height: `${appointment.height}px`,
                    }}
                    onClick={() => handleOpenClientHistory(appointment)}
                    title={
                      lang === 'UA'
                        ? 'Перейти до історії клієнта'
                        : 'Open client history'
                    }
                  >
                    <div className="doctor-calendar-appointment-main">
                      <strong>{appointment.clientName}</strong>
                      <span>
                        {appointment.time} · {appointment.duration}{' '}
                        {lang === 'UA' ? 'хв' : 'min'}
                      </span>
                    </div>

                    <p>{appointment.serviceName}</p>

                    <div className="doctor-calendar-appointment-footer">
                      <span>{appointment.locationName}</span>
                      <b>
                        {statusLabels[appointment.status]?.[lang] ||
                          appointment.status ||
                          '—'}
                      </b>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <h2>
            {lang === 'UA'
              ? 'Найближчі записи'
              : 'Upcoming appointments'}
          </h2>

          {upcomingAppointments.length === 0 ? (
            <div className="empty-state small-empty">
              {lang === 'UA'
                ? 'Найближчих записів немає.'
                : 'No upcoming appointments.'}
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  className="upcoming-item upcoming-item-button"
                  onClick={() => handleOpenClientHistory(appointment)}
                >
                  <div>
                    <strong>{appointment.clientName}</strong>
                    <p>{appointment.serviceName}</p>
                    <span>
                      {appointment.date} · {appointment.time} ·{' '}
                      {appointment.duration} {lang === 'UA' ? 'хв' : 'min'}
                    </span>
                  </div>

                  <span
                    className={`status-badge status-${appointment.status || 'pending'}`}
                  >
                    {statusLabels[appointment.status]?.[lang] ||
                      appointment.status ||
                      '—'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SpecialistDashboardOverview;