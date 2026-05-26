import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/client-overview.css';

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
    cancelled: { UA: 'Скасовано', EN: 'Cancelled' },
    canceled: { UA: 'Скасовано', EN: 'Cancelled' },
    completed: { UA: 'Завершено', EN: 'Completed' },
  };

  return labels[status]?.[lang] || status || '—';
};

const normalizeStatusClass = (status) => {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
};

const Overview = () => {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const [
          appointmentsResponse,
          servicesResponse,
          specialistsResponse,
          locationsResponse,
          reviewsResponse,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('client_id', user.id)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false }),

          supabase.from('services').select('*'),

          supabase.from('specialists').select('*'),

          supabase.from('locations').select('*'),

          supabase
            .from('reviews')
            .select('*')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;

        if (reviewsResponse.error) {
          console.warn('Reviews loading failed:', reviewsResponse.error);
        }

        if (!isMounted) return;

        setAppointments(appointmentsResponse.data || []);
        setServices(servicesResponse.data || []);
        setSpecialists(specialistsResponse.data || []);
        setLocations(locationsResponse.data || []);
        setReviews(reviewsResponse.data || []);
      } catch (error) {
        console.error('Overview loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити дані кабінету'
            : 'Failed to load dashboard data'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const clientAppointments = useMemo(() => {
    return appointments
      .map((appointment) => {
        const service = services.find((item) => item.id === appointment.service_id);
        const specialist = specialists.find((item) => item.id === appointment.specialist_id);
        const location = locations.find((item) => item.id === appointment.location_id);

        return {
          ...appointment,
          date: appointment.appointment_date,
          time: String(appointment.appointment_time || '').slice(0, 5),
          serviceName: getServiceName(service, lang),
          specialistName: specialist?.name || '',
          locationName: getLocationName(location, lang),
        };
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();

        return dateB - dateA;
      });
  }, [appointments, services, specialists, locations, lang]);

  const nextAppointment = useMemo(() => {
    const now = Date.now();

    return clientAppointments
      .filter((appointment) => {
        if (
          appointment.status === 'cancelled' ||
          appointment.status === 'canceled' ||
          appointment.status === 'completed'
        ) {
          return false;
        }

        const appointmentTime = new Date(
          `${appointment.date}T${appointment.time || '00:00'}:00`
        ).getTime();

        return appointmentTime >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();

        return dateA - dateB;
      })[0];
  }, [clientAppointments]);

  const thisMonthAppointments = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return clientAppointments.filter((appointment) => {
      if (!appointment.date) return false;

      const appointmentDate = new Date(`${appointment.date}T00:00:00`);

      return (
        appointmentDate.getMonth() === currentMonth &&
        appointmentDate.getFullYear() === currentYear
      );
    }).length;
  }, [clientAppointments]);

  const activeAppointmentsCount = useMemo(() => {
    return clientAppointments.filter((appointment) => {
      return appointment.status === 'pending' || appointment.status === 'confirmed';
    }).length;
  }, [clientAppointments]);

  const completedAppointmentsCount = useMemo(() => {
    return clientAppointments.filter((appointment) => appointment.status === 'completed').length;
  }, [clientAppointments]);

  const recentAppointments = useMemo(() => {
    return clientAppointments.slice(0, 5);
  }, [clientAppointments]);

  const notifications = useMemo(() => {
    const result = [];

    if (nextAppointment) {
      result.push({
        id: 'next-appointment',
        type: 'reminder',
        icon: '🔔',
        message:
          lang === 'UA'
            ? `Найближчий візит: ${nextAppointment.date} о ${nextAppointment.time}.`
            : `Next visit: ${nextAppointment.date} at ${nextAppointment.time}.`,
      });
    }

    if (activeAppointmentsCount > 0) {
      result.push({
        id: 'active-appointments',
        type: 'documents',
        icon: '📄',
        message:
          lang === 'UA'
            ? 'Перед візитом перевірте адресу локації та візьміть необхідні документи.'
            : 'Before your visit, check the location address and bring the necessary documents.',
      });
    }

    result.push({
      id: 'tip',
      type: 'tip',
      icon: '💡',
      message:
        lang === 'UA'
          ? 'Після процедури дотримуйтесь рекомендацій спеціаліста.'
          : 'After the procedure, follow the specialist’s recommendations.',
    });

    return result;
  }, [nextAppointment, activeAppointmentsCount, lang]);

  if (loading) {
    return (
      <div className="overview">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Огляд' : 'Overview'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження кабінету...' : 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Огляд' : 'Overview'}
      </h1>

      {profile?.full_name && (
        <p className="dashboard-welcome">
          {lang === 'UA' ? 'Вітаємо, ' : 'Welcome, '}
          <strong>{profile.full_name}</strong>
        </p>
      )}

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Найближчий візит' : 'Next visit'}
          </div>

          <div className="stat-value">
            {nextAppointment ? (
              <Link to={`/client/records/${nextAppointment.id}`}>
                {new Date(`${nextAppointment.date}T00:00:00`).toLocaleDateString(
                  lang === 'UA' ? 'uk-UA' : 'en-US',
                  {
                    day: '2-digit',
                    month: '2-digit',
                  }
                )}{' '}
                • {nextAppointment.time}
              </Link>
            ) : (
              '—'
            )}
          </div>

          {nextAppointment && (
            <div className="stat-sub">
              {nextAppointment.serviceName || '—'}
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Записів цього місяця' : 'Appointments this month'}
          </div>

          <div className="stat-value">{thisMonthAppointments}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Активні записи' : 'Active appointments'}
          </div>

          <div className="stat-value">{activeAppointmentsCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            {lang === 'UA' ? 'Завершені візити' : 'Completed visits'}
          </div>

          <div className="stat-value">{completedAppointmentsCount}</div>
        </div>
      </div>

       <div className="overview-grid">
         {/* <div className="notifications-section">
          <h2>{lang === 'UA' ? 'Повідомлення' : 'Notifications'}</h2>

          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item notification-${notification.type}`}
              >
                <div className="notification-icon">{notification.icon}</div>
                <div className="notification-message">{notification.message}</div>
              </div>
            ))}
          </div>
        </div> */}

        <div className="quick-actions-section">
          <h2>{lang === 'UA' ? 'Швидкі дії' : 'Quick actions'}</h2>

          <div className="quick-actions-list">
            <Link to="/services" className="btn-primary">
              {lang === 'UA' ? 'Новий запис' : 'New appointment'}
            </Link>

            <Link to="/client/records" className="btn-outline">
              {lang === 'UA' ? 'Всі записи' : 'All appointments'}
            </Link>

            <Link to="/client/profile" className="btn-outline">
              {lang === 'UA' ? 'Редагувати профіль' : 'Edit profile'}
            </Link>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="recent-reviews-section">
            <h2>{lang === 'UA' ? 'Останні відгуки' : 'Recent reviews'}</h2>

            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-mini">
                  <div className="review-rating">
                    {'⭐'.repeat(Number(review.rating || 0))}
                  </div>

                  <p className="review-comment">
                    {review.comment || review.text || review.message || '—'}
                  </p>

                  <span className="review-date">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString(
                          lang === 'UA' ? 'uk-UA' : 'en-US'
                        )
                      : ''}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/client/reviews" className="btn-link">
              {lang === 'UA' ? 'Всі відгуки' : 'All reviews'}
            </Link>
          </div>
        )}
      </div>

      <div className="recent-appointments">
        <div className="section-header-row">
          <h2>{lang === 'UA' ? 'Останні записи' : 'Recent appointments'}</h2>

          <Link to="/client/records" className="btn-link">
            {lang === 'UA' ? 'Переглянути всі' : 'View all'}
          </Link>
        </div>

        {recentAppointments.length > 0 ? (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
                <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {recentAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.serviceName || '—'}</td>
                  <td>{appointment.locationName || '—'}</td>
                  <td>
                    <span className={`status-badge status-${normalizeStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status, lang)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/client/records/${appointment.id}`} className="btn-link">
                      {lang === 'UA' ? 'Деталі' : 'Details'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{lang === 'UA' ? 'У вас ще немає записів' : 'You have no appointments yet'}</p>

            <Link to="/services" className="btn-primary">
              {lang === 'UA' ? 'Записатись на послугу' : 'Book a service'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;