import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/specialist-appointments.css';

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

const getStatusLabel = (status, lang) => {
  const labels = {
    pending: { UA: 'Очікує', EN: 'Pending' },
    confirmed: { UA: 'Підтверджено', EN: 'Confirmed' },
    completed: { UA: 'Завершено', EN: 'Completed' },
    cancelled: { UA: 'Скасовано', EN: 'Cancelled' },
    canceled: { UA: 'Скасовано', EN: 'Cancelled' },
  };

  return labels[status]?.[lang] || status || '—';
};

const normalizeStatusClass = (status) => {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
};

const SpecialistAppointments = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [specialist, setSpecialist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    searchParams.get('appointment') ? Number(searchParams.get('appointment')) : null
  );
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(searchParams.get('appointment'))
  );

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const [specialistNotes, setSpecialistNotes] = useState('');
  const [prescriptionTitle, setPrescriptionTitle] = useState('');
  const [prescriptionDescription, setPrescriptionDescription] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const { data: specialistData, error: specialistError } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (specialistError) throw specialistError;

        if (!specialistData) {
          throw new Error(
            lang === 'UA'
              ? 'Ваш акаунт не прив’язаний до спеціаліста'
              : 'Your account is not linked to a specialist'
          );
        }

        const [
          appointmentsResponse,
          servicesResponse,
          locationsResponse,
          profilesResponse,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('specialist_id', specialistData.id)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false }),

          supabase.from('services').select('*'),
          supabase.from('locations').select('*'),
          supabase.from('profiles').select('*'),
        ]);

        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;

        if (profilesResponse.error) {
          console.warn('Profiles loading failed:', profilesResponse.error);
        }

        if (!isMounted) return;

        setSpecialist(specialistData);
        setAppointments(appointmentsResponse.data || []);
        setServices(servicesResponse.data || []);
        setLocations(locationsResponse.data || []);
        setProfiles(profilesResponse.data || []);
      } catch (error) {
        console.error('Specialist appointments loading failed:', error);

        if (!isMounted) return;

        setPageError(
          error.message ||
            (lang === 'UA'
              ? 'Не вдалося завантажити записи'
              : 'Failed to load appointments')
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const enrichedAppointments = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((item) => item.id === appointment.service_id);
      const location = locations.find((item) => item.id === appointment.location_id);
      const client = profiles.find((item) => item.id === appointment.client_id);

      return {
        ...appointment,
        date: appointment.appointment_date,
        time: String(appointment.appointment_time || '').slice(0, 5),
        serviceName: getServiceName(service, lang),
        locationName: getLocationName(location, lang),
        clientName: client?.full_name || client?.name || client?.email || 'Клієнт',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
      };
    });
  }, [appointments, services, locations, profiles, lang]);

  const filteredAppointments = useMemo(() => {
    return enrichedAppointments.filter((appointment) => {
      const matchesStatus = !filterStatus || appointment.status === filterStatus;
      const matchesDate = !filterDate || appointment.date === filterDate;

      return matchesStatus && matchesDate;
    });
  }, [enrichedAppointments, filterStatus, filterDate]);

  const selectedAppointment = useMemo(() => {
    return enrichedAppointments.find((item) => item.id === selectedAppointmentId) || null;
  }, [enrichedAppointments, selectedAppointmentId]);

  useEffect(() => {
    if (selectedAppointment) {
      setSpecialistNotes(selectedAppointment.specialist_notes || '');
      setPrescriptionTitle('');
      setPrescriptionDescription('');
    }
  }, [selectedAppointment]);

  const openDetails = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    if (!specialist?.id) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .eq('specialist_id', specialist.id)
        .select('*')
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((item) => (item.id === appointmentId ? data : item))
      );
    } catch (error) {
      console.error('Status update failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося оновити статус'
          : 'Failed to update status'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedAppointment || !specialist?.id) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('appointments')
        .update({
          specialist_notes: specialistNotes.trim() || null,
        })
        .eq('id', selectedAppointment.id)
        .eq('specialist_id', specialist.id)
        .select('*')
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((item) => (item.id === selectedAppointment.id ? data : item))
      );

      alert(lang === 'UA' ? 'Нотатку збережено' : 'Note saved');
    } catch (error) {
      console.error('Save notes failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося зберегти нотатку'
          : 'Failed to save note'
      );
    } finally {
      setSaving(false);
    }
  };

  const createPrescription = async () => {
    if (!selectedAppointment || !specialist?.id) return;

    if (!prescriptionTitle.trim() || !prescriptionDescription.trim()) {
      alert(
        lang === 'UA'
          ? 'Заповніть назву і опис рекомендації'
          : 'Fill in title and description'
      );
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('prescriptions').insert({
        client_id: selectedAppointment.client_id,
        appointment_id: selectedAppointment.id,
        specialist_id: specialist.id,
        title: prescriptionTitle.trim(),
        title_ua: prescriptionTitle.trim(),
        description: prescriptionDescription.trim(),
        description_ua: prescriptionDescription.trim(),
      });

      if (error) throw error;

      setPrescriptionTitle('');
      setPrescriptionDescription('');

      alert(
        lang === 'UA'
          ? 'Рекомендацію створено'
          : 'Recommendation created'
      );
    } catch (error) {
      console.error('Create prescription failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося створити рекомендацію'
          : 'Failed to create recommendation'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="specialist-appointments">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Записи' : 'Appointments'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-appointments">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Записи' : 'Appointments'}
      </h1>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      <div className="specialist-workspace specialist-workspace-full">
        <section className="workspace-main">
          <div className="records-header">
            <div className="records-actions specialist-appointment-filters">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">
                  {lang === 'UA' ? 'Усі статуси' : 'All statuses'}
                </option>
                <option value="pending">
                  {lang === 'UA' ? 'Очікує' : 'Pending'}
                </option>
                <option value="confirmed">
                  {lang === 'UA' ? 'Підтверджено' : 'Confirmed'}
                </option>
                <option value="completed">
                  {lang === 'UA' ? 'Завершено' : 'Completed'}
                </option>
                <option value="cancelled">
                  {lang === 'UA' ? 'Скасовано' : 'Cancelled'}
                </option>
              </select>
            </div>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="appointments-table-wrapper">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
                    <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                    <th>{lang === 'UA' ? 'Клієнт' : 'Client'}</th>
                    <th>{lang === 'UA' ? 'Телефон' : 'Phone'}</th>
                    <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                    <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
                    <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                    <th>{lang === 'UA' ? 'Дія' : 'Action'}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className={
                        selectedAppointmentId === appointment.id ? 'selected-row' : ''
                      }
                    >
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.clientName}</td>
                      <td>{appointment.clientPhone || '—'}</td>
                      <td>{appointment.serviceName || '—'}</td>
                      <td>{appointment.locationName || '—'}</td>
                      <td>
                        <span
                          className={`status-badge status-${normalizeStatusClass(
                            appointment.status
                          )}`}
                        >
                          {getStatusLabel(appointment.status, lang)}
                        </span>
                      </td>
                      <td className="table-action-cell">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => openDetails(appointment.id)}
                        >
                          {lang === 'UA' ? 'Деталі' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Записів не знайдено'
                  : 'No appointments found'}
              </p>
            </div>
          )}
        </section>
      </div>

      {detailsOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div
            className="modal-content appointment-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{lang === 'UA' ? 'Деталі запису' : 'Appointment details'}</h2>
                <p>
                  {lang === 'UA' ? 'Запис' : 'Appointment'} #{selectedAppointment.id}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            <div className="appointment-details-grid">
              <div className="detail-item">
                <span>{lang === 'UA' ? 'Клієнт' : 'Client'}</span>
                <strong>{selectedAppointment.clientName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Телефон' : 'Phone'}</span>
                <strong>{selectedAppointment.clientPhone || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>Email</span>
                <strong>{selectedAppointment.clientEmail || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Послуга' : 'Service'}</span>
                <strong>{selectedAppointment.serviceName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Дата' : 'Date'}</span>
                <strong>{selectedAppointment.date || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Час' : 'Time'}</span>
                <strong>{selectedAppointment.time || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Локація' : 'Location'}</span>
                <strong>{selectedAppointment.locationName || '—'}</strong>
              </div>

              <div className="detail-item">
                <span>{lang === 'UA' ? 'Статус' : 'Status'}</span>
                <strong>{getStatusLabel(selectedAppointment.status, lang)}</strong>
              </div>
            </div>

            {selectedAppointment.client_notes && (
              <div className="detail-note">
                <span>{lang === 'UA' ? 'Коментар клієнта' : 'Client notes'}</span>
                <p>{selectedAppointment.client_notes}</p>
              </div>
            )}

            <div className="modal-actions appointment-modal-actions">
              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() =>
                  updateAppointmentStatus(selectedAppointment.id, 'confirmed')
                }
              >
                {lang === 'UA' ? 'Підтвердити' : 'Confirm'}
              </button>

              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() =>
                  updateAppointmentStatus(selectedAppointment.id, 'completed')
                }
              >
                {lang === 'UA' ? 'Завершити' : 'Complete'}
              </button>

              <button
                type="button"
                className="btn-outline"
                disabled={saving}
                onClick={() =>
                  updateAppointmentStatus(selectedAppointment.id, 'cancelled')
                }
              >
                {lang === 'UA' ? 'Скасувати' : 'Cancel'}
              </button>
            </div>

            <div className="detail-note">
              <span>
                {lang === 'UA' ? 'Нотатка спеціаліста' : 'Specialist note'}
              </span>

              <textarea
                rows="4"
                value={specialistNotes}
                onChange={(e) => setSpecialistNotes(e.target.value)}
                disabled={saving}
              />

              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={saveNotes}
              >
                {saving
                  ? lang === 'UA'
                    ? 'Збереження...'
                    : 'Saving...'
                  : lang === 'UA'
                    ? 'Зберегти нотатку'
                    : 'Save note'}
              </button>
            </div>

            <div className="detail-note">
              <h3>
                {lang === 'UA' ? 'Рекомендація клієнту' : 'Client recommendation'}
              </h3>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Назва' : 'Title'}</label>
                <input
                  type="text"
                  value={prescriptionTitle}
                  onChange={(e) => setPrescriptionTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Опис' : 'Description'}</label>
                <textarea
                  rows="4"
                  value={prescriptionDescription}
                  onChange={(e) => setPrescriptionDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={createPrescription}
              >
                {saving
                  ? lang === 'UA'
                    ? 'Створення...'
                    : 'Creating...'
                  : lang === 'UA'
                    ? 'Створити рекомендацію'
                    : 'Create recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistAppointments;