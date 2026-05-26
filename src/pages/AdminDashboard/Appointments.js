import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/admin-appointments.css';

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? serviceFallback(location?.name_ua, location?.name)
    : location?.name_en || location?.name_ua || location?.name || '';
};

const serviceFallback = (mainValue, fallbackValue) => {
  return mainValue || fallbackValue || '';
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

const AdminAppointments = () => {
  const { lang } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpecialist, setFilterSpecialist] = useState('');
  const [filterService, setFilterService] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const [
        appointmentsResponse,
        servicesResponse,
        specialistsResponse,
        locationsResponse,
        profilesResponse,
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
      ]);

      if (appointmentsResponse.error) throw appointmentsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (specialistsResponse.error) throw specialistsResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      setAppointments(appointmentsResponse.data || []);
      setServices(servicesResponse.data || []);
      setSpecialists(specialistsResponse.data || []);
      setLocations(locationsResponse.data || []);
      setProfiles(profilesResponse.data || []);
    } catch (error) {
      console.error('Admin appointments loading failed:', error);

      alert(
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
        time: String(appointment.appointment_time || '').slice(0, 5),
        serviceName: getServiceName(service, lang),
        specialistName: specialist?.name || '',
        locationName: getLocationName(location, lang),
        clientName: client?.full_name || client?.email || 'Клієнт',
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
      const matchesService =
        !filterService || appointment.service_id === Number(filterService);

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

      return (
        matchesDate &&
        matchesStatus &&
        matchesSpecialist &&
        matchesService &&
        matchesSearch
      );
    });
  }, [
    enrichedAppointments,
    filterDate,
    filterStatus,
    filterSpecialist,
    filterService,
    searchTerm,
  ]);

  const selectedAppointment = useMemo(() => {
    return (
      enrichedAppointments.find(
        (appointment) => appointment.id === selectedAppointmentId
      ) || null
    );
  }, [enrichedAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (selectedAppointment) {
      setAdminNotes(
        selectedAppointment.admin_notes ||
          selectedAppointment.registrar_notes ||
          ''
      );
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

  const updateAppointment = async (appointmentId, updates) => {
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
        prev.map((appointment) =>
          appointment.id === appointmentId ? data : appointment
        )
      );
    } catch (error) {
      console.error('Admin appointment update failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося оновити запис: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to update appointment: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selectedAppointment) return;

    await updateAppointment(selectedAppointment.id, {
      status,
    });
  };

  const saveAdminNotes = async () => {
    if (!selectedAppointment) return;

    await updateAppointment(selectedAppointment.id, {
      admin_notes: adminNotes.trim() || null,
    });

    alert(lang === 'UA' ? 'Нотатку збережено' : 'Note saved');
  };

  const deleteAppointment = async () => {
    if (!selectedAppointment) return;

    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Видалити запис назавжди?'
        : 'Delete this appointment permanently?'
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id !== selectedAppointment.id)
      );

      setSelectedAppointmentId(null);
      setAdminNotes('');
      setDetailsOpen(false);
    } catch (error) {
      console.error('Delete appointment failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося видалити запис: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to delete appointment: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterStatus('');
    setFilterSpecialist('');
    setFilterService('');
    setSearchTerm('');
  };

  const openDetails = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
  };

  if (loading) {
    return (
      <div className="admin-appointments">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Записи' : 'Appointments'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appointments">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Записи' : 'Appointments'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadAppointments}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

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

      <div className="admin-workspace admin-workspace-full">
        <section className="workspace-main">
          <div className="records-actions admin-appointment-filters">
            <input
              type="text"
              value={searchTerm}
              placeholder={
                lang === 'UA'
                  ? 'Пошук: клієнт, телефон, email, послуга, лікар...'
                  : 'Search: client, phone, email, service, specialist...'
              }
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
              onChange={(e) => setFilterSpecialist(e.target.value)}
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

            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              <option value="">
                {lang === 'UA' ? 'Усі послуги' : 'All services'}
              </option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {getServiceName(service, lang)}
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
                        selectedAppointmentId === appointment.id ? 'selected-row' : ''
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
                          className="btn-link"
                          onClick={() => openDetails(appointment.id)}
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
        </section>
      </div>

      {detailsOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div
            className="modal-content appointment-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{lang === 'UA' ? 'Деталі запису' : 'Appointment details'}</h2>
                <p>
                  {lang === 'UA' ? 'Запис' : 'Appointment'} #{selectedAppointment.id}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            <div className="appointment-details-grid">
              <div className="detail-item">
                <span>ID</span>
                <strong>#{selectedAppointment.id}</strong>
              </div>

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
                <strong>
                  {getStatusLabel(selectedAppointment.status, lang)}
                </strong>
              </div>
            </div>

            {selectedAppointment.client_notes && (
              <div className="detail-note">
                <span>{lang === 'UA' ? 'Коментар клієнта' : 'Client notes'}</span>
                <p>{selectedAppointment.client_notes}</p>
              </div>
            )}

            {selectedAppointment.specialist_notes && (
              <div className="detail-note">
                <span>
                  {lang === 'UA' ? 'Нотатка спеціаліста' : 'Specialist note'}
                </span>
                <p>{selectedAppointment.specialist_notes}</p>
              </div>
            )}

            <div className="detail-note">
              <span>{lang === 'UA' ? 'Нотатка адміна' : 'Admin note'}</span>

              <textarea
                rows="4"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={saving}
              />

              <button
                type="button"
                className="btn-primary"
                onClick={saveAdminNotes}
                disabled={saving}
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
                onClick={() => updateStatus('pending')}
              >
                {lang === 'UA' ? 'Очікує' : 'Pending'}
              </button>

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
                className="btn-outline danger"
                onClick={deleteAppointment}
                disabled={saving}
              >
                {lang === 'UA' ? 'Видалити' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;