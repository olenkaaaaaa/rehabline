import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/client-settings.css';

const defaultSettings = {
  email_notifications: true,
  sms_notifications: true,
  push_notifications: false,
  reminder_1_hours: '24',
  reminder_2_hours: '2',
};

const Settings = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { user, profile, ensureProfile } = useAuth();

  const [settings, setSettings] = useState(defaultSettings);
  const [language, setLanguage] = useState(lang);
  const [timezone, setTimezone] = useState('Europe/Kiev');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let currentProfile = profile;

        if (!currentProfile) {
          currentProfile = await ensureProfile(user);
        }

        const normalizedLanguage = currentProfile?.language || lang || 'UA';
        const normalizedTimezone = currentProfile?.timezone || 'Europe/Kiev';

        const loadedSettings = {
          email_notifications:
            currentProfile?.email_notifications ?? defaultSettings.email_notifications,
          sms_notifications:
            currentProfile?.sms_notifications ?? defaultSettings.sms_notifications,
          push_notifications:
            currentProfile?.push_notifications ?? defaultSettings.push_notifications,
          reminder_1_hours:
            String(currentProfile?.reminder_1_hours ?? defaultSettings.reminder_1_hours),
          reminder_2_hours:
            String(currentProfile?.reminder_2_hours ?? defaultSettings.reminder_2_hours),
        };

        if (!isMounted) return;

        setLanguage(normalizedLanguage);
        setTimezone(normalizedTimezone);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Settings loading failed:', error);

        alert(
          lang === 'UA'
            ? 'Не вдалося завантажити налаштування'
            : 'Failed to load settings'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user, profile, ensureProfile, lang]);

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    if (newLanguage !== lang) {
      toggleLanguage();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      setSaving(true);

      const payload = {
        id: user.id,
        full_name:
          profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email ||
          'Користувач',
        phone: profile?.phone || user?.user_metadata?.phone || '',
        role: profile?.role || 'client',
        language,
        timezone,
        email_notifications: settings.email_notifications,
        sms_notifications: settings.sms_notifications,
        push_notifications: settings.push_notifications,
        reminder_1_hours: Number(settings.reminder_1_hours),
        reminder_2_hours: Number(settings.reminder_2_hours),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, {
          onConflict: 'id',
        });

      if (error) {
        throw error;
      }

      alert(
        lang === 'UA'
          ? 'Налаштування збережено'
          : 'Settings saved'
      );
    } catch (error) {
      console.error('Settings save failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти налаштування: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save settings: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Налаштування' : 'Settings'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Налаштування' : 'Settings'}
      </h1>

      <form onSubmit={handleSubmit} className="settings-form">
        <section className="settings-section">
          <h2>{lang === 'UA' ? 'Мова та формат' : 'Language & format'}</h2>

          <div className="language-selector">
            <button
              type="button"
              className={`lang-option ${language === 'UA' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('UA')}
              disabled={saving}
            >
              Українська
            </button>

            <button
              type="button"
              className={`lang-option ${language === 'EN' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('EN')}
              disabled={saving}
            >
              English
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="timezone">
              {lang === 'UA' ? 'Часовий пояс' : 'Timezone'}
            </label>

            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={saving}
            >
              <option value="Europe/Kiev">Europe/Kiev</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </section>

        {/* <section className="settings-section">
          <h2>
            {lang === 'UA'
              ? 'Нагадування та повідомлення'
              : 'Reminders & notifications'}
          </h2>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="email_notifications"
                checked={settings.email_notifications}
                onChange={handleNotificationChange}
                disabled={saving}
              />
              Email {lang === 'UA' ? 'повідомлення' : 'notifications'}
            </label>

            <label>
              <input
                type="checkbox"
                name="sms_notifications"
                checked={settings.sms_notifications}
                onChange={handleNotificationChange}
                disabled={saving}
              />
              SMS {lang === 'UA' ? 'нагадування' : 'reminders'}
            </label>

            <label>
              <input
                type="checkbox"
                name="push_notifications"
                checked={settings.push_notifications}
                onChange={handleNotificationChange}
                disabled={saving}
              />
              Push {lang === 'UA' ? 'у браузері' : 'in browser'}
            </label>
          </div>

          <div className="reminder-times">
            <div className="form-group">
              <label htmlFor="reminder_1_hours">
                {lang === 'UA' ? 'Перше нагадування' : 'First reminder'}
              </label>

              <select
                id="reminder_1_hours"
                name="reminder_1_hours"
                value={settings.reminder_1_hours}
                onChange={handleNotificationChange}
                disabled={saving}
              >
                <option value="24">24 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="12">12 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="2">2 {lang === 'UA' ? 'год' : 'hours'}</option>
                <option value="1">1 {lang === 'UA' ? 'год' : 'hour'}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reminder_2_hours">
                {lang === 'UA' ? 'Друге нагадування' : 'Second reminder'}
              </label>

              <select
                id="reminder_2_hours"
                name="reminder_2_hours"
                value={settings.reminder_2_hours}
                onChange={handleNotificationChange}
                disabled={saving}
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
              ? 'Email-нагадування працюватимуть після підключення SMTP або автоматизацій.'
              : 'Email reminders will work after SMTP or automations are connected.'}
          </p>
        </section> */}

        <section className="settings-section">
          <h2>{lang === 'UA' ? 'Акаунт' : 'Account'}</h2>

          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email || '—'}</span>
          </div>

          <p className="hint">
            {lang === 'UA'
              ? 'Зміна email і пароля виконується через сторінки авторизації та відновлення пароля.'
              : 'Email and password changes are handled through login and password recovery pages.'}
          </p>
        </section>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving
            ? lang === 'UA'
              ? 'Збереження...'
              : 'Saving...'
            : lang === 'UA'
              ? 'Зберегти'
              : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default Settings;