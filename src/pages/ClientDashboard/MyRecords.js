import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/client-records.css';

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
    pending: {
      UA: 'Очікує',
      EN: 'Pending',
    },
    confirmed: {
      UA: 'Підтверджено',
      EN: 'Confirmed',
    },
    cancelled: {
      UA: 'Скасовано',
      EN: 'Cancelled',
    },
    canceled: {
      UA: 'Скасовано',
      EN: 'Cancelled',
    },
    completed: {
      UA: 'Завершено',
      EN: 'Completed',
    },
  };

  return labels[status]?.[lang] || status;
};

const normalizeStatusClass = (status) => {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
};

const MyRecords = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRecords = async () => {
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

          supabase
            .from('services')
            .select('*'),

          supabase
            .from('specialists')
            .select('*'),

          supabase
            .from('locations')
            .select('*'),

          supabase
            .from('reviews')
            .select('*')
            .eq('client_id', user.id),
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
        console.error('My records loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити ваші записи'
            : 'Failed to load your appointments'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((item) => item.id === appointment.service_id);
      const specialist = specialists.find((item) => item.id === appointment.specialist_id);
      const location = locations.find((item) => item.id === appointment.location_id);

      return {
        ...appointment,
        date: appointment.appointment_date,
        time: String(appointment.appointment_time || '').slice(0, 5),
        service,
        specialist,
        location,
        serviceName: getServiceName(service, lang),
        specialistName: specialist?.name || '',
        locationName: getLocationName(location, lang),
        duration: service?.duration_minutes || 45,
      };
    });
  }, [appointments, services, specialists, locations, lang]);

  const months = useMemo(() => {
    const uniqueMonths = new Set(
      enrichedAppointments
        .map((appointment) => appointment.date?.slice(0, 7))
        .filter(Boolean)
    );

    return Array.from(uniqueMonths).sort().reverse();
  }, [enrichedAppointments]);

  const filteredAppointments = useMemo(() => {
    return enrichedAppointments.filter((appointment) => {
      const matchesMonth = !filterMonth || appointment.date?.startsWith(filterMonth);
      const matchesStatus = !filterStatus || appointment.status === filterStatus;

      return matchesMonth && matchesStatus;
    });
  }, [enrichedAppointments, filterMonth, filterStatus]);

  const getGoogleCalendarUrl = (appointment) => {
    const start = new Date(`${appointment.date}T${appointment.time}:00`);
    const end = new Date(start);

    end.setMinutes(end.getMinutes() + Number(appointment.duration || 45));

    const formatForGoogle = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const text = encodeURIComponent(
      `${lang === 'UA' ? 'Візит RehabLine' : 'RehabLine appointment'}: ${appointment.serviceName}`
    );

    const details = encodeURIComponent(
      `${lang === 'UA' ? 'Спеціаліст' : 'Specialist'}: ${appointment.specialistName}`
    );

    const location = encodeURIComponent(appointment.locationName || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatForGoogle(start)}/${formatForGoogle(end)}&details=${details}&location=${location}`;
  };

  const exportICS = () => {
    if (filteredAppointments.length === 0) {
      alert(lang === 'UA' ? 'Немає записів для експорту' : 'No appointments to export');
      return;
    }

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RehabLine//EN\n';

    filteredAppointments.forEach((appointment) => {
      const dateStr = appointment.date.replace(/-/g, '');
      const start = `${dateStr}T${appointment.time.replace(':', '')}00`;

      const endDate = new Date(`1970-01-01T${appointment.time}:00`);
      endDate.setMinutes(endDate.getMinutes() + Number(appointment.duration || 45));

      const endHour = String(endDate.getHours()).padStart(2, '0');
      const endMin = String(endDate.getMinutes()).padStart(2, '0');
      const end = `${dateStr}T${endHour}${endMin}00`;

      icsContent += `BEGIN:VEVENT\nUID:${appointment.id}@rehabline\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${appointment.serviceName}\nLOCATION:${appointment.locationName}\nDESCRIPTION:Specialist: ${appointment.specialistName}\nEND:VEVENT\n`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'rehabline-appointments.ics';
    link.click();

    URL.revokeObjectURL(url);
  };

  const cancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Ви точно хочете скасувати цей запис?'
        : 'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
        })
        .eq('id', appointmentId)
        .eq('client_id', user.id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                status: 'cancelled',
              }
            : appointment
        )
      );
    } catch (error) {
      console.error('Cancel appointment failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося скасувати запис'
          : 'Failed to cancel appointment'
      );
    }
  };

  if (loading) {
    return (
      <div className="my-records">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мої записи' : 'My Records'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження записів...' : 'Loading appointments...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-records">
      <div className="records-header">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мої записи' : 'My Records'}
        </h1>

        <div className="records-actions">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">{lang === 'UA' ? 'Усі місяці' : 'All months'}</option>

            {months.map((month) => (
              <option key={month} value={month}>
                {new Date(`${month}-01`).toLocaleDateString(
                  lang === 'UA' ? 'uk-UA' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                  }
                )}
              </option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">{lang === 'UA' ? 'Усі статуси' : 'All statuses'}</option>
            <option value="pending">{lang === 'UA' ? 'Очікує' : 'Pending'}</option>
            <option value="confirmed">{lang === 'UA' ? 'Підтверджено' : 'Confirmed'}</option>
            <option value="completed">{lang === 'UA' ? 'Завершено' : 'Completed'}</option>
            <option value="cancelled">{lang === 'UA' ? 'Скасовано' : 'Cancelled'}</option>
          </select>

          <button className="btn-outline" onClick={exportICS}>
            {lang === 'UA' ? 'Експорт ICS' : 'Export ICS'}
          </button>
        </div>
      </div>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      {filteredAppointments.length > 0 ? (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
              <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
              <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
              <th>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</th>
              <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
              <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
              <th>{lang === 'UA' ? 'Дії' : 'Actions'}</th>
            </tr>
          </thead>

          <tbody>
            {filteredAppointments.map((appointment) => {
              const hasReview = reviews.some(
                (review) =>
                  review.appointment_id === appointment.id ||
                  review.appointmentId === appointment.id
              );

              const canCancel =
                appointment.status === 'pending' || appointment.status === 'confirmed';

              const canReview = appointment.status === 'completed' && !hasReview;

              return (
                <tr key={appointment.id}>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.serviceName || '—'}</td>
                  <td>{appointment.specialistName || '—'}</td>
                  <td>{appointment.locationName || '—'}</td>
                  <td>
                    <span className={`status-badge status-${normalizeStatusClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status, lang)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/client/records/${appointment.id}`} className="btn-link">
                        {lang === 'UA' ? 'Деталі' : 'Details'}
                      </Link>

                      {canCancel && (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => cancelAppointment(appointment.id)}
                        >
                          {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                        </button>
                      )}

                      {appointment.status !== 'cancelled' &&
                        appointment.status !== 'canceled' &&
                        appointment.status !== 'completed' && (
                          <a
                            href={getGoogleCalendarUrl(appointment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link"
                          >
                            📅 Google
                          </a>
                        )}

                      {canReview && (
                        <Link
                          to={`/client/reviews?appointment=${appointment.id}`}
                          className="btn-link"
                        >
                          {lang === 'UA' ? 'Відгук' : 'Review'}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <p>{lang === 'UA' ? 'Немає записів' : 'No appointments'}</p>

          <Link to="/services" className="btn-primary">
            {lang === 'UA' ? 'Записатись на послугу' : 'Book a service'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRecords;