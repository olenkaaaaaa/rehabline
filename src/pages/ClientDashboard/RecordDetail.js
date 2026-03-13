import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { appointments, services, specialists, locations, prescriptions } from '../../data/mockData';

const RecordDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [isRescheduling, setIsRescheduling] = useState(false); // для можливого вибору нового часу

  useEffect(() => {
    const app = appointments.find(a => a.id === parseInt(id));
    if (app) {
      const service = services.find(s => s.id === app.serviceId);
      const specialist = specialists.find(s => s.id === app.specialistId);
      const location = locations.find(l => l.id === app.locationId);
      setAppointment({
        ...app,
        serviceName: service?.name[lang] || '',
        specialistName: specialist?.name || '',
        locationName: location?.name[lang] || '',
        locationAddress: location?.address || '',
        duration: service?.duration || 60,
      });
      const relatedPrescriptions = prescriptions.filter(p => p.appointmentId === app.id);
      setPrescriptionsList(relatedPrescriptions);
    }
  }, [id, lang]);

  const getGoogleCalendarUrl = () => {
    if (!appointment) return '#';
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

  // Перевірка, чи запис у майбутньому (можна змінювати)
  const isFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDate = new Date(appointment.date);
    return appDate >= today;
  };

  const handleCancel = () => {
    if (window.confirm(lang === 'UA' ? 'Скасувати запис?' : 'Cancel appointment?')) {
      // Тут має бути API-виклик
      alert(lang === 'UA' ? 'Запис скасовано' : 'Appointment cancelled');
      navigate('/client/records');
    }
  };

  const handleReschedule = () => {
    // Тут можна відкрити модалку з календарем, але для демо просто перейдемо на BookingWizard з параметрами
    navigate(`/booking?specialist=${appointment.specialistId}&service=${appointment.serviceId}&date=${appointment.date}&time=${appointment.time}`);
  };

  if (!appointment) return <div className="loading">{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</div>;

  return (
    <div className="record-detail">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Деталі запису' : 'Appointment details'}
      </h1>

      <div className="record-card">
        <div className="record-status">
          <span className={`status-badge status-${appointment.status}`}>
            {appointment.status === 'confirmed' && (lang === 'UA' ? 'Підтверджено' : 'Confirmed')}
            {appointment.status === 'pending' && (lang === 'UA' ? 'Очікує' : 'Pending')}
            {appointment.status === 'cancelled' && (lang === 'UA' ? 'Скасовано' : 'Cancelled')}
            {appointment.status === 'completed' && (lang === 'UA' ? 'Завершено' : 'Completed')}
          </span>
        </div>

        <div className="record-info-grid">
          <div className="info-row">
            <span className="info-label">{lang === 'UA' ? 'Послуга' : 'Service'}:</span>
            <span className="info-value">{appointment.serviceName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{lang === 'UA' ? 'Дата та час' : 'Date & time'}:</span>
            <span className="info-value">{appointment.date} • {appointment.time}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{lang === 'UA' ? 'Локація' : 'Location'}:</span>
            <span className="info-value">{appointment.locationName}, {appointment.locationAddress}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{lang === 'UA' ? 'Спеціаліст' : 'Specialist'}:</span>
            <span className="info-value">{appointment.specialistName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{lang === 'UA' ? 'Ваш коментар' : 'Your notes'}:</span>
            <span className="info-value">{appointment.clientNotes || '—'}</span>
          </div>
          {appointment.specialistNotes && (
            <div className="info-row specialist-notes">
              <span className="info-label">{lang === 'UA' ? 'Нотатки лікаря' : 'Doctor\'s notes'}:</span>
              <span className="info-value">{appointment.specialistNotes}</span>
            </div>
          )}
        </div>

        {/* План лікування (якщо є) */}
        {appointment.treatmentPlan && (
          <div className="treatment-plan">
            <h3>{lang === 'UA' ? 'План лікування' : 'Treatment plan'}</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(appointment.treatmentPlan.completed / appointment.treatmentPlan.total) * 100}%` }}
              ></div>
            </div>
            <p>
              {lang === 'UA' ? 'Виконано' : 'Completed'}: {appointment.treatmentPlan.completed} / {appointment.treatmentPlan.total}
            </p>
            <ul className="exercises-list">
              {appointment.treatmentPlan.exercises.map((ex, idx) => (
                <li key={idx}>{ex}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Рекомендації (рецепти) */}
        {prescriptionsList.length > 0 && (
          <div className="prescriptions-section">
            <h3>{lang === 'UA' ? 'Рекомендації' : 'Recommendations'}</h3>
            {prescriptionsList.map(p => (
              <div key={p.id} className="prescription-mini">
                <h4>{p.title[lang]}</h4>
                <p>{p.description[lang]}</p>
                {p.fileUrl && (
                  <a href={p.fileUrl} className="btn-link" download>
                    {lang === 'UA' ? 'Завантажити' : 'Download'}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="record-actions">
          <button className="btn-outline" onClick={() => navigate('/client/records')}>
            {lang === 'UA' ? 'Назад' : 'Back'}
          </button>

          {/* Кнопки для майбутніх записів (не скасованих і не завершених) */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && isFuture() && (
            <>
              <button className="btn-outline" onClick={handleReschedule}>
                {lang === 'UA' ? 'Перенести' : 'Reschedule'}
              </button>
              <button className="btn-outline" onClick={handleCancel}>
                {lang === 'UA' ? 'Скасувати' : 'Cancel'}
              </button>
            </>
          )}

          {/* Кнопка Google Calendar (для майбутніх або підтверджених) */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="btn-outline">
              📅 {lang === 'UA' ? 'Google Календар' : 'Google Calendar'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;