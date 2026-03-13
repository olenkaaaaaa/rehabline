import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointments, services, specialists, locations, reviews as mockReviews } from '../../data/mockData';
import ReviewModal from '../../components/ReviewModal';
import PostVisitSurvey from '../../components/PostVisitSurvey';

const MyRecords = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const clientId = user?.id || 1;

  const [filterMonth, setFilterMonth] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviews, setReviews] = useState(mockReviews);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyAppointment, setSurveyAppointment] = useState(null);

  const enrichedAppointments = useMemo(() => {
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
          duration: service?.duration || 60, // для календаря
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [clientId, lang]);

  const filteredAppointments = filterMonth
    ? enrichedAppointments.filter(app => app.date.startsWith(filterMonth))
    : enrichedAppointments;

  const months = useMemo(() => {
    const set = new Set(enrichedAppointments.map(app => app.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [enrichedAppointments]);

  // Перевірка на нещодавно завершені запити для опитування
  useEffect(() => {
    const completedWithoutSurvey = enrichedAppointments.filter(
      app => app.status === 'completed' && !localStorage.getItem(`survey_${app.id}`)
    );
    if (completedWithoutSurvey.length > 0) {
      setSurveyAppointment(completedWithoutSurvey[0]);
      setShowSurvey(true);
    }
  }, [enrichedAppointments]);

  // Функція для створення посилання на Google Calendar
  const getGoogleCalendarUrl = (appointment) => {
    const start = new Date(`${appointment.date}T${appointment.time}:00`);
    const durationMinutes = parseInt(appointment.duration) || 60;
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: appointment.serviceName,
      details: `Запис до ${appointment.specialistName}`,
      location: appointment.locationName,
      dates: `${formatDate(start)}/${formatDate(end)}`,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  };

  // Експорт ICS
  const exportICS = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RehabLine//EN\n';
    filteredAppointments.forEach(app => {
      const dateStr = app.date.replace(/-/g, '');
      const start = `${dateStr}T${app.time.replace(':', '')}00`;
      const durationMinutes = parseInt(app.duration) || 60;
      const endTime = new Date(`1970-01-01T${app.time}:00`);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      const endHour = endTime.getHours().toString().padStart(2, '0');
      const endMin = endTime.getMinutes().toString().padStart(2, '0');
      const end = `${dateStr}T${endHour}${endMin}00`;
      icsContent += `BEGIN:VEVENT\nUID:${app.id}@rehabline\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${app.serviceName}\nLOCATION:${app.locationName}\nEND:VEVENT\n`;
    });
    icsContent += 'END:VCALENDAR';
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openReviewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
  };

  const submitReview = (reviewData) => {
    const newReview = {
      id: reviews.length + 1,
      clientId: clientId,
      specialistId: selectedAppointment.specialistId,
      appointmentId: selectedAppointment.id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      isAnonymous: reviewData.isAnonymous,
      date: new Date().toISOString().split('T')[0],
      clientName: reviewData.isAnonymous ? 'Анонім' : user?.name || 'Клієнт',
    };
    setReviews([...reviews, newReview]);
    console.log('Review submitted:', newReview);
  };

  const handleSurveySubmit = (data) => {
    console.log('Survey submitted:', data);
    localStorage.setItem(`survey_${data.appointmentId}`, 'done');
    setShowSurvey(false);
  };

  return (
    <div className="my-records">
      <div className="records-header">
        <h1 className="dashboard-title">{lang === 'UA' ? 'Мої записи' : 'My Records'}</h1>
        <div className="records-actions">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">{lang === 'UA' ? 'Усі' : 'All'}</option>
            {months.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString(lang === 'UA' ? 'uk-UA' : 'en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
          <button className="btn-outline" onClick={exportICS}>
            {lang === 'UA' ? 'Експорт ICS' : 'Export ICS'}
          </button>
        </div>
      </div>

      <table className="appointments-table">
        <thead>
          <tr>
            <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
            <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
            <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
            <th>{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}</th>
            <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
            <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredAppointments.map(app => {
            const hasReview = reviews.some(r => r.appointmentId === app.id);
            return (
              <tr key={app.id}>
                <td>{app.date}</td>
                <td>{app.time}</td>
                <td>{app.serviceName}</td>
                <td>{app.specialistName}</td>
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
                  {app.status === 'completed' && !hasReview && (
                    <button onClick={() => openReviewModal(app)} className="btn-link" style={{ marginLeft: '10px' }}>
                      {lang === 'UA' ? 'Відгук' : 'Review'}
                    </button>
                  )}
                  {/* Кнопка Google Calendar для майбутніх записів */}
                  {app.status !== 'cancelled' && app.status !== 'completed' && (
                    <a
                      href={getGoogleCalendarUrl(app)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                      style={{ marginLeft: '10px' }}
                    >
                      📅 Google
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredAppointments.length === 0 && (
        <p className="no-data">{lang === 'UA' ? 'Немає записів' : 'No appointments'}</p>
      )}

      {selectedAppointment && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          appointment={selectedAppointment}
          onSubmit={submitReview}
        />
      )}

      {showSurvey && surveyAppointment && (
        <PostVisitSurvey
          appointment={surveyAppointment}
          onClose={() => setShowSurvey(false)}
          onSubmit={handleSurveySubmit}
        />
      )}
    </div>
  );
};

export default MyRecords;