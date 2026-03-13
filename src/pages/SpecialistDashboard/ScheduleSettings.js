import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const ScheduleSettings = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const specialistId = user?.id || 1;

  const [workingHours, setWorkingHours] = useState({});
  const [buffer, setBuffer] = useState(15);
  const [breakTime, setBreakTime] = useState({ start: '13:00', end: '13:30' });
  const [exceptions, setExceptions] = useState([]);
  const [newException, setNewException] = useState({ date: '', reason: '' });

  useEffect(() => {
    // Завантаження налаштувань (у реальному додатку з API)
    // Для демо використовуємо дані з localStorage
    const stored = localStorage.getItem(`schedule_${specialistId}`);
    if (stored) {
      const data = JSON.parse(stored);
      setWorkingHours(data.workingHours || {});
      setBuffer(data.buffer || 15);
      setBreakTime(data.breakTime || { start: '13:00', end: '13:30' });
      setExceptions(data.exceptions || []);
    } else {
      // Початкові значення
      const defaultHours = {
        1: { start: '09:00', end: '18:00', isWorking: true }, // понеділок
        2: { start: '09:00', end: '18:00', isWorking: true }, // вівторок
        3: { start: '09:00', end: '18:00', isWorking: true }, // середа
        4: { start: '09:00', end: '18:00', isWorking: true }, // четвер
        5: { start: '09:00', end: '18:00', isWorking: true }, // п'ятниця
        6: { start: '10:00', end: '16:00', isWorking: true }, // субота
        0: { start: '', end: '', isWorking: false }, // неділя
      };
      setWorkingHours(defaultHours);
    }
  }, [specialistId]);

  const handleWorkingHourChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleToggleWorkingDay = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isWorking: !prev[day]?.isWorking }
    }));
  };

  const handleSave = () => {
    const data = {
      workingHours,
      buffer,
      breakTime,
      exceptions,
    };
    localStorage.setItem(`schedule_${specialistId}`, JSON.stringify(data));
    alert(lang === 'UA' ? 'Налаштування збережено' : 'Settings saved');
  };

  const handleAddException = () => {
    if (!newException.date || !newException.reason) return;
    setExceptions([...exceptions, { ...newException, id: Date.now() }]);
    setNewException({ date: '', reason: '' });
  };

  const handleRemoveException = (id) => {
    setExceptions(exceptions.filter(e => e.id !== id));
  };

  const weekDays = [
    { key: 1, label: lang === 'UA' ? 'Понеділок' : 'Monday' },
    { key: 2, label: lang === 'UA' ? 'Вівторок' : 'Tuesday' },
    { key: 3, label: lang === 'UA' ? 'Середа' : 'Wednesday' },
    { key: 4, label: lang === 'UA' ? 'Четвер' : 'Thursday' },
    { key: 5, label: lang === 'UA' ? 'П\'ятниця' : 'Friday' },
    { key: 6, label: lang === 'UA' ? 'Субота' : 'Saturday' },
    { key: 0, label: lang === 'UA' ? 'Неділя' : 'Sunday' },
  ];

  return (
    <div className="schedule-settings">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Налаштування графіка' : 'Schedule Settings'}</h1>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Робочі години' : 'Working Hours'}</h2>
        <table className="hours-table">
          <thead>
            <tr>
              <th>{lang === 'UA' ? 'День' : 'Day'}</th>
              <th>{lang === 'UA' ? 'Працює' : 'Working'}</th>
              <th>{lang === 'UA' ? 'Початок' : 'Start'}</th>
              <th>{lang === 'UA' ? 'Кінець' : 'End'}</th>
            </tr>
          </thead>
          <tbody>
            {weekDays.map(({ key, label }) => (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={workingHours[key]?.isWorking || false}
                    onChange={() => handleToggleWorkingDay(key)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={workingHours[key]?.start || ''}
                    onChange={(e) => handleWorkingHourChange(key, 'start', e.target.value)}
                    disabled={!workingHours[key]?.isWorking}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={workingHours[key]?.end || ''}
                    onChange={(e) => handleWorkingHourChange(key, 'end', e.target.value)}
                    disabled={!workingHours[key]?.isWorking}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Буфер між записами' : 'Buffer between appointments'}</h2>
        <select value={buffer} onChange={(e) => setBuffer(parseInt(e.target.value))}>
          <option value="0">0 {lang === 'UA' ? 'хв' : 'min'}</option>
          <option value="5">5 {lang === 'UA' ? 'хв' : 'min'}</option>
          <option value="10">10 {lang === 'UA' ? 'хв' : 'min'}</option>
          <option value="15">15 {lang === 'UA' ? 'хв' : 'min'}</option>
          <option value="30">30 {lang === 'UA' ? 'хв' : 'min'}</option>
        </select>
      </div>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Перерва' : 'Break'}</h2>
        <div className="break-inputs">
          <label>
            {lang === 'UA' ? 'Початок' : 'Start'}:
            <input
              type="time"
              value={breakTime.start}
              onChange={(e) => setBreakTime({ ...breakTime, start: e.target.value })}
            />
          </label>
          <label>
            {lang === 'UA' ? 'Кінець' : 'End'}:
            <input
              type="time"
              value={breakTime.end}
              onChange={(e) => setBreakTime({ ...breakTime, end: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Виключення' : 'Exceptions'}</h2>
        <div className="add-exception">
          <input
            type="date"
            value={newException.date}
            onChange={(e) => setNewException({ ...newException, date: e.target.value })}
          />
          <input
            type="text"
            placeholder={lang === 'UA' ? 'Причина' : 'Reason'}
            value={newException.reason}
            onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
          />
          <button className="btn-primary" onClick={handleAddException}>
            {lang === 'UA' ? 'Додати' : 'Add'}
          </button>
        </div>
        <table className="exceptions-table">
          <thead>
            <tr>
              <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
              <th>{lang === 'UA' ? 'Причина' : 'Reason'}</th>
              <th>{lang === 'UA' ? 'Дії' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map(ex => (
              <tr key={ex.id}>
                <td>{ex.date}</td>
                <td>{ex.reason}</td>
                <td>
                  <button className="btn-link" onClick={() => handleRemoveException(ex.id)}>
                    {lang === 'UA' ? 'Видалити' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="settings-actions">
        <button className="btn-primary" onClick={handleSave}>
          {lang === 'UA' ? 'Зберегти' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default ScheduleSettings;