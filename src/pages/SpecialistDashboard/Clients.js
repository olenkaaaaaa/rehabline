import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { createAuditLog } from '../../utils/auditLog';
import '../../styles/pages/specialist-clients.css';

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

const SpecialistClients = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [specialistNote, setSpecialistNote] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: specialistData, error: specialistError } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (specialistError) throw specialistError;

      if (!specialistData) {
        setSpecialist(null);
        setAppointments([]);
        setProfiles([]);
        setServices([]);
        setLocations([]);
        return;
      }

      setSpecialist(specialistData);

      const [
        appointmentsResponse,
        profilesResponse,
        servicesResponse,
        locationsResponse,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('specialist_id', specialistData.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false }),

        supabase.from('profiles').select('*'),

        supabase.from('services').select('*').order('id', { ascending: true }),

        supabase.from('locations').select('*').order('id', { ascending: true }),
      ]);

      if (appointmentsResponse.error) throw appointmentsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;

      setAppointments(appointmentsResponse.data || []);
      setProfiles(profilesResponse.data || []);
      setServices(servicesResponse.data || []);
      setLocations(locationsResponse.data || []);
    } catch (error) {
      console.error('Specialist clients loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити клієнтів: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load clients: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const client = profiles.find((profile) => profile.id === appointment.client_id);
      const service = services.find((item) => item.id === appointment.service_id);
      const location = locations.find((item) => item.id === appointment.location_id);

      return {
        ...appointment,
        date: appointment.appointment_date,
        time: normalizeTime(appointment.appointment_time),
        client,
        service,
        location,
        clientName: client?.full_name || client?.name || client?.email || 'Клієнт',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
        serviceName: getServiceName(service, lang),
        locationName: getLocationName(location, lang),
      };
    });
  }, [appointments, profiles, services, locations, lang]);

  const clients = useMemo(() => {
    const clientsMap = new Map();

    enrichedAppointments.forEach((appointment) => {
      if (!appointment.client_id) return;

      const existing = clientsMap.get(appointment.client_id);

      const clientAppointments = enrichedAppointments.filter(
        (item) => item.client_id === appointment.client_id
      );

      const completedVisits = clientAppointments.filter(
        (item) => item.status === 'completed'
      ).length;

      const upcomingVisits = clientAppointments.filter((item) => {
        const appointmentDateTime = `${item.date}T${item.time || '00:00'}`;
        return (
          new Date(appointmentDateTime) >= new Date() &&
          item.status !== 'cancelled' &&
          item.status !== 'canceled'
        );
      }).length;

      if (!existing) {
        clientsMap.set(appointment.client_id, {
          id: appointment.client_id,
          name: appointment.clientName,
          phone: appointment.clientPhone,
          email: appointment.clientEmail,
          visitsCount: clientAppointments.length,
          completedVisits,
          upcomingVisits,
          lastAppointment: clientAppointments[0],
          appointments: clientAppointments,
        });
      }
    });

    return Array.from(clientsMap.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );
  }, [enrichedAppointments]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus =
        !statusFilter ||
        client.appointments.some((appointment) => appointment.status === statusFilter);

      const searchText = [
        client.name,
        client.phone,
        client.email,
        client.appointments.map((appointment) => appointment.serviceName).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [clients, searchTerm, statusFilter]);

  const selectedClient = useMemo(() => {
    return clients.find((client) => client.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const selectedClientAppointments = useMemo(() => {
    if (!selectedClient) return [];

    return enrichedAppointments
      .filter((appointment) => appointment.client_id === selectedClient.id)
      .sort((a, b) => {
        const first = `${b.date} ${b.time}`;
        const second = `${a.date} ${a.time}`;
        return first.localeCompare(second);
      });
  }, [selectedClient, enrichedAppointments]);

  const selectedAppointment = useMemo(() => {
    return (
      selectedClientAppointments.find(
        (appointment) => appointment.id === selectedAppointmentId
      ) || null
    );
  }, [selectedClientAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (selectedClient && selectedClientAppointments.length > 0 && !selectedAppointmentId) {
      setSelectedAppointmentId(selectedClientAppointments[0].id);
    }
  }, [selectedClient, selectedClientAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (selectedAppointment) {
      setSpecialistNote(selectedAppointment.specialist_notes || '');
    }
  }, [selectedAppointment]);

  const handleSelectClient = (client) => {
    setSelectedClientId(client.id);

    const firstAppointment = client.appointments?.[0];

    if (firstAppointment) {
      setSelectedAppointmentId(firstAppointment.id);
    } else {
      setSelectedAppointmentId(null);
    }
  };

  const saveSpecialistNote = async () => {
    if (!selectedAppointment) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('appointments')
        .update({
          specialist_notes: specialistNote.trim() || null,
        })
        .eq('id', selectedAppointment.id)
        .select('*')
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === selectedAppointment.id ? data : appointment
        )
      );

      await createAuditLog({
        user,
        action: 'update_specialist_note',
        entity: 'appointment',
        tableName: 'appointments',
        recordId: selectedAppointment.id,
        description: `Лікар оновив нотатку до запису #${selectedAppointment.id}`,
        metadata: {
          appointmentId: selectedAppointment.id,
          clientId: selectedAppointment.client_id,
        },
      });

      alert(lang === 'UA' ? 'Нотатку збережено' : 'Note saved');
    } catch (error) {
      console.error('Save specialist note failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти нотатку: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save note: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const markCompleted = async () => {
    if (!selectedAppointment) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
        })
        .eq('id', selectedAppointment.id)
        .select('*')
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === selectedAppointment.id ? data : appointment
        )
      );

      await createAuditLog({
        user,
        action: 'complete_appointment',
        entity: 'appointment',
        tableName: 'appointments',
        recordId: selectedAppointment.id,
        description: `Лікар завершив запис #${selectedAppointment.id}`,
        metadata: {
          appointmentId: selectedAppointment.id,
          clientId: selectedAppointment.client_id,
        },
      });

      alert(lang === 'UA' ? 'Запис завершено' : 'Appointment completed');
    } catch (error) {
      console.error('Complete appointment failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завершити запис: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to complete appointment: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="specialist-clients">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Клієнти' : 'Clients'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="specialist-clients">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Клієнти' : 'Clients'}
        </h1>

        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Ваш акаунт ще не прив’язаний до спеціаліста.'
              : 'Your account is not linked to a specialist yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-clients">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Клієнти' : 'Clients'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Унікальні клієнти' : 'Unique clients'}
          </div>
          <div className="stat-value">{clients.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Усього візитів' : 'Total visits'}
          </div>
          <div className="stat-value">{enrichedAppointments.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Завершені' : 'Completed'}
          </div>
          <div className="stat-value">
            {enrichedAppointments.filter((item) => item.status === 'completed').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Майбутні' : 'Upcoming'}
          </div>
          <div className="stat-value">
            {enrichedAppointments.filter((item) => {
              const appointmentDateTime = `${item.date}T${item.time || '00:00'}`;
              return (
                new Date(appointmentDateTime) >= new Date() &&
                item.status !== 'cancelled' &&
                item.status !== 'canceled'
              );
            }).length}
          </div>
        </div>
      </div>

      <div className="specialist-client-filters">
        <input
          type="text"
          value={searchTerm}
          placeholder={
            lang === 'UA'
              ? 'Пошук за ПІБ, телефоном, email або послугою...'
              : 'Search by name, phone, email or service...'
          }
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">
            {lang === 'UA' ? 'Усі статуси записів' : 'All appointment statuses'}
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
      </div>

      <div className="specialist-client-workspace">
        <section className="client-list-panel">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={`client-med-card ${
                  selectedClientId === client.id ? 'active' : ''
                }`}
                onClick={() => handleSelectClient(client)}
              >
                <div className="client-med-avatar">
                  {String(client.name || '?').slice(0, 1).toUpperCase()}
                </div>

                <div className="client-med-info">
                  <strong>{client.name}</strong>

                  {client.phone && <span>{client.phone}</span>}
                  {client.email && <span>{client.email}</span>}

                  <div className="client-med-meta">
                    <small>
                      {lang === 'UA'
                        ? `Візитів: ${client.visitsCount}`
                        : `Visits: ${client.visitsCount}`}
                    </small>

                    <small>
                      {lang === 'UA'
                        ? `Завершено: ${client.completedVisits}`
                        : `Completed: ${client.completedVisits}`}
                    </small>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Клієнтів не знайдено'
                  : 'No clients found'}
              </p>
            </div>
          )}
        </section>

        <aside className="client-detail-panel">
          {selectedClient ? (
            <>
              <div className="client-detail-header">
                <div className="client-med-avatar large">
                  {String(selectedClient.name || '?').slice(0, 1).toUpperCase()}
                </div>

                <div>
                  <h2>{selectedClient.name}</h2>

                  {selectedClient.phone && (
                    <p>
                      <strong>{lang === 'UA' ? 'Телефон' : 'Phone'}:</strong>{' '}
                      {selectedClient.phone}
                    </p>
                  )}

                  {selectedClient.email && (
                    <p>
                      <strong>Email:</strong> {selectedClient.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="client-history-grid">
                <div className="client-history-list">
                  <h3>
                    {lang === 'UA'
                      ? 'Історія записів'
                      : 'Appointment history'}
                  </h3>

                  {selectedClientAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      className={`client-history-item ${
                        selectedAppointmentId === appointment.id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedAppointmentId(appointment.id)}
                    >
                      <div>
                        <strong>
                          {appointment.date} • {appointment.time}
                        </strong>
                        <span>{appointment.serviceName || '—'}</span>
                        <small>{appointment.locationName || '—'}</small>
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

                <div className="client-appointment-detail">
                  {selectedAppointment ? (
                    <>
                      <h3>
                        {lang === 'UA'
                          ? 'Деталі вибраного запису'
                          : 'Selected appointment details'}
                      </h3>

                      <div className="info-row">
                        <span className="info-label">
                          {lang === 'UA' ? 'Дата' : 'Date'}:
                        </span>
                        <span className="info-value">
                          {selectedAppointment.date} • {selectedAppointment.time}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">
                          {lang === 'UA' ? 'Послуга' : 'Service'}:
                        </span>
                        <span className="info-value">
                          {selectedAppointment.serviceName || '—'}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">
                          {lang === 'UA' ? 'Локація' : 'Location'}:
                        </span>
                        <span className="info-value">
                          {selectedAppointment.locationName || '—'}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">
                          {lang === 'UA' ? 'Статус' : 'Status'}:
                        </span>
                        <span className="info-value">
                          {getStatusLabel(selectedAppointment.status, lang)}
                        </span>
                      </div>

                      {selectedAppointment.client_notes && (
                        <div className="note-box">
                          <h4>
                            {lang === 'UA'
                              ? 'Коментар клієнта'
                              : 'Client comment'}
                          </h4>
                          <p>{selectedAppointment.client_notes}</p>
                        </div>
                      )}

                      <div className="form-group">
                        <label>
                          {lang === 'UA'
                            ? 'Нотатка спеціаліста'
                            : 'Specialist note'}
                        </label>

                        <textarea
                          rows="5"
                          value={specialistNote}
                          onChange={(event) => setSpecialistNote(event.target.value)}
                          disabled={saving}
                        />
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={markCompleted}
                          disabled={saving}
                        >
                          {lang === 'UA'
                            ? 'Позначити завершеним'
                            : 'Mark completed'}
                        </button>

                        <button
                          type="button"
                          className="btn-primary"
                          onClick={saveSpecialistNote}
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
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>
                        {lang === 'UA'
                          ? 'Оберіть запис'
                          : 'Select appointment'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Оберіть клієнта зі списку'
                  : 'Select a client from the list'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SpecialistClients;