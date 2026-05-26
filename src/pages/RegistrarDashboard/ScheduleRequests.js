import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/schedule-requests.css';

const days = [
  { value: 1, UA: 'Понеділок', EN: 'Monday' },
  { value: 2, UA: 'Вівторок', EN: 'Tuesday' },
  { value: 3, UA: 'Середа', EN: 'Wednesday' },
  { value: 4, UA: 'Четвер', EN: 'Thursday' },
  { value: 5, UA: 'Пʼятниця', EN: 'Friday' },
  { value: 6, UA: 'Субота', EN: 'Saturday' },
  { value: 7, UA: 'Неділя', EN: 'Sunday' },
];

const formatTime = (time) => {
  if (!time) return '—';
  return String(time).slice(0, 5);
};

const getLocationName = (location, lang) => {
  if (!location) return '—';

  return lang === 'UA'
    ? location.name_ua || location.name || '—'
    : location.name_en || location.name_ua || location.name || '—';
};

const getLocationCity = (location, lang) => {
  if (!location) return '';

  return lang === 'UA'
    ? location.city_ua || location.city || ''
    : location.city_en || location.city_ua || location.city || '';
};

const getDoctorName = (request) => {
  return request.specialists?.name || request.specialists?.full_name || '—';
};

const getRequestTypeText = (type, lang) => {
  if (type === 'schedule_create') {
    return lang === 'UA' ? 'Створення графіка' : 'Create schedule';
  }

  if (type === 'schedule_update') {
    return lang === 'UA' ? 'Редагування графіка' : 'Edit schedule';
  }

  if (type === 'schedule_delete') {
    return lang === 'UA' ? 'Видалення графіка' : 'Delete schedule';
  }

  return type || '—';
};

const getStatusText = (status, lang) => {
  if (status === 'pending') {
    return lang === 'UA' ? 'Очікує підтвердження' : 'Pending';
  }

  if (status === 'registrar_approved') {
    return lang === 'UA'
      ? 'Підтверджено реєстратором'
      : 'Confirmed by registrar';
  }

  if (status === 'approved') {
    return lang === 'UA'
      ? 'Підтверджено адміністратором'
      : 'Approved by admin';
  }

  if (status === 'rejected') {
    return lang === 'UA' ? 'Відхилено' : 'Rejected';
  }

  if (status === 'cancelled') {
    return lang === 'UA' ? 'Скасовано' : 'Cancelled';
  }

  return status || '—';
};

const getStatusClass = (status) => {
  if (status === 'registrar_approved') return 'status-registrar-approved';
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  if (status === 'cancelled') return 'status-rejected';

  return 'status-pending';
};

const getChangeValue = (request, key) => {
  if (request?.requested_changes && request.requested_changes[key] !== undefined) {
    return request.requested_changes[key];
  }

  return request?.[key];
};

const ScheduleRequests = () => {
  const { lang } = useLanguage();
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const isRegistrar = profile?.role === 'registrar';

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);

  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [exceptionRequests, setExceptionRequests] = useState([]);

  const activeStatuses = isRegistrar
    ? ['pending']
    : ['pending', 'registrar_approved'];

  const activeScheduleRequests = useMemo(
    () => scheduleRequests.filter((item) => activeStatuses.includes(item.status)),
    [scheduleRequests, activeStatuses]
  );

  const activeTimeOffRequests = useMemo(
    () => timeOffRequests.filter((item) => activeStatuses.includes(item.status)),
    [timeOffRequests, activeStatuses]
  );

  const activeExceptionRequests = useMemo(
    () => exceptionRequests.filter((item) => activeStatuses.includes(item.status)),
    [exceptionRequests, activeStatuses]
  );

  const historyScheduleRequests = useMemo(
    () =>
      scheduleRequests.filter((item) =>
        ['approved', 'rejected', 'cancelled'].includes(item.status)
      ),
    [scheduleRequests]
  );

  const historyTimeOffRequests = useMemo(
    () =>
      timeOffRequests.filter((item) =>
        ['approved', 'rejected', 'cancelled'].includes(item.status)
      ),
    [timeOffRequests]
  );

  const historyExceptionRequests = useMemo(
    () =>
      exceptionRequests.filter((item) =>
        ['approved', 'rejected', 'cancelled'].includes(item.status)
      ),
    [exceptionRequests]
  );

  const activeTotal =
    activeScheduleRequests.length +
    activeTimeOffRequests.length +
    activeExceptionRequests.length;

  const historyTotal =
    historyScheduleRequests.length +
    historyTimeOffRequests.length +
    historyExceptionRequests.length;

  const toggleExpanded = (type, id) => {
    const key = `${type}-${id}`;
    setExpandedRequest((prev) => (prev === key ? null : key));
  };

  const loadRequests = async () => {
    try {
      setLoading(true);

      const [scheduleRes, timeOffRes, exceptionsRes] = await Promise.all([
        supabase
          .from('schedule_change_requests')
          .select('*, specialists(*), locations(*)')
          .in('status', [
            'pending',
            'registrar_approved',
            'approved',
            'rejected',
            'cancelled',
          ])
          .order('created_at', { ascending: false }),

        supabase
          .from('time_off_requests')
          .select('*, specialists(*)')
          .in('status', [
            'pending',
            'registrar_approved',
            'approved',
            'rejected',
            'cancelled',
          ])
          .order('created_at', { ascending: false }),

        supabase
          .from('specialist_schedule_exceptions')
          .select('*, specialists(*), locations(*)')
          .in('status', [
            'pending',
            'registrar_approved',
            'approved',
            'rejected',
            'cancelled',
          ])
          .order('created_at', { ascending: false }),
      ]);

      if (scheduleRes.error) throw scheduleRes.error;

      if (timeOffRes.error) {
        console.warn('time_off_requests loading failed:', timeOffRes.error);
      }

      if (exceptionsRes.error) {
        console.warn(
          'specialist_schedule_exceptions loading failed:',
          exceptionsRes.error
        );
      }

      setScheduleRequests(scheduleRes.data || []);
      setTimeOffRequests(timeOffRes.data || []);
      setExceptionRequests(exceptionsRes.data || []);
    } catch (error) {
      console.error('Schedule requests loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити запити: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load requests: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRequestStatus = async (table, id, nextStatus, type) => {
    setSavingId(`${type}-${id}`);

    try {
      const { error } = await supabase
        .from(table)
        .update({
          status: nextStatus,
          reviewed_by: profile?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await loadRequests();
    } catch (error) {
      console.error('Request status update failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося оновити статус: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to update status: ${error.message || 'Please try again'}`
      );
    } finally {
      setSavingId(null);
    }
  };

  const registrarConfirmRequest = async (table, id, type) => {
    await updateRequestStatus(table, id, 'registrar_approved', type);
  };

  const rejectRequest = async (table, id, type) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Ви точно хочете відхилити цей запит?'
        : 'Are you sure you want to reject this request?'
    );

    if (!confirmed) return;

    await updateRequestStatus(table, id, 'rejected', type);
  };

  const adminApproveSimpleRequest = async (table, id, type) => {
    await updateRequestStatus(table, id, 'approved', type);
  };

  const applyScheduleRequest = async (request) => {
    const requestType = request.request_type;

    if (requestType === 'schedule_delete') {
      if (!request.schedule_id) {
        throw new Error(
          lang === 'UA'
            ? 'У заявці немає ID графіка для видалення'
            : 'Request does not contain schedule ID for deletion'
        );
      }

      const { error } = await supabase
        .from('specialist_working_hours')
        .update({ is_active: false })
        .eq('id', request.schedule_id);

      if (error) throw error;

      return;
    }

    if (requestType === 'schedule_update') {
      if (!request.schedule_id) {
        throw new Error(
          lang === 'UA'
            ? 'У заявці немає ID графіка для редагування'
            : 'Request does not contain schedule ID for update'
        );
      }

      const { error } = await supabase
        .from('specialist_working_hours')
        .update({
          location_id: Number(getChangeValue(request, 'location_id')),
          day_of_week: Number(getChangeValue(request, 'day_of_week')),
          start_time: getChangeValue(request, 'start_time'),
          end_time: getChangeValue(request, 'end_time'),
          break_start: getChangeValue(request, 'break_start') || null,
          break_end: getChangeValue(request, 'break_end') || null,
          is_active: true,
        })
        .eq('id', request.schedule_id);

      if (error) throw error;

      return;
    }

    if (requestType === 'schedule_create') {
      const { error } = await supabase
        .from('specialist_working_hours')
        .insert({
          specialist_id: request.specialist_id,
          location_id: Number(getChangeValue(request, 'location_id')),
          day_of_week: Number(getChangeValue(request, 'day_of_week')),
          start_time: getChangeValue(request, 'start_time'),
          end_time: getChangeValue(request, 'end_time'),
          break_start: getChangeValue(request, 'break_start') || null,
          break_end: getChangeValue(request, 'break_end') || null,
          is_active: true,
        });

      if (error) throw error;

      return;
    }

    throw new Error(
      lang === 'UA'
        ? `Невідомий тип заявки: ${requestType}`
        : `Unknown request type: ${requestType}`
    );
  };

  const adminApproveScheduleRequest = async (request) => {
    setSavingId(`schedule-${request.id}`);

    try {
      await applyScheduleRequest(request);

      const { error } = await supabase
        .from('schedule_change_requests')
        .update({
          status: 'approved',
          reviewed_by: profile?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      await loadRequests();
    } catch (error) {
      console.error('Admin approve schedule failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося затвердити запит: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to approve request: ${error.message || 'Please try again'}`
      );
    } finally {
      setSavingId(null);
    }
  };

  const renderScheduleRequestCard = (request, isHistory = false) => {
    const day = days.find(
      (item) => Number(item.value) === Number(getChangeValue(request, 'day_of_week'))
    );

    const saving = savingId === `schedule-${request.id}`;
    const isOpen = expandedRequest === `schedule-${request.id}`;

    const locationLabel = [
      getLocationCity(request.locations, lang),
      getLocationName(request.locations, lang),
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <div
        key={`${isHistory ? 'history-' : ''}schedule-${request.id}`}
        className={`appointment-card ${isHistory ? 'request-history-card' : ''}`}
        onClick={isHistory ? () => toggleExpanded('schedule', request.id) : undefined}
      >
        <div className="request-history-main">
          <h3>
            {request.request_type === 'schedule_delete'
              ? lang === 'UA'
                ? 'Запит на видалення графіка'
                : 'Schedule deletion request'
              : lang === 'UA'
                ? 'Зміна регулярного графіка'
                : 'Regular schedule change'}
          </h3>

          <p>
            <strong>{lang === 'UA' ? 'Лікар:' : 'Doctor:'}</strong>{' '}
            {getDoctorName(request)}
          </p>

          <p>
            <strong>{lang === 'UA' ? 'Тип:' : 'Type:'}</strong>{' '}
            {getRequestTypeText(request.request_type, lang)}
          </p>

          <p>
            <strong>{lang === 'UA' ? 'Статус:' : 'Status:'}</strong>{' '}
            <span className={`status-pill ${getStatusClass(request.status)}`}>
              {getStatusText(request.status, lang)}
            </span>
          </p>
        </div>

        {(!isHistory || isOpen) && (
          <div className="request-details">
            <p>
              <strong>{lang === 'UA' ? 'Локація:' : 'Location:'}</strong>{' '}
              {locationLabel || '—'}
            </p>

            <p>
              <strong>{lang === 'UA' ? 'День:' : 'Day:'}</strong>{' '}
              {day?.[lang] || '—'}
            </p>

            <p>
              <strong>{lang === 'UA' ? 'Час:' : 'Time:'}</strong>{' '}
              {formatTime(getChangeValue(request, 'start_time'))}–{formatTime(
                getChangeValue(request, 'end_time')
              )}
            </p>

            {(getChangeValue(request, 'break_start') ||
              getChangeValue(request, 'break_end')) && (
              <p>
                <strong>{lang === 'UA' ? 'Перерва:' : 'Break:'}</strong>{' '}
                {formatTime(getChangeValue(request, 'break_start'))}–{formatTime(
                  getChangeValue(request, 'break_end')
                )}
              </p>
            )}

            {request.comment && (
              <p>
                <strong>{lang === 'UA' ? 'Коментар:' : 'Comment:'}</strong>{' '}
                {request.comment}
              </p>
            )}

            {request.reviewed_at && (
              <p>
                <strong>{lang === 'UA' ? 'Дата рішення:' : 'Decision date:'}</strong>{' '}
                {new Date(request.reviewed_at).toLocaleString(
                  lang === 'UA' ? 'uk-UA' : 'en-US'
                )}
              </p>
            )}
          </div>
        )}

        {!isHistory && (
          <div className="form-actions">
            {isRegistrar && request.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() =>
                    registrarConfirmRequest(
                      'schedule_change_requests',
                      request.id,
                      'schedule'
                    )
                  }
                >
                  {lang === 'UA' ? 'Підтвердити' : 'Confirm'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest(
                      'schedule_change_requests',
                      request.id,
                      'schedule'
                    )
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() => adminApproveScheduleRequest(request)}
                >
                  {lang === 'UA' ? 'Затвердити остаточно' : 'Final approve'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest(
                      'schedule_change_requests',
                      request.id,
                      'schedule'
                    )
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTimeOffRequestCard = (request, isHistory = false) => {
    const saving = savingId === `timeoff-${request.id}`;
    const isOpen = expandedRequest === `timeoff-${request.id}`;

    return (
      <div
        key={`${isHistory ? 'history-' : ''}timeoff-${request.id}`}
        className={`appointment-card ${isHistory ? 'request-history-card' : ''}`}
        onClick={isHistory ? () => toggleExpanded('timeoff', request.id) : undefined}
      >
        <div className="request-history-main">
          <h3>{lang === 'UA' ? 'Запит на відпустку' : 'Time off request'}</h3>

          <p>
            <strong>{lang === 'UA' ? 'Лікар:' : 'Doctor:'}</strong>{' '}
            {request.specialists?.name || '—'}
          </p>

          <p>
            <strong>{lang === 'UA' ? 'Статус:' : 'Status:'}</strong>{' '}
            <span className={`status-pill ${getStatusClass(request.status)}`}>
              {getStatusText(request.status, lang)}
            </span>
          </p>
        </div>

        {(!isHistory || isOpen) && (
          <div className="request-details">
            <p>
              <strong>{lang === 'UA' ? 'Період:' : 'Period:'}</strong>{' '}
              {request.start_date} — {request.end_date}
            </p>

            {request.reason && (
              <p>
                <strong>{lang === 'UA' ? 'Причина:' : 'Reason:'}</strong>{' '}
                {request.reason}
              </p>
            )}

            {request.reviewed_at && (
              <p>
                <strong>{lang === 'UA' ? 'Дата рішення:' : 'Decision date:'}</strong>{' '}
                {new Date(request.reviewed_at).toLocaleString(
                  lang === 'UA' ? 'uk-UA' : 'en-US'
                )}
              </p>
            )}
          </div>
        )}

        {!isHistory && (
          <div className="form-actions">
            {isRegistrar && request.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() =>
                    registrarConfirmRequest(
                      'time_off_requests',
                      request.id,
                      'timeoff'
                    )
                  }
                >
                  {lang === 'UA' ? 'Підтвердити' : 'Confirm'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest('time_off_requests', request.id, 'timeoff')
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() =>
                    adminApproveSimpleRequest(
                      'time_off_requests',
                      request.id,
                      'timeoff'
                    )
                  }
                >
                  {lang === 'UA' ? 'Затвердити остаточно' : 'Final approve'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest('time_off_requests', request.id, 'timeoff')
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExceptionRequestCard = (request, isHistory = false) => {
    const saving = savingId === `exception-${request.id}`;
    const isOpen = expandedRequest === `exception-${request.id}`;

    return (
      <div
        key={`${isHistory ? 'history-' : ''}exception-${request.id}`}
        className={`appointment-card ${isHistory ? 'request-history-card' : ''}`}
        onClick={isHistory ? () => toggleExpanded('exception', request.id) : undefined}
      >
        <div className="request-history-main">
          <h3>
            {lang === 'UA'
              ? 'Перерва / блокування / додаткові години'
              : 'Break / block / extra hours'}
          </h3>

          <p>
            <strong>{lang === 'UA' ? 'Лікар:' : 'Doctor:'}</strong>{' '}
            {request.specialists?.name || '—'}
          </p>

          <p>
            <strong>{lang === 'UA' ? 'Тип:' : 'Type:'}</strong> {request.type}
          </p>

          <p>
            <strong>{lang === 'UA' ? 'Статус:' : 'Status:'}</strong>{' '}
            <span className={`status-pill ${getStatusClass(request.status)}`}>
              {getStatusText(request.status, lang)}
            </span>
          </p>
        </div>

        {(!isHistory || isOpen) && (
          <div className="request-details">
            <p>
              <strong>{lang === 'UA' ? 'Дата:' : 'Date:'}</strong>{' '}
              {request.exception_date}
            </p>

            {request.locations && (
              <p>
                <strong>{lang === 'UA' ? 'Локація:' : 'Location:'}</strong>{' '}
                {getLocationName(request.locations, lang)}
              </p>
            )}

            {request.start_time && request.end_time && (
              <p>
                <strong>{lang === 'UA' ? 'Час:' : 'Time:'}</strong>{' '}
                {formatTime(request.start_time)}–{formatTime(request.end_time)}
              </p>
            )}

            {request.reason && (
              <p>
                <strong>{lang === 'UA' ? 'Причина:' : 'Reason:'}</strong>{' '}
                {request.reason}
              </p>
            )}

            {request.reviewed_at && (
              <p>
                <strong>{lang === 'UA' ? 'Дата рішення:' : 'Decision date:'}</strong>{' '}
                {new Date(request.reviewed_at).toLocaleString(
                  lang === 'UA' ? 'uk-UA' : 'en-US'
                )}
              </p>
            )}
          </div>
        )}

        {!isHistory && (
          <div className="form-actions">
            {isRegistrar && request.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() =>
                    registrarConfirmRequest(
                      'specialist_schedule_exceptions',
                      request.id,
                      'exception'
                    )
                  }
                >
                  {lang === 'UA' ? 'Підтвердити' : 'Confirm'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest(
                      'specialist_schedule_exceptions',
                      request.id,
                      'exception'
                    )
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() =>
                    adminApproveSimpleRequest(
                      'specialist_schedule_exceptions',
                      request.id,
                      'exception'
                    )
                  }
                >
                  {lang === 'UA' ? 'Затвердити остаточно' : 'Final approve'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() =>
                    rejectRequest(
                      'specialist_schedule_exceptions',
                      request.id,
                      'exception'
                    )
                  }
                >
                  {lang === 'UA' ? 'Відхилити' : 'Reject'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>{lang === 'UA' ? 'Запити лікарів' : 'Doctor requests'}</h1>

          <p>
            {isAdmin
              ? lang === 'UA'
                ? 'Остаточно затверджуйте або відхиляйте заявки лікарів.'
                : 'Final approve or reject doctor requests.'
              : lang === 'UA'
                ? 'Підтверджуйте або відхиляйте заявки лікарів перед передачею адміністратору.'
                : 'Confirm or reject doctor requests before admin approval.'}
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={loadRequests}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="section-heading">
        <div>
          <h2>{lang === 'UA' ? 'Активні запити' : 'Active requests'}</h2>

          <p>
            {activeTotal === 0
              ? lang === 'UA'
                ? 'Немає активних запитів.'
                : 'No active requests.'
              : lang === 'UA'
                ? `${activeTotal} активних запитів`
                : `${activeTotal} active requests`}
          </p>
        </div>
      </div>

      <div className="appointments-list">
        {activeScheduleRequests.map((request) =>
          renderScheduleRequestCard(request, false)
        )}

        {activeTimeOffRequests.map((request) =>
          renderTimeOffRequestCard(request, false)
        )}

        {activeExceptionRequests.map((request) =>
          renderExceptionRequestCard(request, false)
        )}

        {activeTotal === 0 && (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Немає активних запитів'
                : 'No active requests'}
            </p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="schedule-history-section">
          <div className="section-heading">
            <div>
              <h2>{lang === 'UA' ? 'Історія рішень' : 'Decision history'}</h2>

              <p>
                {lang === 'UA'
                  ? 'Клікніть на заявку, щоб побачити деталі.'
                  : 'Click a request to view details.'}
              </p>
            </div>
          </div>

          <div className="appointments-list">
            {historyScheduleRequests.map((request) =>
              renderScheduleRequestCard(request, true)
            )}

            {historyTimeOffRequests.map((request) =>
              renderTimeOffRequestCard(request, true)
            )}

            {historyExceptionRequests.map((request) =>
              renderExceptionRequestCard(request, true)
            )}

            {historyTotal === 0 && (
              <div className="empty-state">
                <p>
                  {lang === 'UA'
                    ? 'Історія поки порожня'
                    : 'History is empty'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRequests;