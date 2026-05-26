import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { createAuditLog } from '../../utils/auditLog';
import '../../styles/pages/registrar-appointments.css';

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';
};

const getStatusLabel = (status, lang) => {
  const labels = {
    pending: { UA: 'Очікує', EN: 'Pending' },
    confirmed: { UA: 'Підтверджено', EN: 'Confirmed' },
    completed: { UA: 'Завершено', EN: 'Completed' },
    cancelled: { UA: 'Скасовано', EN: 'Cancelled' },
    canceled: { UA: 'Скасовано', EN: 'Cancelled' },
  };

  return labels[status]?.[lang] || status || '—';
};

const normalizeStatusClass = (status) => {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
};

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const timeToMinutes = (time) => {
  const normalized = normalizeTime(time);
  const [hours, minutes] = normalized.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getDayOfWeekForDb = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const jsDay = date.getDay();

  return jsDay === 0 ? 7 : jsDay;
};

const todayString = () => {
  return new Date().toISOString().split('T')[0];
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const getWeekStart = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
};

const formatDateShort = (dateString, lang) => {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    lang === 'UA' ? 'uk-UA' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
    }
  );
};

const formatDateLong = (dateString, lang) => {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    lang === 'UA' ? 'uk-UA' : 'en-US',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );
};

const weekDayLabels = {
  UA: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const AppointmentPanel = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [viewMode, setViewMode] = useState('table');
  const [calendarDate, setCalendarDate] = useState(todayString());

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpecialist, setFilterSpecialist] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [registrarNotes, setRegistrarNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: todayString(),
    time: '',
    locationId: '',
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setPageError('');

      const [
        appointmentsResponse,
        servicesResponse,
        specialistsResponse,
        locationsResponse,
        profilesResponse,
        schedulesResponse,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false }),

        supabase.from('services').select('*').order('id', { ascending: true }),

        supabase.from('specialists').select('*').order('name', { ascending: true }),

        supabase.from('locations').select('*').order('id', { ascending: true }),

        supabase.from('profiles').select('*'),

        supabase
          .from('specialist_schedules')
          .select('*')
          .eq('is_working', true),
      ]);

      if (appointmentsResponse.error) throw appointmentsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (specialistsResponse.error) throw specialistsResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;
      if (schedulesResponse.error) throw schedulesResponse.error;

      setAppointments(appointmentsResponse.data || []);
      setServices(servicesResponse.data || []);
      setSpecialists(specialistsResponse.data || []);
      setLocations(locationsResponse.data || []);
      setProfiles(profilesResponse.data || []);
      setSchedules(schedulesResponse.data || []);
    } catch (error) {
      console.error('Registrar appointments loading failed:', error);

      setPageError(
        lang === 'UA'
          ? `Не вдалося завантажити записи: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load appointments: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((item) => item.id === appointment.service_id);
      const specialist = specialists.find(
        (item) => item.id === appointment.specialist_id
      );
      const location = locations.find((item) => item.id === appointment.location_id);
      const client = profiles.find((item) => item.id === appointment.client_id);

      return {
        ...appointment,
        date: appointment.appointment_date,
        time: normalizeTime(appointment.appointment_time),
        service,
        specialist,
        location,
        client,
        serviceName: getServiceName(service, lang),
        specialistName: specialist?.name || '',
        locationName: getLocationName(location, lang),
        clientName: client?.full_name || client?.name || client?.email || 'Клієнт',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
      };
    });
  }, [appointments, services, specialists, locations, profiles, lang]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return enrichedAppointments.filter((appointment) => {
      const matchesDate = !filterDate || appointment.date === filterDate;
      const matchesStatus = !filterStatus || appointment.status === filterStatus;
      const matchesSpecialist =
        !filterSpecialist || appointment.specialist_id === Number(filterSpecialist);

      const searchText = [
        appointment.clientName,
        appointment.clientPhone,
        appointment.clientEmail,
        appointment.serviceName,
        appointment.specialistName,
        appointment.locationName,
        appointment.date,
        appointment.time,
        appointment.status,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesDate && matchesStatus && matchesSpecialist && matchesSearch;
    });
  }, [
    enrichedAppointments,
    filterDate,
    filterStatus,
    filterSpecialist,
    searchTerm,
  ]);

  const selectedAppointment = useMemo(() => {
    return (
      enrichedAppointments.find((item) => item.id === selectedAppointmentId) ||
      null
    );
  }, [enrichedAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (selectedAppointment) {
      setRegistrarNotes(selectedAppointment.registrar_notes || '');
    }
  }, [selectedAppointment]);

  const stats = useMemo(() => {
    return {
      all: enrichedAppointments.length,
      pending: enrichedAppointments.filter((item) => item.status === 'pending')
        .length,
      confirmed: enrichedAppointments.filter((item) => item.status === 'confirmed')
        .length,
      completed: enrichedAppointments.filter((item) => item.status === 'completed')
        .length,
      cancelled: enrichedAppointments.filter(
        (item) => item.status === 'cancelled' || item.status === 'canceled'
      ).length,
    };
  }, [enrichedAppointments]);

  const availableTimesForReschedule = useMemo(() => {
    if (!selectedAppointment || !rescheduleData.date) return [];

    const specialistId = Number(selectedAppointment.specialist_id);
    const serviceDuration = Number(
      selectedAppointment.service?.duration_minutes ||
        selectedAppointment.service?.duration ||
        45
    );

    const dayOfWeek = getDayOfWeekForDb(rescheduleData.date);

    const daySchedules = schedules.filter(
      (schedule) =>
        Number(schedule.specialist_id) === specialistId &&
        Number(schedule.day_of_week) === dayOfWeek &&
        schedule.is_working
    );

    const busyTimes = new Set(
      appointments
        .filter(
          (appointment) =>
            appointment.id !== selectedAppointment.id &&
            Number(appointment.specialist_id) === specialistId &&
            appointment.appointment_date === rescheduleData.date &&
            appointment.status !== 'cancelled' &&
            appointment.status !== 'canceled'
        )
        .map((appointment) => normalizeTime(appointment.appointment_time))
    );

    const slots = [];

    daySchedules.forEach((schedule) => {
      const start = timeToMinutes(schedule.start_time);
      const end = timeToMinutes(schedule.end_time);
      const step = 30;

      if (Number.isNaN(start) || Number.isNaN(end)) return;

      for (let minute = start; minute + serviceDuration <= end; minute += step) {
        const time = minutesToTime(minute);

        if (!busyTimes.has(time)) {
          slots.push(time);
        }
      }
    });

    return Array.from(new Set(slots)).sort();
  }, [selectedAppointment, rescheduleData.date, schedules, appointments]);

  const calendarDayAppointments = useMemo(() => {
    return enrichedAppointments
      .filter((appointment) => appointment.date === calendarDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [enrichedAppointments, calendarDate]);

  const weekDates = useMemo(() => {
    const start = getWeekStart(calendarDate);

    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
  }, [calendarDate]);

  const weekAppointments = useMemo(() => {
    return weekDates.map((date, index) => {
      const dayAppointments = enrichedAppointments
        .filter((appointment) => appointment.date === date)
        .sort((a, b) => a.time.localeCompare(b.time));

      return {
        date,
        label: weekDayLabels[lang][index],
        appointments: dayAppointments,
      };
    });
  }, [weekDates, enrichedAppointments, lang]);

  const updateAppointment = async (appointmentId, updates, auditData = null) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((item) => (item.id === appointmentId ? data : item))
      );

      if (auditData) {
        await createAuditLog({
          user,
          ...auditData,
        });
      }

      return data;
    } catch (error) {
      console.error('Appointment update failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося оновити запис: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to update appointment: ${error.message || 'Please try again'}`
      );

      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveRegistrarNotes = async () => {
    if (!selectedAppointment) return;

    const updated = await updateAppointment(
      selectedAppointment.id,
      {
        registrar_notes: registrarNotes.trim() || null,
      },
      {
        action: 'update_registrar_note',
        entity: 'appointment',
        tableName: 'appointments',
        recordId: selectedAppointment.id,
        description: `Реєстратор оновив нотатку до запису #${selectedAppointment.id}`,
        metadata: {
          appointmentId: selectedAppointment.id,
          notes: registrarNotes.trim() || null,
        },
      }
    );

    if (updated) {
      alert(lang === 'UA' ? 'Нотатку збережено' : 'Note saved');
    }
  };

  const updateStatus = async (status) => {
    if (!selectedAppointment) return;

    const oldStatus = selectedAppointment.status;

    await updateAppointment(
      selectedAppointment.id,
      {
        status,
      },
      {
        action: 'update_appointment_status',
        entity: 'appointment',
        tableName: 'appointments',
        recordId: selectedAppointment.id,
        description: `Реєстратор змінив статус запису #${selectedAppointment.id}: ${oldStatus} → ${status}`,
        metadata: {
          appointmentId: selectedAppointment.id,
          oldStatus,
          newStatus: status,
        },
      }
    );
  };

  const openAppointmentDetails = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setDetailsOpen(true);
  };

  const closeAppointmentDetails = () => {
    setDetailsOpen(false);
  };

  const openReschedule = () => {
    if (!selectedAppointment) return;

    setRescheduleData({
      date: selectedAppointment.date || todayString(),
      time: '',
      locationId: selectedAppointment.location_id
        ? String(selectedAppointment.location_id)
        : '',
    });

    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setRescheduleOpen(false);

    setRescheduleData({
      date: todayString(),
      time: '',
      locationId: '',
    });
  };

  const handleRescheduleChange = (field, value) => {
    setRescheduleData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'date') {
        next.time = '';
      }

      return next;
    });
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAppointment) return;

    if (!rescheduleData.date) {
      alert(lang === 'UA' ? 'Оберіть дату' : 'Select date');
      return;
    }

    if (!rescheduleData.time) {
      alert(lang === 'UA' ? 'Оберіть час' : 'Select time');
      return;
    }

    const existingBusyAppointment = appointments.find((appointment) => {
      return (
        appointment.id !== selectedAppointment.id &&
        Number(appointment.specialist_id) ===
          Number(selectedAppointment.specialist_id) &&
        appointment.appointment_date === rescheduleData.date &&
        normalizeTime(appointment.appointment_time) === rescheduleData.time &&
        appointment.status !== 'cancelled' &&
        appointment.status !== 'canceled'
      );
    });

    if (existingBusyAppointment) {
      alert(
        lang === 'UA'
          ? 'Цей час уже зайнятий. Оберіть інший слот.'
          : 'This time is already booked. Choose another slot.'
      );
      return;
    }

    const oldDate = selectedAppointment.date;
    const oldTime = selectedAppointment.time;

    const updated = await updateAppointment(
      selectedAppointment.id,
      {
        appointment_date: rescheduleData.date,
        appointment_time: rescheduleData.time,
        location_id: rescheduleData.locationId
          ? Number(rescheduleData.locationId)
          : selectedAppointment.location_id,
        status:
          selectedAppointment.status === 'cancelled' ||
          selectedAppointment.status === 'canceled'
            ? 'confirmed'
            : selectedAppointment.status,
      },
      {
        action: 'reschedule_appointment',
        entity: 'appointment',
        tableName: 'appointments',
        recordId: selectedAppointment.id,
        description: `Реєстратор переніс запис #${selectedAppointment.id}: ${oldDate} ${oldTime} → ${rescheduleData.date} ${rescheduleData.time}`,
        metadata: {
          appointmentId: selectedAppointment.id,
          oldDate,
          oldTime,
          newDate: rescheduleData.date,
          newTime: rescheduleData.time,
          locationId: rescheduleData.locationId || selectedAppointment.location_id,
        },
      }
    );

    if (updated) {
      setCalendarDate(rescheduleData.date);
      closeReschedule();

      alert(lang === 'UA' ? 'Запис перенесено' : 'Appointment rescheduled');
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterStatus('');
    setFilterSpecialist('');
    setSearchTerm('');
  };

  const changeCalendarDate = (days) => {
    setCalendarDate((prev) => addDays(prev, days));
  };

  if (loading) {
    return (
      <div className="registrar-panel">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Панель записів' : 'Appointment panel'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-panel">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Панель записів' : 'Appointment panel'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadAppointments}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Усього' : 'Total'}</div>
          <div className="stat-value">{stats.all}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Очікують' : 'Pending'}</div>
          <div className="stat-value">{stats.pending}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Підтверджені' : 'Confirmed'}
          </div>
          <div className="stat-value">{stats.confirmed}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Завершені' : 'Completed'}
          </div>
          <div className="stat-value">{stats.completed}</div>
        </div>
      </div>

      <div className="registrar-view-switch">
        <button
          type="button"
          className={viewMode === 'table' ? 'active' : ''}
          onClick={() => setViewMode('table')}
        >
          {lang === 'UA' ? 'Таблиця' : 'Table'}
        </button>

        <button
          type="button"
          className={viewMode === 'day' ? 'active' : ''}
          onClick={() => setViewMode('day')}
        >
          {lang === 'UA' ? 'День' : 'Day'}
        </button>

        <button
          type="button"
          className={viewMode === 'week' ? 'active' : ''}
          onClick={() => setViewMode('week')}
        >
          {lang === 'UA' ? 'Тиждень' : 'Week'}
        </button>
      </div>

      {viewMode !== 'table' && (
        <div className="calendar-toolbar">
          <button
            type="button"
            className="btn-outline"
            onClick={() => changeCalendarDate(viewMode === 'week' ? -7 : -1)}
          >
            ←
          </button>

          <input
            type="date"
            value={calendarDate}
            onChange={(event) => setCalendarDate(event.target.value)}
          />

          <button
            type="button"
            className="btn-outline"
            onClick={() => setCalendarDate(todayString())}
          >
            {lang === 'UA' ? 'Сьогодні' : 'Today'}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => changeCalendarDate(viewMode === 'week' ? 7 : 1)}
          >
            →
          </button>
        </div>
      )}

      <div className="registrar-workspace">
        <section className="workspace-main">
          {viewMode === 'table' && (
            <>
              <div className="records-actions registrar-appointment-filters">
                <input
                  type="text"
                  value={searchTerm}
                  placeholder={
                    lang === 'UA'
                      ? 'Пошук: клієнт, телефон, послуга, лікар...'
                      : 'Search: client, phone, service, specialist...'
                  }
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <input
                  type="date"
                  value={filterDate}
                  onChange={(event) => setFilterDate(event.target.value)}
                />

                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                >
                  <option value="">
                    {lang === 'UA' ? 'Усі статуси' : 'All statuses'}
                  </option>
                  <option value="pending">{lang === 'UA' ? 'Очікує' : 'Pending'}</option>
                  <option value="confirmed">
                    {lang === 'UA' ? 'Підтверджено' : 'Confirmed'}
                  </option>
                  <option value="completed">
                    {lang === 'UA' ? 'Завершено' : 'Completed'}
                  </option>
                  <option value="cancelled">
                    {lang === 'UA' ? 'Скасовано' : 'Cancelled'}
                  </option>
                </select>

                <select
                  value={filterSpecialist}
                  onChange={(event) => setFilterSpecialist(event.target.value)}
                >
                  <option value="">
                    {lang === 'UA' ? 'Усі спеціалісти' : 'All specialists'}
                  </option>

                  {specialists.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name}
                    </option>
                  ))}
                </select>

                <button type="button" className="btn-outline" onClick={clearFilters}>
                  {lang === 'UA' ? 'Очистити' : 'Clear'}
                </button>
              </div>

              {filteredAppointments.length > 0 ? (
                <div className="appointments-table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
                        <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                        <th>{lang === 'UA' ? 'Клієнт' : 'Client'}</th>
                        <th>{lang === 'UA' ? 'Телефон' : 'Phone'}</th>
                        <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                        <th>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</th>
                        <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
                        <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                        <th>{lang === 'UA' ? 'Дія' : 'Action'}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAppointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className={
                            selectedAppointmentId === appointment.id
                              ? 'selected-row'
                              : ''
                          }
                        >
                          <td>{appointment.date}</td>
                          <td>{appointment.time}</td>
                          <td>{appointment.clientName}</td>
                          <td>{appointment.clientPhone || '—'}</td>
                          <td>{appointment.serviceName || '—'}</td>
                          <td>{appointment.specialistName || '—'}</td>
                          <td>{appointment.locationName || '—'}</td>
                          <td>
                            <span
                              className={`status-badge status-${normalizeStatusClass(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(appointment.status, lang)}
                            </span>
                          </td>
                          <td className="table-action-cell">
                            <button
                              type="button"
                              className="btn-link open-appointment-btn"
                              onClick={() => openAppointmentDetails(appointment)}
                            >
                              {lang === 'UA' ? 'Деталі' : 'Details'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>
                    {lang === 'UA'
                      ? 'Записів не знайдено'
                      : 'No appointments found'}
                  </p>
                </div>
              )}
            </>
          )}

          {viewMode === 'day' && (
            <div className="calendar-day-view">
              <div className="calendar-view-title">
                <h2>{formatDateLong(calendarDate, lang)}</h2>
                <p>
                  {lang === 'UA'
                    ? `Записів: ${calendarDayAppointments.length}`
                    : `Appointments: ${calendarDayAppointments.length}`}
                </p>
              </div>

              {calendarDayAppointments.length > 0 ? (
                <div className="day-timeline">
                  {calendarDayAppointments.map((appointment) => (
                    <button
                      type="button"
                      key={appointment.id}
                      className={`timeline-card status-left-${normalizeStatusClass(
                        appointment.status
                      )} ${
                        selectedAppointmentId === appointment.id ? 'active' : ''
                      }`}
                      onClick={() => openAppointmentDetails(appointment)}
                    >
                      <div className="timeline-time">{appointment.time}</div>

                      <div className="timeline-content">
                        <strong>{appointment.clientName}</strong>
                        <span>{appointment.serviceName || '—'}</span>
                        <small>
                          {appointment.specialistName || '—'} ·{' '}
                          {appointment.locationName || '—'}
                        </small>
                      </div>

                      <span
                        className={`status-badge status-${normalizeStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status, lang)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>
                    {lang === 'UA'
                      ? 'На цю дату записів немає'
                      : 'No appointments for this date'}
                  </p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="calendar-week-view">
              {weekAppointments.map((day) => (
                <div key={day.date} className="week-day-column">
                  <div className="week-day-header">
                    <strong>{day.label}</strong>
                    <span>{formatDateShort(day.date, lang)}</span>
                  </div>

                  <div className="week-day-body">
                    {day.appointments.length > 0 ? (
                      day.appointments.map((appointment) => (
                        <button
                          type="button"
                          key={appointment.id}
                          className={`week-appointment-card status-left-${normalizeStatusClass(
                            appointment.status
                          )} ${
                            selectedAppointmentId === appointment.id ? 'active' : ''
                          }`}
                          onClick={() => openAppointmentDetails(appointment)}
                        >
                          <strong>{appointment.time}</strong>
                          <span>{appointment.clientName}</span>
                          <small>{appointment.serviceName || '—'}</small>
                        </button>
                      ))
                    ) : (
                      <p className="week-empty">
                        {lang === 'UA' ? 'Немає' : 'Empty'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {detailsOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={closeAppointmentDetails}>
          <div
            className="modal-content appointment-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{lang === 'UA' ? 'Деталі запису' : 'Appointment details'}</h2>
                <p>
                  {lang === 'UA' ? 'Запис' : 'Appointment'} #
                  {selectedAppointment.id}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeAppointmentDetails}
              >
                ×
              </button>
            </div>

            <div className="appointment-details-grid">
              <div className="detail-item">
                <span>{lang === 'UA' ? 'Клієнт' : 'Client'}</span>
                <strong>{selectedAppointment.clientName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Телефон' : 'Phone'}</span>
                <strong>{selectedAppointment.clientPhone || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>Email</span>
                <strong>{selectedAppointment.clientEmail || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Послуга' : 'Service'}</span>
                <strong>{selectedAppointment.serviceName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</span>
                <strong>{selectedAppointment.specialistName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Локація' : 'Location'}</span>
                <strong>{selectedAppointment.locationName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Дата' : 'Date'}</span>
                <strong>{selectedAppointment.date || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Час' : 'Time'}</span>
                <strong>{selectedAppointment.time || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Статус' : 'Status'}</span>
                <strong>{getStatusLabel(selectedAppointment.status, lang)}</strong>
              </div>
            </div>

            {selectedAppointment.client_notes && (
              <div className="detail-note">
                <span>{lang === 'UA' ? 'Коментар клієнта' : 'Client note'}</span>
                <p>{selectedAppointment.client_notes}</p>
              </div>
            )}

            <div className="detail-note">
              <span>
                {lang === 'UA' ? 'Нотатка реєстратора' : 'Registrar note'}
              </span>

              <textarea
                rows="4"
                value={registrarNotes}
                onChange={(event) => setRegistrarNotes(event.target.value)}
                disabled={saving}
              />

              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={saveRegistrarNotes}
              >
                {saving
                  ? lang === 'UA'
                    ? 'Збереження...'
                    : 'Saving...'
                  : lang === 'UA'
                    ? 'Зберегти нотатку'
                    : 'Save note'}
              </button>
            </div>

            <div className="modal-actions appointment-modal-actions">
              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() => updateStatus('confirmed')}
              >
                {lang === 'UA' ? 'Підтвердити' : 'Confirm'}
              </button>

              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() => updateStatus('completed')}
              >
                {lang === 'UA' ? 'Завершити' : 'Complete'}
              </button>

              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() => updateStatus('cancelled')}
              >
                {lang === 'UA' ? 'Скасувати' : 'Cancel'}
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={openReschedule}
              >
                {lang === 'UA' ? 'Перенести запис' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={closeReschedule}>
          <div
            className="modal-content reschedule-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>
              {lang === 'UA' ? 'Перенести запис' : 'Reschedule appointment'}
            </h2>

            <div className="reschedule-current">
              <p>
                <strong>{lang === 'UA' ? 'Поточний час' : 'Current time'}:</strong>{' '}
                {selectedAppointment.date} • {selectedAppointment.time}
              </p>

              <p>
                <strong>{lang === 'UA' ? 'Лікар' : 'Specialist'}:</strong>{' '}
                {selectedAppointment.specialistName || '—'}
              </p>

              <p>
                <strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong>{' '}
                {selectedAppointment.serviceName || '—'}
              </p>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Нова дата' : 'New date'}</label>

                <input
                  type="date"
                  value={rescheduleData.date}
                  min={todayString()}
                  onChange={(event) =>
                    handleRescheduleChange('date', event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Новий час' : 'New time'}</label>

                <select
                  value={rescheduleData.time}
                  onChange={(event) =>
                    handleRescheduleChange('time', event.target.value)
                  }
                  required
                >
                  <option value="">
                    {lang === 'UA' ? 'Оберіть час' : 'Select time'}
                  </option>

                  {availableTimesForReschedule.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>

                {availableTimesForReschedule.length === 0 && (
                  <p className="hint">
                    {lang === 'UA'
                      ? 'На цю дату немає вільних слотів для цього лікаря.'
                      : 'No free slots for this specialist on this date.'}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Локація' : 'Location'}</label>

                <select
                  value={rescheduleData.locationId}
                  onChange={(event) =>
                    handleRescheduleChange('locationId', event.target.value)
                  }
                >
                  <option value="">
                    {selectedAppointment.locationName ||
                      (lang === 'UA' ? 'Без змін' : 'No changes')}
                  </option>

                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {getLocationName(location, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeReschedule}
                  disabled={saving}
                >
                  {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? lang === 'UA'
                      ? 'Перенесення...'
                      : 'Rescheduling...'
                    : lang === 'UA'
                      ? 'Перенести'
                      : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPanel;