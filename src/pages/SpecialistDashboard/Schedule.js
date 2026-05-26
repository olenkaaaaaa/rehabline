import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/specialist-schedule.css';

const todayString = () => new Date().toISOString().split('T')[0];

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

const Schedule = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const { data: specialistData, error: specialistError } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (specialistError) throw specialistError;

        if (!specialistData) {
          throw new Error(
            lang === 'UA'
              ? 'Ваш акаунт не прив’язаний до спеціаліста'
              : 'Your account is not linked to a specialist'
          );
        }

        const [
          appointmentsResponse,
          servicesResponse,
          locationsResponse,
          profilesResponse,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('specialist_id', specialistData.id)
            .eq('appointment_date', todayString())
            .order('appointment_time', { ascending: true }),

          supabase.from('services').select('*'),
          supabase.from('locations').select('*'),
          supabase.from('profiles').select('*'),
        ]);

        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;

        if (profilesResponse.error) {
          console.warn('Profiles loading failed:', profilesResponse.error);
        }

        if (!isMounted) return;

        setSpecialist(specialistData);
        setAppointments(appointmentsResponse.data || []);
        setServices(servicesResponse.data || []);
        setLocations(locationsResponse.data || []);
        setProfiles(profilesResponse.data || []);
      } catch (error) {
        console.error('Specialist overview loading failed:', error);

        if (!isMounted) return;

        setPageError(error.message || (lang === 'UA'
          ? 'Не вдалося завантажити кабінет спеціаліста'
          : 'Failed to load specialist dashboard'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((item) => item.id === appointment.service_id);
      const location = locations.find((item) => item.id === appointment.location_id);
      const client = profiles.find((item) => item.id === appointment.client_id);

      return {
        ...appointment,
        time: String(appointment.appointment_time || '').slice(0, 5),
        serviceName: getServiceName(service, lang),
        locationName: getLocationName(location, lang),
        clientName: client?.full_name || client?.name || 'Клієнт',
        clientPhone: client?.phone || '',
      };
    });
  }, [appointments, services, locations, profiles, lang]);

  const stats = useMemo(() => {
    return {
      today: appointments.length,
      pending: appointments.filter((item) => item.status === 'pending').length,
      confirmed: appointments.filter((item) => item.status === 'confirmed').length,
      completed: appointments.filter((item) => item.status === 'completed').length,
    };
  }, [appointments]);

  if (loading) {
    return (
      <div className="specialist-overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="specialist-overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-overview">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Кабінет спеціаліста' : 'Specialist dashboard'}
      </h1>

      {specialist && (
        <p className="dashboard-welcome">
          {lang === 'UA' ? 'Вітаємо, ' : 'Welcome, '}
          <strong>{specialist.name}</strong>
        </p>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Сьогодні записів' : 'Today appointments'}
          </div>
          <div className="stat-value">{stats.today}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Очікують' : 'Pending'}
          </div>
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

      <div className="recent-appointments">
        <div className="section-header-row">
          <h2>{lang === 'UA' ? 'Записи на сьогодні' : 'Today schedule'}</h2>

          <Link to="/specialist/appointments" className="btn-link">
            {lang === 'UA' ? 'Всі записи' : 'All appointments'}
          </Link>
        </div>

        {enrichedAppointments.length > 0 ? (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                <th>{lang === 'UA' ? 'Клієнт' : 'Client'}</th>
                <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {enrichedAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.time}</td>
                  <td>
                    {appointment.clientName}
                    {appointment.clientPhone && (
                      <div className="table-subtext">{appointment.clientPhone}</div>
                    )}
                  </td>
                  <td>{appointment.serviceName || '—'}</td>
                  <td>{appointment.locationName || '—'}</td>
                  <td>
                    <span className={`status-badge status-${normalizeStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status, lang)}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/specialist/appointments?appointment=${appointment.id}`}
                      className="btn-link"
                    >
                      {lang === 'UA' ? 'Відкрити' : 'Open'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'На сьогодні записів немає'
                : 'No appointments for today'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;