import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointments, services, clients } from '../../data/mockData';
import { Link } from 'react-router-dom';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const weekDaysEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Години з 9:00 до 18:00
const hours = Array.from({ length: 10 }, (_, i) => `${i + 9}:00`);

const Schedule = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const specialistId = user?.id || 1; // для демо

  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekAppointments, setWeekAppointments] = useState([]);

  useEffect(() => {
    // Отримуємо початок тижня (понеділок)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Фільтруємо запити спеціаліста на цей тиждень
    const specialistAppointments = appointments.filter(app => 
      app.specialistId === specialistId &&
      new Date(app.date) >= startOfWeek &&
      new Date(app.date) <= endOfWeek
    );

    // Збагачуємо даними
    const enriched = specialistAppointments.map(app => {
      const service = services.find(s => s.id === app.serviceId);
      const client = clients.find(c => c.id === app.clientId);
      return {
        ...app,
        serviceName: service?.name[lang] || '',
        clientName: client?.name || '',
        dayOfWeek: new Date(app.date).getDay(), // 0 = неділя, 1 = понеділок...
      };
    });

    setWeekAppointments(enriched);
  }, [currentDate, specialistId, lang]);

  const goToPreviousWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(lang === 'UA' ? 'uk-UA' : 'en-US', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Отримуємо дні поточного тижня
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const weekDaysList = getWeekDays();

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h1 className="dashboard-title">{lang === 'UA' ? 'Мій розклад' : 'My Schedule'}</h1>
        <div className="schedule-navigation">
          <button className="btn-outline" onClick={goToPreviousWeek}>←</button>
          <span className="current-week">{formatDate(weekDaysList[0])} – {formatDate(weekDaysList[6])}</span>
          <button className="btn-outline" onClick={goToNextWeek}>→</button>
          <button className="btn-primary" onClick={goToToday}>
            {lang === 'UA' ? 'Сьогодні' : 'Today'}
          </button>
        </div>
      </div>

      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
              {weekDaysList.map((day, index) => (
                <th key={index}>
                  <div className="day-header">
                    <span className="day-name">
                      {lang === 'UA' ? weekDays[index] : weekDaysEN[index]}
                    </span>
                    <span className="day-date">{day.getDate()}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="time-cell">{hour}</td>
                {weekDaysList.map((day, colIndex) => {
                  const dayDate = day.toISOString().split('T')[0];
                  const app = weekAppointments.find(a => 
                    a.date === dayDate && a.time === hour
                  );
                  return (
                    <td key={colIndex} className={`appointment-cell ${app ? 'has-appointment' : ''}`}>
                      {app && (
                        <div className="appointment-block">
                          <div className="appointment-service">{app.serviceName}</div>
                          <div className="appointment-client">{app.clientName}</div>
                          <Link to={`/specialist/appointments/${app.id}`} className="appointment-link">
                            {lang === 'UA' ? 'Деталі' : 'Details'}
                          </Link>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;