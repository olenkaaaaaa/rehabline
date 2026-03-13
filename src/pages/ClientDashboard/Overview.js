import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointments, services, specialists, locations, reviews } from '../../data/mockData';

const Overview = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const clientId = user?.id || 1;

  const clientAppointments = useMemo(() => {
    return appointments
      .filter(app => app.clientId === clientId)
      .map(app => {
        const service = services.find(s => s.id === app.serviceId);
        const specialist = specialists.find(s => s.id === app.specialistId);
        const location = locations.find(l => l.id === app.locationId);
        return {
          ...app,
          serviceName: service?.name[lang] || '',
          specialistName: specialist?.name || '',
          locationName: location?.name[lang] || '',
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [clientId, lang]);

  const nextAppointment = clientAppointments.find(app => app.status !== 'cancelled' && app.status !== 'completed');
  const thisMonthAppointments = clientAppointments.filter(app => {
    const appDate = new Date(app.date);
    const now = new Date();
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
  }).length;

  const recentReviews = useMemo(() => {
    return reviews
      .filter(r => r.clientId === clientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [clientId]);

  const notifications = [
    { id: 1, type: 'reminder', message: { UA: 'Візит 10.02 о 09:00 підтверджено.', EN: 'Appointment 10.02 at 09:00 confirmed.' } },
    { id: 2, type: 'documents', message: { UA: 'Не забудьте взяти результати МРТ (за наявності).', EN: 'Don\'t forget to bring MRI results (if available).' } },
    { id: 3, type: 'tip', message: { UA: 'Пийте воду після масажу - це допоможе відновленню.', EN: 'Drink water after massage - it helps recovery.' } },
  ];

  return (
    <div className="overview">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Огляд' : 'Overview'}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Найближчий візит' : 'Next visit'}</div>
          <div className="stat-value">
            {nextAppointment ? (
              <Link to={`/client/records/${nextAppointment.id}`}>
                {new Date(nextAppointment.date).toLocaleDateString(lang === 'UA' ? 'uk-UA' : 'en-US', { day: '2-digit', month: '2-digit' })} • {nextAppointment.time}
              </Link>
            ) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Записів цього місяця' : 'Appointments this month'}</div>
          <div className="stat-value">{thisMonthAppointments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{lang === 'UA' ? 'Нагадування увімкнено' : 'Reminders enabled'}</div>
          <div className="stat-value">Email + SMS</div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="notifications-section">
          <h2>{lang === 'UA' ? 'Повідомлення' : 'Notifications'}</h2>
          <div className="notifications-list">
            {notifications.map(n => (
              <div key={n.id} className={`notification-item notification-${n.type}`}>
                <div className="notification-icon">
                  {n.type === 'reminder' && '🔔'}
                  {n.type === 'documents' && '📄'}
                  {n.type === 'tip' && '💡'}
                </div>
                <div className="notification-message">{n.message[lang]}</div>
              </div>
            ))}
          </div>
        </div>

        {recentReviews.length > 0 && (
          <div className="recent-reviews-section">
            <h2>{lang === 'UA' ? 'Останні відгуки' : 'Recent Reviews'}</h2>
            <div className="reviews-list">
              {recentReviews.map(review => (
                <div key={review.id} className="review-mini">
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`star ${i < review.rating ? 'active' : ''}`}>⭐</span>
                    ))}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">{review.date}</span>
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
        <h2>{lang === 'UA' ? 'Останні записи' : 'Recent appointments'}</h2>
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
            {clientAppointments.slice(0, 5).map(app => (
              <tr key={app.id}>
                <td>{app.date}</td>
                <td>{app.time}</td>
                <td>{app.serviceName}</td>
                <td>{app.locationName}</td>
                <td>
                  <span className={`status-badge status-${app.status}`}>
                    {app.status === 'confirmed' && (lang === 'UA' ? 'Підтверджено' : 'Confirmed')}
                    {app.status === 'pending' && (lang === 'UA' ? 'Очікує' : 'Pending')}
                    {app.status === 'cancelled' && (lang === 'UA' ? 'Скасовано' : 'Cancelled')}
                    {app.status === 'completed' && (lang === 'UA' ? 'Завершено' : 'Completed')}
                  </span>
                </td>
                <td>
                  <Link to={`/client/records/${app.id}`} className="btn-link">
                    {lang === 'UA' ? 'Деталі' : 'Details'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Overview;