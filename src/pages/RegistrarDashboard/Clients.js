import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/registrar-clients.css';

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getSpecialistName = (specialist) => {
  return specialist?.name || '';
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

const Clients = () => {
  const { lang } = useLanguage();

  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        setLoading(true);
        setPageError('');

        const [
          clientsResponse,
          appointmentsResponse,
          servicesResponse,
          specialistsResponse,
          locationsResponse,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('role', 'client')
            .order('full_name', { ascending: true }),

          supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false }),

          supabase.from('services').select('*'),
          supabase.from('specialists').select('*'),
          supabase.from('locations').select('*'),
        ]);

        if (clientsResponse.error) throw clientsResponse.error;
        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;

        if (!isMounted) return;

        setClients(clientsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setServices(servicesResponse.data || []);
        setSpecialists(specialistsResponse.data || []);
        setLocations(locationsResponse.data || []);
      } catch (error) {
        console.error('Registrar clients loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити клієнтів'
            : 'Failed to load clients'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const enrichedClients = useMemo(() => {
    return clients.map((client) => {
      const clientAppointments = appointments
        .filter((appointment) => appointment.client_id === client.id)
        .map((appointment) => {
          const service = services.find((item) => item.id === appointment.service_id);
          const specialist = specialists.find((item) => item.id === appointment.specialist_id);
          const location = locations.find((item) => item.id === appointment.location_id);

          return {
            ...appointment,
            date: appointment.appointment_date,
            time: String(appointment.appointment_time || '').slice(0, 5),
            serviceName: getServiceName(service, lang),
            specialistName: getSpecialistName(specialist),
            locationName: getLocationName(location, lang),
          };
        });

      const lastAppointment = clientAppointments[0] || null;

      return {
        ...client,
        fullName: client.full_name || client.name || client.email || 'Клієнт',
        phoneLabel: client.phone || '',
        emailLabel: client.email || '',
        languageLabel: client.language === 'EN' ? 'English' : 'Українська',
        appointments: clientAppointments,
        appointmentsCount: clientAppointments.length,
        lastAppointment,
      };
    });
  }, [clients, appointments, services, specialists, locations, lang]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return enrichedClients;
    }

    return enrichedClients.filter((client) => {
      const searchText = [
        client.fullName,
        client.phoneLabel,
        client.emailLabel,
        client.languageLabel,
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedSearch);
    });
  }, [enrichedClients, searchTerm]);

  const selectedClient = useMemo(() => {
    return enrichedClients.find((client) => client.id === selectedClientId) || null;
  }, [enrichedClients, selectedClientId]);

  useEffect(() => {
    if (!selectedClientId && filteredClients.length > 0) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, selectedClientId]);

  if (loading) {
    return (
      <div className="registrar-clients">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Клієнти' : 'Clients'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-clients">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Клієнти' : 'Clients'}
      </h1>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      <div className="registrar-workspace">
        <section className="workspace-main">
          <div className="search-bar">
            <input
              type="text"
              placeholder={
                lang === 'UA'
                  ? "Пошук за ім'ям, телефоном або email"
                  : 'Search by name, phone or email'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="clients-grid">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  type="button"
                  key={client.id}
                  className={`client-card ${
                    selectedClientId === client.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <h3>{client.fullName}</h3>

                  <p>
                    <strong>{lang === 'UA' ? 'Телефон' : 'Phone'}:</strong>{' '}
                    {client.phoneLabel || '—'}
                  </p>

                  <p>
                    <strong>Email:</strong> {client.emailLabel || '—'}
                  </p>

                  <p>
                    <strong>{lang === 'UA' ? 'Мова' : 'Language'}:</strong>{' '}
                    {client.languageLabel}
                  </p>

                  <p>
                    <strong>{lang === 'UA' ? 'Записів' : 'Appointments'}:</strong>{' '}
                    {client.appointmentsCount}
                  </p>

                  {client.lastAppointment && (
                    <p className="table-subtext">
                      {lang === 'UA' ? 'Останній запис:' : 'Last appointment:'}{' '}
                      {client.lastAppointment.date} • {client.lastAppointment.time}
                    </p>
                  )}
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
          </div>
        </section>

        <aside className="workspace-side">
          {selectedClient ? (
            <div className="appointment-detail-card">
              <h2>{selectedClient.fullName}</h2>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Телефон' : 'Phone'}:
                </span>
                <span className="info-value">{selectedClient.phoneLabel || '—'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{selectedClient.emailLabel || '—'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Мова' : 'Language'}:
                </span>
                <span className="info-value">{selectedClient.languageLabel}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Часовий пояс' : 'Timezone'}:
                </span>
                <span className="info-value">
                  {selectedClient.timezone || 'Europe/Kiev'}
                </span>
              </div>

              <h3>{lang === 'UA' ? 'Історія записів' : 'Appointment history'}</h3>

              {selectedClient.appointments.length > 0 ? (
                <div className="client-history">
                  {selectedClient.appointments.map((appointment) => (
                    <div key={appointment.id} className="history-item">
                      <strong>
                        {appointment.date} • {appointment.time}
                      </strong>

                      <span className={`status-badge status-${normalizeStatusClass(appointment.status)}`}>
                        {getStatusLabel(appointment.status, lang)}
                      </span>

                      <p>
                        <strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong>{' '}
                        {appointment.serviceName || '—'}
                      </p>

                      <p>
                        <strong>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}:</strong>{' '}
                        {appointment.specialistName || '—'}
                      </p>

                      <p>
                        <strong>{lang === 'UA' ? 'Локація' : 'Location'}:</strong>{' '}
                        {appointment.locationName || '—'}
                      </p>

                      {appointment.client_notes && (
                        <p>
                          <strong>
                            {lang === 'UA' ? 'Коментар клієнта' : 'Client notes'}:
                          </strong>{' '}
                          {appointment.client_notes}
                        </p>
                      )}

                      {appointment.registrar_notes && (
                        <p>
                          <strong>
                            {lang === 'UA'
                              ? 'Нотатка реєстратора'
                              : 'Registrar note'}
                            :
                          </strong>{' '}
                          {appointment.registrar_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>
                    {lang === 'UA'
                      ? 'У клієнта ще немає записів'
                      : 'This client has no appointments yet'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Оберіть клієнта'
                  : 'Select a client'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Clients;