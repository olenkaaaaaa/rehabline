import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/admin-settings.css';

const defaultSettings = {
  buffer: '10',
  cancellationRule: '12',
  confirmationMode: 'auto+manual',
  slotStep: '15',
};

const defaultTemplates = {
  confirmationUA:
    'Вітаємо, {clientName}! Ваш запис на {serviceName} підтверджено. Дата: {date} Час: {time} Локація: {location}',
  confirmationEN:
    'Hello {clientName}! Your appointment for {serviceName} is confirmed. Date: {date} Time: {time} Location: {location}',
  reminder24UA: 'Нагадуємо про запис завтра о {time}',
  reminder24EN: 'Reminder about your appointment tomorrow at {time}',
  reminder2UA: 'Нагадуємо про запис через 2 години о {time}',
  reminder2EN: 'Reminder about your appointment in 2 hours at {time}',
  cancellationUA: 'Ваш запис на {date} о {time} скасовано.',
  cancellationEN: 'Your appointment on {date} at {time} has been cancelled.',
};

const Settings = () => {
  const { lang } = useLanguage();

  const [settings, setSettings] = useState(defaultSettings);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSettings(defaultSettings);
        setTemplates(defaultTemplates);
        return;
      }

      setSettings({
        buffer: String(data.buffer_minutes ?? defaultSettings.buffer),
        cancellationRule: String(
          data.cancellation_rule_hours ?? defaultSettings.cancellationRule
        ),
        confirmationMode: data.confirmation_mode || defaultSettings.confirmationMode,
        slotStep: String(data.slot_step_minutes ?? defaultSettings.slotStep),
      });

      setTemplates({
        confirmationUA:
          data.confirmation_ua || defaultTemplates.confirmationUA,
        confirmationEN:
          data.confirmation_en || defaultTemplates.confirmationEN,
        reminder24UA:
          data.reminder_24_ua || defaultTemplates.reminder24UA,
        reminder24EN:
          data.reminder_24_en || defaultTemplates.reminder24EN,
        reminder2UA:
          data.reminder_2_ua || defaultTemplates.reminder2UA,
        reminder2EN:
          data.reminder_2_en || defaultTemplates.reminder2EN,
        cancellationUA:
          data.cancellation_ua || defaultTemplates.cancellationUA,
        cancellationEN:
          data.cancellation_en || defaultTemplates.cancellationEN,
      });
    } catch (error) {
      console.error('Admin settings loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити налаштування: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load settings: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSettingChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;

    setTemplates((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        id: 1,
        buffer_minutes: Number(settings.buffer),
        cancellation_rule_hours: Number(settings.cancellationRule),
        confirmation_mode: settings.confirmationMode,
        slot_step_minutes: Number(settings.slotStep),

        confirmation_ua: templates.confirmationUA,
        confirmation_en: templates.confirmationEN,
        reminder_24_ua: templates.reminder24UA,
        reminder_24_en: templates.reminder24EN,
        reminder_2_ua: templates.reminder2UA,
        reminder_2_en: templates.reminder2EN,
        cancellation_ua: templates.cancellationUA,
        cancellation_en: templates.cancellationEN,

        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert(payload, {
          onConflict: 'id',
        });

      if (error) throw error;

      alert(lang === 'UA' ? 'Налаштування збережено' : 'Settings saved');
    } catch (error) {
      console.error('Admin settings save failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти налаштування: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save settings: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Скинути налаштування до стандартних?'
        : 'Reset settings to defaults?'
    );

    if (!confirmed) return;

    setSettings(defaultSettings);
    setTemplates(defaultTemplates);
  };

  if (loading) {
    return (
      <div className="admin-settings">
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
    <div className="admin-settings">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Налаштування' : 'Settings'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadSettings}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Правила запису' : 'Booking rules'}</h2>

        <div className="form-row">
          <div className="form-group half">
            <label>
              {lang === 'UA' ? 'Буфер між записами, хв' : 'Buffer, min'}
            </label>

            <select
              name="buffer"
              value={settings.buffer}
              onChange={handleSettingChange}
              disabled={saving}
            >
              <option value="0">0</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="30">30</option>
            </select>
          </div>

          <div className="form-group half">
            <label>
              {lang === 'UA' ? 'Крок слотів, хв' : 'Slot step, min'}
            </label>

            <select
              name="slotStep"
              value={settings.slotStep}
              onChange={handleSettingChange}
              disabled={saving}
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>
            {lang === 'UA'
              ? 'Правило скасування, год'
              : 'Cancellation rule, hours'}
          </label>

          <select
            name="cancellationRule"
            value={settings.cancellationRule}
            onChange={handleSettingChange}
            disabled={saving}
          >
            <option value="0">
              0 {lang === 'UA' ? 'год' : 'h'}
            </option>
            <option value="6">
              6 {lang === 'UA' ? 'год' : 'h'}
            </option>
            <option value="12">
              12 {lang === 'UA' ? 'год' : 'h'}
            </option>
            <option value="24">
              24 {lang === 'UA' ? 'год' : 'h'}
            </option>
            <option value="48">
              48 {lang === 'UA' ? 'год' : 'h'}
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>
            {lang === 'UA' ? 'Механіка підтвердження' : 'Confirmation mode'}
          </label>

          <select
            name="confirmationMode"
            value={settings.confirmationMode}
            onChange={handleSettingChange}
            disabled={saving}
          >
            <option value="auto">
              {lang === 'UA' ? 'Автоматичне' : 'Auto'}
            </option>
            <option value="manual">
              {lang === 'UA' ? 'Ручне' : 'Manual'}
            </option>
            <option value="auto+manual">
              {lang === 'UA' ? 'Авто + ручне' : 'Auto + manual'}
            </option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2>{lang === 'UA' ? 'Шаблони повідомлень' : 'Message templates'}</h2>

        <p className="hint">
          {lang === 'UA'
            ? 'Використовуйте змінні: {clientName}, {serviceName}, {date}, {time}, {location}'
            : 'Use variables: {clientName}, {serviceName}, {date}, {time}, {location}'}
        </p>

        <h3>{lang === 'UA' ? 'Підтвердження запису' : 'Appointment confirmation'}</h3>

        <div className="form-row">
          <div className="form-group half">
            <label>UA</label>

            <textarea
              name="confirmationUA"
              value={templates.confirmationUA}
              onChange={handleTemplateChange}
              rows="3"
              disabled={saving}
            />
          </div>

          <div className="form-group half">
            <label>EN</label>

            <textarea
              name="confirmationEN"
              value={templates.confirmationEN}
              onChange={handleTemplateChange}
              rows="3"
              disabled={saving}
            />
          </div>
        </div>

        <h3>{lang === 'UA' ? 'Нагадування за 24 години' : '24h reminder'}</h3>

        <div className="form-row">
          <div className="form-group half">
            <label>UA</label>

            <input
              type="text"
              name="reminder24UA"
              value={templates.reminder24UA}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>

          <div className="form-group half">
            <label>EN</label>

            <input
              type="text"
              name="reminder24EN"
              value={templates.reminder24EN}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>
        </div>

        <h3>{lang === 'UA' ? 'Нагадування за 2 години' : '2h reminder'}</h3>

        <div className="form-row">
          <div className="form-group half">
            <label>UA</label>

            <input
              type="text"
              name="reminder2UA"
              value={templates.reminder2UA}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>

          <div className="form-group half">
            <label>EN</label>

            <input
              type="text"
              name="reminder2EN"
              value={templates.reminder2EN}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>
        </div>

        <h3>{lang === 'UA' ? 'Скасування' : 'Cancellation'}</h3>

        <div className="form-row">
          <div className="form-group half">
            <label>UA</label>

            <input
              type="text"
              name="cancellationUA"
              value={templates.cancellationUA}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>

          <div className="form-group half">
            <label>EN</label>

            <input
              type="text"
              name="cancellationEN"
              value={templates.cancellationEN}
              onChange={handleTemplateChange}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          type="button"
          className="btn-outline"
          onClick={resetToDefaults}
          disabled={saving}
        >
          {lang === 'UA' ? 'Скинути до стандартних' : 'Reset defaults'}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? lang === 'UA'
              ? 'Збереження...'
              : 'Saving...'
            : lang === 'UA'
              ? 'Зберегти'
              : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default Settings;