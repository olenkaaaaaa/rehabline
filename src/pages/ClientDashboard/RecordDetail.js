import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/client-record-detail.css';

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';
};

const getLocationAddress = (location, lang) => {
  return lang === 'UA'
    ? location?.address_ua || location?.address || ''
    : location?.address_en || location?.address_ua || location?.address || '';
};

const getStatusLabel = (status, lang) => {
  const labels = {
    pending: { UA: 'Очікує', EN: 'Pending' },
    confirmed: { UA: 'Підтверджено', EN: 'Confirmed' },
    cancelled: { UA: 'Скасовано', EN: 'Cancelled' },
    canceled: { UA: 'Скасовано', EN: 'Cancelled' },
    completed: { UA: 'Завершено', EN: 'Completed' },
  };

  return labels[status]?.[lang] || status || '—';
};

const normalizeStatusClass = (status) => {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
};

const RecordDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [service, setService] = useState(null);
  const [specialist, setSpecialist] = useState(null);
  const [location, setLocation] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAppointment = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', Number(id))
          .eq('client_id', user.id)
          .single();

        if (appointmentError) throw appointmentError;

        const [
          serviceResponse,
          specialistResponse,
          locationResponse,
          prescriptionsResponse,
        ] = await Promise.all([
          appointmentData.service_id
            ? supabase.from('services').select('*').eq('id', appointmentData.service_id).single()
            : Promise.resolve({ data: null, error: null }),

          appointmentData.specialist_id
            ? supabase.from('specialists').select('*').eq('id', appointmentData.specialist_id).single()
            : Promise.resolve({ data: null, error: null }),

          appointmentData.location_id
            ? supabase.from('locations').select('*').eq('id', appointmentData.location_id).single()
            : Promise.resolve({ data: null, error: null }),

          supabase
            .from('prescriptions')
            .select('*')
            .eq('appointment_id', Number(id))
            .order('created_at', { ascending: false }),
        ]);

        if (serviceResponse.error) throw serviceResponse.error;
        if (specialistResponse.error) throw specialistResponse.error;
        if (locationResponse.error) throw locationResponse.error;

        if (prescriptionsResponse.error) {
          console.warn('Prescriptions loading failed:', prescriptionsResponse.error);
        }

        if (!isMounted) return;

        setAppointment(appointmentData);
        setService(serviceResponse.data || null);
        setSpecialist(specialistResponse.data || null);
        setLocation(locationResponse.data || null);
        setPrescriptions(prescriptionsResponse.data || []);
      } catch (error) {
        console.error('Record detail loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити деталі запису'
            : 'Failed to load appointment details'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAppointment();

    return () => {
      isMounted = false;
    };
  }, [id, user, lang]);

  const preparedAppointment = useMemo(() => {
    if (!appointment) return null;

    return {
      ...appointment,
      date: appointment.appointment_date,
      time: String(appointment.appointment_time || '').slice(0, 5),
      serviceName: getServiceName(service, lang),
      specialistName: specialist?.name || '',
      locationName: getLocationName(location, lang),
      locationAddress: getLocationAddress(location, lang),
      duration: service?.duration_minutes || 45,
      clientNotes: appointment.client_notes || '',
      specialistNotes: appointment.specialist_notes || '',
    };
  }, [appointment, service, specialist, location, lang]);

  const isFuture = () => {
    if (!preparedAppointment?.date || !preparedAppointment?.time) return false;

    const visitDate = new Date(`${preparedAppointment.date}T${preparedAppointment.time}:00`);
    return visitDate.getTime() > Date.now();
  };

  const getGoogleCalendarUrl = () => {
    if (!preparedAppointment) return '#';

    const start = new Date(`${preparedAppointment.date}T${preparedAppointment.time}:00`);
    const end = new Date(start);

    end.setMinutes(end.getMinutes() + Number(preparedAppointment.duration || 45));

    const formatForGoogle = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const text = encodeURIComponent(
      `${lang === 'UA' ? 'Візит RehabLine' : 'RehabLine appointment'}: ${preparedAppointment.serviceName}`
    );

    const details = encodeURIComponent(
      `${lang === 'UA' ? 'Спеціаліст' : 'Specialist'}: ${preparedAppointment.specialistName}`
    );

    const mapLocation = encodeURIComponent(
      `${preparedAppointment.locationName} ${preparedAppointment.locationAddress}`.trim()
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatForGoogle(start)}/${formatForGoogle(end)}&details=${details}&location=${mapLocation}`;
  };

  const handleCancel = async () => {
    if (!preparedAppointment) return;

    const confirmed = window.confirm(
      lang === 'UA' ? 'Скасувати запис?' : 'Cancel appointment?'
    );

    if (!confirmed) return;

    try {
      setCancelling(true);

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
        })
        .eq('id', preparedAppointment.id)
        .eq('client_id', user.id);

      if (error) throw error;

      setAppointment((prev) => ({
        ...prev,
        status: 'cancelled',
      }));

      alert(lang === 'UA' ? 'Запис скасовано' : 'Appointment cancelled');
    } catch (error) {
      console.error('Cancel appointment failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося скасувати запис'
          : 'Failed to cancel appointment'
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    if (!preparedAppointment) return;

    navigate(
      `/booking?specialist=${preparedAppointment.specialist_id}&service=${preparedAppointment.service_id}&location=${preparedAppointment.location_id}`
    );
  };

  if (loading) {
    return (
      <div className="record-detail">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Деталі запису' : 'Appointment details'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (pageError || !preparedAppointment) {
    return (
      <div className="record-detail">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Деталі запису' : 'Appointment details'}
        </h1>

        <div className="empty-state">
          <p>
            {pageError ||
              (lang === 'UA' ? 'Запис не знайдено' : 'Appointment not found')}
          </p>

          <Link to="/client/records" className="btn-primary">
            {lang === 'UA' ? 'До моїх записів' : 'Back to my records'}
          </Link>
        </div>
      </div>
    );
  }

  const canEdit =
    preparedAppointment.status !== 'cancelled' &&
    preparedAppointment.status !== 'canceled' &&
    preparedAppointment.status !== 'completed' &&
    isFuture();

  return (
    <div className="record-detail">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Деталі запису' : 'Appointment details'}
      </h1>

      <div className="record-card">
        <div className="record-status">
          <span className={`status-badge status-${normalizeStatusClass(preparedAppointment.status)}`}>
            {getStatusLabel(preparedAppointment.status, lang)}
          </span>
        </div>

        <div className="record-info-grid">
          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Номер запису' : 'Appointment ID'}:
            </span>
            <span className="info-value">#{preparedAppointment.id}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Послуга' : 'Service'}:
            </span>
            <span className="info-value">{preparedAppointment.serviceName || '—'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Дата та час' : 'Date & time'}:
            </span>
            <span className="info-value">
              {preparedAppointment.date} • {preparedAppointment.time}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Локація' : 'Location'}:
            </span>
            <span className="info-value">
              {preparedAppointment.locationName || '—'}
              {preparedAppointment.locationAddress
                ? `, ${preparedAppointment.locationAddress}`
                : ''}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Спеціаліст' : 'Specialist'}:
            </span>
            <span className="info-value">{preparedAppointment.specialistName || '—'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {lang === 'UA' ? 'Ваш коментар' : 'Your notes'}:
            </span>
            <span className="info-value">{preparedAppointment.clientNotes || '—'}</span>
          </div>

          {preparedAppointment.specialistNotes && (
            <div className="info-row specialist-notes">
              <span className="info-label">
                {lang === 'UA' ? 'Нотатки спеціаліста' : "Specialist's notes"}:
              </span>
              <span className="info-value">{preparedAppointment.specialistNotes}</span>
            </div>
          )}
        </div>

        {prescriptions.length > 0 && (
          <div className="prescriptions-section">
            <h3>{lang === 'UA' ? 'Рекомендації' : 'Recommendations'}</h3>

            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="prescription-mini">
                <h4>
                  {lang === 'UA'
                    ? prescription.title_ua || prescription.title || ''
                    : prescription.title_en || prescription.title_ua || prescription.title || ''}
                </h4>

                <p>
                  {lang === 'UA'
                    ? prescription.description_ua || prescription.description || ''
                    : prescription.description_en ||
                      prescription.description_ua ||
                      prescription.description ||
                      ''}
                </p>

                {prescription.file_url && (
                  <a href={prescription.file_url} className="btn-link" download>
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

          {canEdit && (
            <>
              <button className="btn-outline" onClick={handleReschedule}>
                {lang === 'UA' ? 'Перенести' : 'Reschedule'}
              </button>

              <button
                className="btn-outline"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? lang === 'UA'
                    ? 'Скасування...'
                    : 'Cancelling...'
                  : lang === 'UA'
                    ? 'Скасувати'
                    : 'Cancel'}
              </button>
            </>
          )}

          {preparedAppointment.status !== 'cancelled' &&
            preparedAppointment.status !== 'canceled' &&
            preparedAppointment.status !== 'completed' && (
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                📅 {lang === 'UA' ? 'Google Календар' : 'Google Calendar'}
              </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;