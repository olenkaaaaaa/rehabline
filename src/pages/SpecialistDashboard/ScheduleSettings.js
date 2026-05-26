import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/specialist-schedule-settings.css';

const DAYS = [
  { value: 1, UA: 'Понеділок', EN: 'Monday' },
  { value: 2, UA: 'Вівторок', EN: 'Tuesday' },
  { value: 3, UA: 'Середа', EN: 'Wednesday' },
  { value: 4, UA: 'Четвер', EN: 'Thursday' },
  { value: 5, UA: 'Пʼятниця', EN: 'Friday' },
  { value: 6, UA: 'Субота', EN: 'Saturday' },
  { value: 7, UA: 'Неділя', EN: 'Sunday' },
];

const emptyScheduleForm = {
  day_of_week: '',
  location_id: '',
  start_time: '',
  end_time: '',
  break_start: '',
  break_end: '',
  comment: '',
};

const emptyTimeOffForm = {
  start_date: '',
  end_date: '',
  reason: '',
};

const formatTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const getLocationName = (location, lang) => {
  if (!location) return '';

  return lang === 'UA'
    ? location.name_ua || location.name || ''
    : location.name_en || location.name_ua || location.name || '';
};

const getLocationCity = (location, lang) => {
  if (!location) return '';

  return lang === 'UA'
    ? location.city_ua || location.city || ''
    : location.city_en || location.city_ua || location.city || '';
};

const getScheduleLocation = (schedule, locations) => {
  if (schedule.locations) return schedule.locations;

  return locations.find(
    (location) => Number(location.id) === Number(schedule.location_id)
  );
};

const normalizeWorkingHour = (item) => ({
  ...item,
  id: item.id,
  specialist_id: item.specialist_id,
  location_id: item.location_id,
  day_of_week: Number(item.day_of_week),
  start_time: formatTime(item.start_time),
  end_time: formatTime(item.end_time),
  break_start: item.break_start ? formatTime(item.break_start) : '',
  break_end: item.break_end ? formatTime(item.break_end) : '',
  is_active: item.is_active !== false,
});

const getRequestTitle = (request, lang) => {
  if (request.request_type === 'schedule_update') {
    return lang === 'UA' ? 'Редагування графіка' : 'Schedule edit';
  }

  if (request.request_type === 'schedule_delete') {
    return lang === 'UA' ? 'Видалення графіка' : 'Schedule delete';
  }

  return lang === 'UA' ? 'Новий графік' : 'New schedule';
};

const ScheduleSettings = () => {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();

  const [specialistId, setSpecialistId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);

  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [timeOffForm, setTimeOffForm] = useState(emptyTimeOffForm);

  const [scheduleMode, setScheduleMode] = useState('create');
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false);

  const resolveSpecialistId = async () => {
    if (profile?.specialist_id) {
      return Number(profile.specialist_id);
    }

    if (user?.id) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('specialist_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profileData?.specialist_id) {
        return Number(profileData.specialist_id);
      }
    }

    return null;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const resolvedSpecialistId = await resolveSpecialistId();
      setSpecialistId(resolvedSpecialistId);

      if (!resolvedSpecialistId) {
        setLocations([]);
        setWorkingHours([]);
        setScheduleRequests([]);
        setTimeOffRequests([]);
        return;
      }

      const [
        locationsResponse,
        workingHoursResponse,
        scheduleRequestsResponse,
        timeOffRequestsResponse,
      ] = await Promise.all([
        supabase
          .from('locations')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('specialist_working_hours')
          .select('*, locations(*)')
          .eq('specialist_id', resolvedSpecialistId)
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true }),

        supabase
          .from('schedule_change_requests')
          .select('*')
          .eq('specialist_id', resolvedSpecialistId)
          .order('created_at', { ascending: false }),

        supabase
          .from('time_off_requests')
          .select('*')
          .eq('specialist_id', resolvedSpecialistId)
          .order('created_at', { ascending: false }),
      ]);

      if (locationsResponse.error) throw locationsResponse.error;
      if (workingHoursResponse.error) throw workingHoursResponse.error;

      if (scheduleRequestsResponse.error) {
        console.warn(
          'schedule_change_requests load failed:',
          scheduleRequestsResponse.error
        );
      }

      if (timeOffRequestsResponse.error) {
        console.warn(
          'time_off_requests load failed:',
          timeOffRequestsResponse.error
        );
      }

      setLocations(locationsResponse.data || []);
      setWorkingHours((workingHoursResponse.data || []).map(normalizeWorkingHour));
      setScheduleRequests(scheduleRequestsResponse.data || []);
      setTimeOffRequests(timeOffRequestsResponse.data || []);
    } catch (error) {
      console.error('Schedule settings load failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити графік: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load schedule: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id || profile?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.id, profile?.specialist_id, lang]);

  const groupedWorkingHours = useMemo(() => {
    return DAYS.map((day) => ({
      ...day,
      schedules: workingHours.filter(
        (schedule) => Number(schedule.day_of_week) === Number(day.value)
      ),
    }));
  }, [workingHours]);

  const pendingScheduleRequests = useMemo(() => {
    return scheduleRequests.filter((request) => request.status === 'pending');
  }, [scheduleRequests]);

  const pendingTimeOffRequests = useMemo(() => {
    return timeOffRequests.filter((request) => request.status === 'pending');
  }, [timeOffRequests]);

  const findExistingSchedule = (dayOfWeek, locationId) => {
    return workingHours.find(
      (item) =>
        Number(item.day_of_week) === Number(dayOfWeek) &&
        Number(item.location_id) === Number(locationId) &&
        item.is_active !== false
    );
  };

  const resetScheduleForm = () => {
    setScheduleMode('create');
    setEditingSchedule(null);
    setScheduleForm(emptyScheduleForm);
  };

  const handleEditSchedule = (schedule) => {
    if (!schedule) return;

    setScheduleMode('edit');
    setEditingSchedule(schedule);

    setScheduleForm({
      day_of_week: String(schedule.day_of_week || ''),
      location_id: String(schedule.location_id || ''),
      start_time: formatTime(schedule.start_time),
      end_time: formatTime(schedule.end_time),
      break_start: schedule.break_start ? formatTime(schedule.break_start) : '',
      break_end: schedule.break_end ? formatTime(schedule.break_end) : '',
      comment: '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const syncScheduleFormWithExisting = (nextForm) => {
    if (!nextForm.day_of_week || !nextForm.location_id) {
      setScheduleMode('create');
      setEditingSchedule(null);
      return nextForm;
    }

    const existingSchedule = findExistingSchedule(
      nextForm.day_of_week,
      nextForm.location_id
    );

    if (!existingSchedule) {
      setScheduleMode('create');
      setEditingSchedule(null);
      return nextForm;
    }

    setScheduleMode('edit');
    setEditingSchedule(existingSchedule);

    return {
      ...nextForm,
      start_time: formatTime(existingSchedule.start_time),
      end_time: formatTime(existingSchedule.end_time),
      break_start: existingSchedule.break_start
        ? formatTime(existingSchedule.break_start)
        : '',
      break_end: existingSchedule.break_end
        ? formatTime(existingSchedule.break_end)
        : '',
      comment: '',
    };
  };

  const updateScheduleForm = (field, value) => {
    setScheduleForm((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      };

      if (field === 'day_of_week' || field === 'location_id') {
        return syncScheduleFormWithExisting(nextForm);
      }

      return nextForm;
    });
  };

  const validateScheduleForm = () => {
    if (
      !scheduleForm.day_of_week ||
      !scheduleForm.location_id ||
      !scheduleForm.start_time ||
      !scheduleForm.end_time
    ) {
      alert(
        lang === 'UA'
          ? 'Заповніть день, локацію, початок і кінець роботи'
          : 'Fill in day, location, start and end time'
      );
      return false;
    }

    if (scheduleForm.start_time >= scheduleForm.end_time) {
      alert(
        lang === 'UA'
          ? 'Час початку має бути меншим за час завершення'
          : 'Start time must be earlier than end time'
      );
      return false;
    }

    if (
      (scheduleForm.break_start && !scheduleForm.break_end) ||
      (!scheduleForm.break_start && scheduleForm.break_end)
    ) {
      alert(
        lang === 'UA'
          ? 'Заповніть і початок, і кінець перерви'
          : 'Fill both break start and break end'
      );
      return false;
    }

    if (
      scheduleForm.break_start &&
      scheduleForm.break_end &&
      scheduleForm.break_start >= scheduleForm.break_end
    ) {
      alert(
        lang === 'UA'
          ? 'Початок перерви має бути меншим за кінець перерви'
          : 'Break start must be earlier than break end'
      );
      return false;
    }

    if (
      scheduleForm.break_start &&
      (scheduleForm.break_start <= scheduleForm.start_time ||
        scheduleForm.break_end >= scheduleForm.end_time)
    ) {
      alert(
        lang === 'UA'
          ? 'Перерва має бути всередині робочого часу'
          : 'Break must be inside working hours'
      );
      return false;
    }

    return true;
  };

  const insertScheduleRequest = async (payload) => {
    const { error } = await supabase
      .from('schedule_change_requests')
      .insert(payload);

    if (!error) return;

    if (
      error.message?.includes('current_values') ||
      error.message?.includes('schema cache') ||
      error.code === 'PGRST204'
    ) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.current_values;

      const { error: fallbackError } = await supabase
        .from('schedule_change_requests')
        .insert(fallbackPayload);

      if (fallbackError) throw fallbackError;
      return;
    }

    throw error;
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();

    if (!specialistId) {
      alert(
        lang === 'UA'
          ? 'Не знайдено профіль спеціаліста'
          : 'Specialist profile was not found'
      );
      return;
    }

    if (!validateScheduleForm()) return;

    const existingSameDaySchedule = findExistingSchedule(
      scheduleForm.day_of_week,
      scheduleForm.location_id
    );

    const isEditing = scheduleMode === 'edit' && editingSchedule?.id;

    if (!isEditing && existingSameDaySchedule) {
      alert(
        lang === 'UA'
          ? 'На цей день і цю локацію вже є графік. Натисніть ✏️ біля графіка, щоб відредагувати його.'
          : 'This day and location already have a schedule. Click ✏️ near the schedule to edit it.'
      );
      return;
    }

    const scheduleId = isEditing ? editingSchedule.id : null;

    const requestPayload = {
      specialist_id: specialistId,
      status: 'pending',
      request_type: isEditing ? 'schedule_update' : 'schedule_create',
      schedule_id: scheduleId,

      location_id: Number(scheduleForm.location_id),
      day_of_week: Number(scheduleForm.day_of_week),
      start_time: scheduleForm.start_time,
      end_time: scheduleForm.end_time,
      break_start: scheduleForm.break_start || null,
      break_end: scheduleForm.break_end || null,
      comment: scheduleForm.comment?.trim() || null,

      requested_changes: {
        action: isEditing ? 'update' : 'create',
        schedule_id: scheduleId,
        location_id: Number(scheduleForm.location_id),
        day_of_week: Number(scheduleForm.day_of_week),
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        break_start: scheduleForm.break_start || null,
        break_end: scheduleForm.break_end || null,
      },

      current_values: isEditing
        ? {
            schedule_id: editingSchedule.id,
            location_id: editingSchedule.location_id,
            day_of_week: editingSchedule.day_of_week,
            start_time: editingSchedule.start_time,
            end_time: editingSchedule.end_time,
            break_start: editingSchedule.break_start || null,
            break_end: editingSchedule.break_end || null,
            is_active: editingSchedule.is_active,
          }
        : null,
    };

    try {
      setSubmittingSchedule(true);

      await insertScheduleRequest(requestPayload);

      alert(
        isEditing
          ? lang === 'UA'
            ? 'Заявку на редагування графіка надіслано'
            : 'Schedule edit request has been sent'
          : lang === 'UA'
            ? 'Заявку на створення графіка надіслано'
            : 'Schedule creation request has been sent'
      );

      resetScheduleForm();
      await loadData();
    } catch (error) {
      console.error('Schedule request failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати заявку: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to send request: ${error.message || 'Please try again'}`
      );
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleDeleteScheduleRequest = async (schedule) => {
    if (!schedule?.id) return;

    if (!specialistId) {
      alert(
        lang === 'UA'
          ? 'Не знайдено профіль спеціаліста'
          : 'Specialist profile was not found'
      );
      return;
    }

    const location = getScheduleLocation(schedule, locations);
    const locationName = getLocationName(location, lang);
    const locationCity = getLocationCity(location, lang);
    const fullLocation = [locationCity, locationName].filter(Boolean).join(', ');

    const confirmed = window.confirm(
      lang === 'UA'
        ? `Надіслати запит на видалення графіка?\n\n${formatTime(
            schedule.start_time
          )} — ${formatTime(schedule.end_time)}\n${fullLocation}`
        : `Send request to delete this schedule?\n\n${formatTime(
            schedule.start_time
          )} — ${formatTime(schedule.end_time)}\n${fullLocation}`
    );

    if (!confirmed) return;

    const requestPayload = {
      specialist_id: specialistId,
      status: 'pending',
      request_type: 'schedule_delete',
      schedule_id: schedule.id,

      location_id: Number(schedule.location_id),
      day_of_week: Number(schedule.day_of_week),
      start_time: formatTime(schedule.start_time),
      end_time: formatTime(schedule.end_time),
      break_start: schedule.break_start || null,
      break_end: schedule.break_end || null,

      comment:
        lang === 'UA'
          ? 'Запит на видалення графіка'
          : 'Schedule delete request',

      requested_changes: {
        action: 'delete',
        schedule_id: schedule.id,
        location_id: Number(schedule.location_id),
        day_of_week: Number(schedule.day_of_week),
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
        break_start: schedule.break_start || null,
        break_end: schedule.break_end || null,
        is_active: false,
      },

      current_values: {
        schedule_id: schedule.id,
        location_id: schedule.location_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_start: schedule.break_start || null,
        break_end: schedule.break_end || null,
        is_active: schedule.is_active,
      },
    };

    try {
      setSubmittingSchedule(true);

      await insertScheduleRequest(requestPayload);

      if (editingSchedule?.id === schedule.id) {
        resetScheduleForm();
      }

      alert(
        lang === 'UA'
          ? 'Запит на видалення графіка надіслано'
          : 'Schedule delete request has been sent'
      );

      await loadData();
    } catch (error) {
      console.error('Schedule delete request failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати запит на видалення: ${
              error.message || 'Спробуйте ще раз'
            }`
          : `Failed to send delete request: ${
              error.message || 'Please try again'
            }`
      );
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleTimeOffChange = (field, value) => {
    setTimeOffForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeOffSubmit = async (event) => {
    event.preventDefault();

    if (!specialistId) {
      alert(
        lang === 'UA'
          ? 'Не знайдено профіль спеціаліста'
          : 'Specialist profile was not found'
      );
      return;
    }

    if (!timeOffForm.start_date || !timeOffForm.end_date) {
      alert(
        lang === 'UA'
          ? 'Оберіть дату початку і дату завершення'
          : 'Choose start and end date'
      );
      return;
    }

    if (timeOffForm.start_date > timeOffForm.end_date) {
      alert(
        lang === 'UA'
          ? 'Дата початку має бути раніше або дорівнювати даті завершення'
          : 'Start date must be earlier than or equal to end date'
      );
      return;
    }

    try {
      setSubmittingTimeOff(true);

      const { error } = await supabase.from('time_off_requests').insert({
        specialist_id: specialistId,
        start_date: timeOffForm.start_date,
        end_date: timeOffForm.end_date,
        reason: timeOffForm.reason?.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      alert(
        lang === 'UA'
          ? 'Запит на відпустку надіслано'
          : 'Time off request has been sent'
      );

      setTimeOffForm(emptyTimeOffForm);
      await loadData();
    } catch (error) {
      console.error('Time off request failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати запит: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to send request: ${error.message || 'Please try again'}`
      );
    } finally {
      setSubmittingTimeOff(false);
    }
  };

  if (loading) {
    return (
      <div className="specialist-page">
        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-page">
      <div className="dashboard-header">
        <div>
          <h1>{lang === 'UA' ? 'Налаштування графіка' : 'Schedule settings'}</h1>
          <p>
            {lang === 'UA'
              ? 'Керуйте графіком, перервами та відпустками'
              : 'Manage schedule, breaks and time off'}
          </p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2">
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>{lang === 'UA' ? 'Поточний графік' : 'Current schedule'}</h2>
              <p>
                {lang === 'UA'
                  ? 'Ваші активні робочі години. Натисніть ✏️, щоб редагувати, або 🗑️, щоб надіслати запит на видалення.'
                  : 'Your active working hours. Click ✏️ to edit or 🗑️ to request deletion.'}
              </p>
            </div>
          </div>

          {workingHours.length > 0 ? (
            <div className="schedule-days">
              {groupedWorkingHours.map((day) => (
                <div key={day.value} className="schedule-day-card">
                  <h3>{day[lang]}</h3>

                  {day.schedules.length > 0 ? (
                    day.schedules.map((schedule) => {
                      const location = getScheduleLocation(schedule, locations);
                      const locationName = getLocationName(location, lang);
                      const locationCity = getLocationCity(location, lang);

                      return (
                        <div key={schedule.id} className="schedule-slot">
                          <div className="schedule-slot-top">
                            <div className="schedule-slot-time">
                              {formatTime(schedule.start_time)} —{' '}
                              {formatTime(schedule.end_time)}
                            </div>

                            <div className="schedule-slot-actions">
                              <button
                                type="button"
                                className="schedule-icon-btn schedule-edit-btn"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleEditSchedule(schedule);
                                }}
                                title={
                                  lang === 'UA'
                                    ? 'Редагувати графік'
                                    : 'Edit schedule'
                                }
                                aria-label={
                                  lang === 'UA'
                                    ? 'Редагувати графік'
                                    : 'Edit schedule'
                                }
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                className="schedule-icon-btn schedule-delete-btn"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleDeleteScheduleRequest(schedule);
                                }}
                                title={
                                  lang === 'UA'
                                    ? 'Запит на видалення'
                                    : 'Request delete'
                                }
                                aria-label={
                                  lang === 'UA'
                                    ? 'Запит на видалення'
                                    : 'Request delete'
                                }
                                disabled={submittingSchedule}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <small>
                            {[locationCity, locationName].filter(Boolean).join(', ')}
                          </small>

                          {(schedule.break_start || schedule.break_end) && (
                            <small>
                              {lang === 'UA' ? 'Перерва' : 'Break'}:{' '}
                              {schedule.break_start
                                ? formatTime(schedule.break_start)
                                : '—'}{' '}
                              —{' '}
                              {schedule.break_end
                                ? formatTime(schedule.break_end)
                                : '—'}
                            </small>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted-text">
                      {lang === 'UA' ? 'Не працює' : 'Not working'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Активний графік ще не додано'
                  : 'Active schedule has not been added yet'}
              </p>
            </div>
          )}
        </section>

        <div className="dashboard-grid">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>
                  {scheduleMode === 'edit'
                    ? lang === 'UA'
                      ? 'Редагування графіка'
                      : 'Edit schedule'
                    : lang === 'UA'
                      ? 'Новий графік'
                      : 'New schedule'}
                </h2>

                <p>
                  {scheduleMode === 'edit'
                    ? lang === 'UA'
                      ? 'Ви редагуєте чинний графік. Зміни будуть надіслані на підтвердження.'
                      : 'You are editing the current schedule. Changes will be sent for approval.'
                    : lang === 'UA'
                      ? 'Створіть новий робочий день і надішліть його на підтвердження.'
                      : 'Create a new working day and send it for approval.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Локація' : 'Location'}</label>
                <select
                  value={scheduleForm.location_id}
                  onChange={(event) =>
                    updateScheduleForm('location_id', event.target.value)
                  }
                  required
                >
                  <option value="">
                    {lang === 'UA' ? 'Оберіть локацію' : 'Choose location'}
                  </option>

                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {[getLocationCity(location, lang), getLocationName(location, lang)]
                        .filter(Boolean)
                        .join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'День тижня' : 'Week day'}</label>
                <select
                  value={scheduleForm.day_of_week}
                  onChange={(event) =>
                    updateScheduleForm('day_of_week', event.target.value)
                  }
                  required
                >
                  <option value="">
                    {lang === 'UA' ? 'Оберіть день' : 'Choose day'}
                  </option>

                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day[lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{lang === 'UA' ? 'Початок' : 'Start'}</label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(event) =>
                      updateScheduleForm('start_time', event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Кінець' : 'End'}</label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(event) =>
                      updateScheduleForm('end_time', event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    {lang === 'UA' ? 'Початок перерви' : 'Break start'}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.break_start}
                    onChange={(event) =>
                      updateScheduleForm('break_start', event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Кінець перерви' : 'Break end'}</label>
                  <input
                    type="time"
                    value={scheduleForm.break_end}
                    onChange={(event) =>
                      updateScheduleForm('break_end', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Коментар' : 'Comment'}</label>
                <textarea
                  value={scheduleForm.comment}
                  onChange={(event) =>
                    updateScheduleForm('comment', event.target.value)
                  }
                  placeholder={
                    lang === 'UA'
                      ? 'Наприклад: зміна робочого часу через іншу локацію'
                      : 'For example: working hours change because of another location'
                  }
                />
              </div>

              <div className="schedule-form-actions">
                {scheduleMode === 'edit' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetScheduleForm}
                  >
                    {lang === 'UA'
                      ? 'Скасувати редагування'
                      : 'Cancel editing'}
                  </button>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingSchedule}
                >
                  {submittingSchedule
                    ? lang === 'UA'
                      ? 'Надсилання...'
                      : 'Sending...'
                    : scheduleMode === 'edit'
                      ? lang === 'UA'
                        ? 'Надіслати зміни'
                        : 'Send changes'
                      : lang === 'UA'
                        ? 'Надіслати на підтвердження'
                        : 'Send for approval'}
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>{lang === 'UA' ? 'Відпустка' : 'Time off'}</h2>
                <p>
                  {lang === 'UA'
                    ? 'Запит на відпустку або вихідні'
                    : 'Request vacation or days off'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTimeOffSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{lang === 'UA' ? 'Від' : 'From'}</label>
                  <input
                    type="date"
                    value={timeOffForm.start_date}
                    onChange={(event) =>
                      handleTimeOffChange('start_date', event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'До' : 'To'}</label>
                  <input
                    type="date"
                    value={timeOffForm.end_date}
                    onChange={(event) =>
                      handleTimeOffChange('end_date', event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Причина' : 'Reason'}</label>
                <textarea
                  value={timeOffForm.reason}
                  onChange={(event) =>
                    handleTimeOffChange('reason', event.target.value)
                  }
                />
              </div>

              <div className="schedule-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingTimeOff}
                >
                  {submittingTimeOff
                    ? lang === 'UA'
                      ? 'Надсилання...'
                      : 'Sending...'
                    : lang === 'UA'
                      ? 'Надіслати запит'
                      : 'Send request'}
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>
                  {lang === 'UA'
                    ? 'Очікують підтвердження'
                    : 'Pending requests'}
                </h2>
                <p>
                  {lang === 'UA'
                    ? 'Заявки на зміну графіка та відпустки'
                    : 'Schedule and time off requests'}
                </p>
              </div>
            </div>

            {pendingScheduleRequests.length > 0 || pendingTimeOffRequests.length > 0 ? (
              <div className="requests-list">
                {pendingScheduleRequests.slice(0, 5).map((request) => (
                  <div key={`schedule-${request.id}`} className="request-mini-card">
                    <strong>{getRequestTitle(request, lang)}</strong>
                    <span>{request.status}</span>
                  </div>
                ))}

                {pendingTimeOffRequests.slice(0, 5).map((request) => (
                  <div key={`timeoff-${request.id}`} className="request-mini-card">
                    <strong>{lang === 'UA' ? 'Відпустка' : 'Time off'}</strong>
                    <span>
                      {request.start_date} — {request.end_date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>
                  {lang === 'UA'
                    ? 'Немає заявок на підтвердження'
                    : 'No pending requests'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettings;