import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/admin-dashboard.css';

const todayString = () => new Date().toISOString().split('T')[0];

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
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

const Dashboard = () => {
  const { lang } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setPageError('');

      const [
        appointmentsResponse,
        servicesResponse,
        specialistsResponse,
        locationsResponse,
        profilesResponse,
        auditLogsResponse,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false }),

        supabase
          .from('services')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('specialists')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('locations')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('profiles')
          .select('*'),

        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (appointmentsResponse.error) throw appointmentsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (specialistsResponse.error) throw specialistsResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      if (auditLogsResponse.error) {
        console.warn('Audit logs loading failed:', auditLogsResponse.error);
      }

      setAppointments(appointmentsResponse.data || []);
      setServices(servicesResponse.data || []);
      setSpecialists(specialistsResponse.data || []);
      setLocations(locationsResponse.data || []);
      setProfiles(profilesResponse.data || []);
      setAuditLogs(auditLogsResponse.data || []);
    } catch (error) {
      console.error('Admin dashboard loading failed:', error);

      setPageError(
        lang === 'UA'
          ? `Не вдалося завантажити дашборд: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load dashboard: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((item) => item.id === appointment.service_id);
      const specialist = specialists.find((item) => item.id === appointment.specialist_id);
      const location = locations.find((item) => item.id === appointment.location_id);
      const client = profiles.find((item) => item.id === appointment.client_id);

      return {
        ...appointment,
        date: appointment.appointment_date,
        time: String(appointment.appointment_time || '').slice(0, 5),
        serviceName: getServiceName(service, lang),
        specialistName: specialist?.name || '',
        locationName:
          lang === 'UA'
            ? location?.name_ua || location?.name || ''
            : location?.name_en || location?.name_ua || location?.name || '',
        clientName: client?.full_name || client?.email || 'Клієнт',
      };
    });
  }, [appointments, services, specialists, locations, profiles, lang]);

  const stats = useMemo(() => {
    const today = todayString();
    const weekAgo = getDateDaysAgo(7);

    const todayAppointments = appointments.filter(
      (appointment) => appointment.appointment_date === today
    ).length;

    const pendingAppointments = appointments.filter(
      (appointment) => appointment.status === 'pending'
    ).length;

    const confirmedAppointments = appointments.filter(
      (appointment) => appointment.status === 'confirmed'
    ).length;

    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === 'completed'
    ).length;

    const recentAppointments = appointments.filter(
      (appointment) => appointment.appointment_date >= weekAgo
    );

    const cancelledRecent = recentAppointments.filter(
      (appointment) =>
        appointment.status === 'cancelled' || appointment.status === 'canceled'
    ).length;

    const cancellationRate = recentAppointments.length
      ? Math.round((cancelledRecent / recentAppointments.length) * 100)
      : 0;

    const activeSpecialists = specialists.filter(
      (specialist) => specialist.is_active !== false
    ).length;

    const specialistLoad = activeSpecialists
      ? Math.round((appointments.length / activeSpecialists) * 10) / 10
      : 0;

    const clientsCount = profiles.filter((profile) => profile.role === 'client').length;

    return {
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancellationRate,
      specialistLoad,
      clientsCount,
      specialistsCount: specialists.length,
      servicesCount: services.length,
      locationsCount: locations.length,
    };
  }, [appointments, profiles, specialists, services, locations]);

  const topServices = useMemo(() => {
    const counts = appointments.reduce((acc, appointment) => {
      if (!appointment.service_id) return acc;

      acc[appointment.service_id] = (acc[appointment.service_id] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([serviceId, count]) => {
        const service = services.find((item) => item.id === Number(serviceId));

        return {
          id: Number(serviceId),
          name: getServiceName(service, lang) || `#${serviceId}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments, services, lang]);

  const appointmentsByDay = useMemo(() => {
    const result = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = getDateDaysAgo(i);

      result.push({
        date,
        label: new Date(`${date}T00:00:00`).toLocaleDateString(
          lang === 'UA' ? 'uk-UA' : 'en-US',
          {
            day: '2-digit',
            month: '2-digit',
          }
        ),
        count: appointments.filter((appointment) => appointment.appointment_date === date).length,
      });
    }

    return result;
  }, [appointments, lang]);

  const maxDayCount = useMemo(() => {
    return Math.max(...appointmentsByDay.map((item) => item.count), 1);
  }, [appointmentsByDay]);

  const recentAppointments = useMemo(() => {
    return enrichedAppointments.slice(0, 8);
  }, [enrichedAppointments]);

  const recentActivity = useMemo(() => {
    if (auditLogs.length > 0) {
      return auditLogs.map((log) => ({
        id: log.id,
        time: log.created_at
          ? new Date(log.created_at).toLocaleTimeString(lang === 'UA' ? 'uk-UA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        user: log.user_email || log.user_id || '—',
        action: log.action || '—',
        object: log.entity || log.table_name || log.record_id || '—',
      }));
    }

    return recentAppointments.slice(0, 5).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      time: appointment.time,
      user: appointment.clientName,
      action:
        lang === 'UA'
          ? `Запис: ${getStatusLabel(appointment.status, lang)}`
          : `Appointment: ${getStatusLabel(appointment.status, lang)}`,
      object: appointment.serviceName || `#${appointment.id}`,
    }));
  }, [auditLogs, recentAppointments, lang]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Панель керування' : 'Dashboard'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Панель керування' : 'Dashboard'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadDashboard}>
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
          <div className="stat-label">
            {lang === 'UA' ? 'Записів сьогодні' : "Today's appointments"}
          </div>
          <div className="stat-value">{stats.todayAppointments}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Очікують підтвердження' : 'Pending appointments'}
          </div>
          <div className="stat-value">{stats.pendingAppointments}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Завершені записи' : 'Completed appointments'}
          </div>
          <div className="stat-value">{stats.completedAppointments}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Скасувань за 7 днів' : 'Cancellations in 7 days'}
          </div>
          <div className="stat-value">{stats.cancellationRate}%</div>
        </div>
      </div>

      <div className="stats-grid admin-secondary-stats">
        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Клієнти' : 'Clients'}
          </div>
          <div className="stat-value">{stats.clientsCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Спеціалісти' : 'Specialists'}
          </div>
          <div className="stat-value">{stats.specialistsCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Послуги' : 'Services'}
          </div>
          <div className="stat-value">{stats.servicesCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Локації' : 'Locations'}
          </div>
          <div className="stat-value">{stats.locationsCount}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h2>{lang === 'UA' ? 'Записи за останні 7 днів' : 'Appointments in last 7 days'}</h2>

          <div className="simple-bar-chart">
            {appointmentsByDay.map((day) => (
              <div key={day.date} className="bar-item">
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${Math.max((day.count / maxDayCount) * 100, day.count > 0 ? 8 : 0)}%`,
                    }}
                  />
                </div>

                <span className="bar-count">{day.count}</span>
                <span className="bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="top-services-card">
          <h2>{lang === 'UA' ? 'ТОП послуги' : 'Top services'}</h2>

          {topServices.length > 0 ? (
            <ul className="top-services-list">
              {topServices.map((service) => (
                <li key={service.id}>
                  <span className="service-name">{service.name}</span>
                  <span className="service-count">{service.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>{lang === 'UA' ? 'Ще немає записів' : 'No appointments yet'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="recent-appointments">
        <div className="section-header-row">
          <h2>{lang === 'UA' ? 'Останні записи' : 'Recent appointments'}</h2>
        </div>

        {recentAppointments.length > 0 ? (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
                <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                <th>{lang === 'UA' ? 'Клієнт' : 'Client'}</th>
                <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                <th>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
              </tr>
            </thead>

            <tbody>
              {recentAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.clientName}</td>
                  <td>{appointment.serviceName || '—'}</td>
                  <td>{appointment.specialistName || '—'}</td>
                  <td>
                    <span className={`status-badge status-${normalizeStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status, lang)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{lang === 'UA' ? 'Записів ще немає' : 'No appointments yet'}</p>
          </div>
        )}
      </div>

      <div className="recent-activity">
        <h2>{lang === 'UA' ? 'Останні події' : 'Recent activity'}</h2>

        {recentActivity.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                <th>{lang === 'UA' ? 'Користувач' : 'User'}</th>
                <th>{lang === 'UA' ? 'Дія' : 'Action'}</th>
                <th>{lang === 'UA' ? "Об'єкт" : 'Object'}</th>
              </tr>
            </thead>

            <tbody>
              {recentActivity.map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td>{item.user}</td>
                  <td>{item.action}</td>
                  <td>{item.object}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{lang === 'UA' ? 'Подій ще немає' : 'No activity yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;