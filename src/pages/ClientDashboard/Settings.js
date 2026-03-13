import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Settings = () => {
  const { lang, toggleLanguage } = useLanguage();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    reminder1: '24',
    reminder2: '2',
  });
  const [timezone, setTimezone] = useState('Europe/Kiev');

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotifications({
      ...notifications,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(lang === 'UA' ? 'Налаштування збережено' : 'Settings saved');
  };

  return (
    <div className="settings">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Налаштування' : 'Settings'}</h1>

      <form onSubmit={handleSubmit} className="settings-form">
        <section className="settings-section">
          <h2>{lang === 'UA' ? 'Мова та формат' : 'Language & format'}</h2>
          <div className="language-selector">
            <button
              type="button"
              className={`lang-option ${lang === 'UA' ? 'active' : ''}`}
              onClick={() => lang !== 'UA' && toggleLanguage()}
            >
              Українська (UA)
            </button>
            <button
              type="button"
              className={`lang-option ${lang === 'EN' ? 'active' : ''}`}
              onClick={() => lang !== 'EN' && toggleLanguage()}
            >
              English (EN)
            </button>
          </div>
          <div className="form-group">
            <label htmlFor="timezone">{lang === 'UA' ? 'Часовий пояс' : 'Timezone'}</label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Europe/Kiev">Europe/Kiev</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2>{lang === 'UA' ? 'Нагадування та повідомлення' : 'Reminders & notifications'}</h2>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="email"
                checked={notifications.email}
                onChange={handleNotificationChange}
              />
              Email {lang === 'UA' ? 'повідомлення' : 'notifications'}
            </label>
            <label>
              <input
                type="checkbox"
                name="sms"
                checked={notifications.sms}
                onChange={handleNotificationChange}
              />
              SMS {lang === 'UA' ? 'нагадування' : 'reminders'}
            </label>
            <label>
              <input
                type="checkbox"
                name="push"
                checked={notifications.push}
                onChange={handleNotificationChange}
              />
              Push {lang === 'UA' ? 'в браузері' : 'in browser'}
            </label>
          </div>

          <div className="reminder-times">
            <div className="form-group">
              <label htmlFor="reminder1">{lang === 'UA' ? 'Час 1' : 'Time 1'}</label>
              <select
                id="reminder1"
                name="reminder1"
                value={notifications.reminder1}
                onChange={handleNotificationChange}
              >
                <option value="24">24 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="12">12 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="2">2 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="1">1 {lang === 'UA' ? 'год' : 'hour'}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reminder2">{lang === 'UA' ? 'Час 2' : 'Time 2'}</label>
              <select
                id="reminder2"
                name="reminder2"
                value={notifications.reminder2}
                onChange={handleNotificationChange}
              >
                <option value="24">24 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="12">12 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="2">2 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="1">1 {lang === 'UA' ? 'год' : 'hour'}</option>
              </select>
            </div>
          </div>
          <p className="hint">
            {lang === 'UA'
              ? 'Шаблони повідомлень автоматично відображаються обраною мовою.'
              : 'Message templates are automatically displayed in the selected language.'}
          </p>
        </section>

        <button type="submit" className="btn-primary">
          {lang === 'UA' ? 'Зберегти' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default Settings;