import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointments, services, clients } from '../../data/mockData';
import { Link } from 'react-router-dom';

const Appointments = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const specialistId = user?.id || 1;

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const filtered = appointments.filter(app => 
      app.specialistId === specialistId && app.date === selectedDate
    );
    const enriched = filtered.map(app => {
      const service = services.find(s => s.id === app.serviceId);
      const client = clients.find(c => c.id === app.clientId);
      return {
        ...app,
        serviceName: service?.name[lang] || '',
        clientName: client?.name || '',
        clientPhone: client?.phone || '',
        clientBirthDate: client?.birthDate || '',
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
    setDayAppointments(enriched);
  }, [specialistId, selectedDate, lang]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSelectAppointment = (app) => {
    setSelectedAppointment(app);
    setNotes(app.specialistNotes || '');
  };

  const handleSaveNotes = () => {
    if (!selectedAppointment) return;
    // Тут має бути API-виклик для збереження нотаток
    console.log('Saving notes for', selectedAppointment.id, notes);
    alert(lang === 'UA' ? 'Нотатки збережено' : 'Notes saved');
  };

  return (
    <div className="appointments-page">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Записи' : 'Appointments'}</h1>

      <div className="appointments-controls">
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange}
          className="date-picker"
        />
        <button className="btn-outline" onClick={() => window.print()}>
          {lang === 'UA' ? 'Експорт списку' : 'Export list'}
        </button>
      </div>

      <div className="appointments-layout">
        <div className="appointments-list">
          {dayAppointments.length === 0 ? (
            <p className="no-data">{lang === 'UA' ? 'Немає записів на цей день' : 'No appointments for this day'}</p>
          ) : (
            dayAppointments.map(app => (
              <div 
                key={app.id} 
                className={`appointment-card ${selectedAppointment?.id === app.id ? 'selected' : ''}`}
                onClick={() => handleSelectAppointment(app)}
              >
                <div className="appointment-time">{app.time}</div>
                <div className="appointment-service">{app.serviceName}</div>
                <div className="appointment-client">{app.clientName}</div>
                <div className="appointment-status">
                  <span className={`status-badge status-${app.status}`}>
                    {app.status === 'confirmed' && (lang === 'UA' ? 'Підтверджено' : 'Confirmed')}
                    {app.status === 'pending' && (lang === 'UA' ? 'Очікує' : 'Pending')}
                    {app.status === 'cancelled' && (lang === 'UA' ? 'Скасовано' : 'Cancelled')}
                    {app.status === 'completed' && (lang === 'UA' ? 'Завершено' : 'Completed')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedAppointment && (
          <div className="appointment-details">
            <h2>{lang === 'UA' ? 'Деталі запису' : 'Appointment details'}</h2>
            <div className="details-section">
              <p><strong>{lang === 'UA' ? 'Клієнт' : 'Client'}:</strong> {selectedAppointment.clientName}</p>
              <p><strong>{lang === 'UA' ? 'Телефон' : 'Phone'}:</strong> {selectedAppointment.clientPhone}</p>
              {selectedAppointment.clientBirthDate && (
                <p><strong>{lang === 'UA' ? 'Рік народження' : 'Birth year'}:</strong> {selectedAppointment.clientBirthDate.split('-')[0]}</p>
              )}
              <p><strong>{lang === 'UA' ? 'Послуга' : 'Service'}:</strong> {selectedAppointment.serviceName}</p>
              <p><strong>{lang === 'UA' ? 'Час' : 'Time'}:</strong> {selectedAppointment.time}</p>
              {selectedAppointment.clientNotes && (
                <p><strong>{lang === 'UA' ? 'Коментар клієнта' : 'Client notes'}:</strong> {selectedAppointment.clientNotes}</p>
              )}
            </div>

            <div className="notes-section">
              <h3>{lang === 'UA' ? 'Нотатки прийому (внутр.)' : 'Internal notes'}</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="5"
                placeholder={lang === 'UA' ? 'Додайте нотатки...' : 'Add notes...'}
              />
              <div className="notes-actions">
                <button className="btn-primary" onClick={handleSaveNotes}>
                  {lang === 'UA' ? 'Зберегти' : 'Save'}
                </button>
                <button className="btn-outline" onClick={() => setSelectedAppointment(null)}>
                  {lang === 'UA' ? 'Закрити' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;