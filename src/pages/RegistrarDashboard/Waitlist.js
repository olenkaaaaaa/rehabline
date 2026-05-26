import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/registrar-waiting-list.css';

const getServiceName = (service, lang) => {
  if (!service) return '';
  return lang === 'UA'
    ? service.name_ua || service.name || service.name_en || ''
    : service.name_en || service.name_ua || service.name || '';
};

const getLocationName = (location, lang) => {
  if (!location) return '';
  return lang === 'UA'
    ? location.name_ua || location.name || location.name_en || ''
    : location.name_en || location.name_ua || location.name || '';
};

const getStatusLabel = (status, lang) => {
  const labels = {
    waiting: {
      UA: 'Очікує',
      EN: 'Waiting',
    },
    contacted: {
      UA: 'Зв’язались',
      EN: 'Contacted',
    },
    scheduled: {
      UA: 'Записано',
      EN: 'Scheduled',
    },
    cancelled: {
      UA: 'Скасовано',
      EN: 'Cancelled',
    },
  };

  return labels[status]?.[lang] || status || '—';
};

const defaultForm = {
  client_id: '',
  service_id: '',
  specialist_id: '',
  location_id: '',
  preferred_days: '',
  preferred_time: '',
  comment: '',
};

const WaitingList = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [waitingItems, setWaitingItems] = useState([]);

  const [form, setForm] = useState(defaultForm);
  const [selectedStatus, setSelectedStatus] = useState('waiting');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        clientsResponse,
        servicesResponse,
        specialistsResponse,
        locationsResponse,
        waitingResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role')
          .in('role', ['client', 'patient'])
          .order('full_name', { ascending: true }),

        supabase
          .from('services')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('specialists')
          .select('*')
          .order('name', { ascending: true }),

        supabase
          .from('locations')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('waiting_list')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (clientsResponse.error) throw clientsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (specialistsResponse.error) throw specialistsResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (waitingResponse.error) throw waitingResponse.error;

      setClients(clientsResponse.data || []);
      setServices(servicesResponse.data || []);
      setSpecialists(specialistsResponse.data || []);
      setLocations(locationsResponse.data || []);
      setWaitingItems(waitingResponse.data || []);
    } catch (error) {
      console.error('Waiting list loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити лист очікування: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load waiting list: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedWaitingItems = useMemo(() => {
    return waitingItems.map((item) => {
      const client = clients.find((row) => String(row.id) === String(item.client_id));
      const service = services.find((row) => Number(row.id) === Number(item.service_id));
      const specialist = specialists.find((row) => Number(row.id) === Number(item.specialist_id));
      const location = locations.find((row) => Number(row.id) === Number(item.location_id));

      return {
        ...item,
        clientName: client?.full_name || client?.email || 'Клієнт',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
        serviceName: getServiceName(service, lang),
        specialistName: specialist?.name || '',
        locationName: getLocationName(location, lang),
      };
    });
  }, [waitingItems, clients, services, specialists, locations, lang]);

  const activeQueue = useMemo(() => {
    return enrichedWaitingItems.filter((item) => item.status === 'waiting');
  }, [enrichedWaitingItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return enrichedWaitingItems.filter((item) => {
      const matchesStatus = !selectedStatus || item.status === selectedStatus;

      const searchText = [
        item.clientName,
        item.clientPhone,
        item.clientEmail,
        item.serviceName,
        item.specialistName,
        item.locationName,
        item.preferred_days,
        item.preferred_time,
        item.comment,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [enrichedWaitingItems, selectedStatus, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.client_id) {
      alert(lang === 'UA' ? 'Оберіть пацієнта' : 'Choose patient');
      return false;
    }

    if (!form.service_id) {
      alert(lang === 'UA' ? 'Оберіть послугу' : 'Choose service');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        client_id: form.client_id,
        service_id: Number(form.service_id),
        specialist_id: form.specialist_id ? Number(form.specialist_id) : null,
        location_id: form.location_id ? Number(form.location_id) : null,
        preferred_days: form.preferred_days.trim() || null,
        preferred_time: form.preferred_time.trim() || null,
        comment: form.comment.trim() || null,
        status: 'waiting',
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('waiting_list')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      setWaitingItems((prev) => [data, ...prev]);
      setForm(defaultForm);

      alert(
        lang === 'UA'
          ? 'Пацієнта додано в лист очікування'
          : 'Patient added to waiting list'
      );
    } catch (error) {
      console.error('Waiting list insert failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося додати в лист очікування: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to add to waiting list: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (itemId, status) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('waiting_list')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select('*')
        .single();

      if (error) throw error;

      setWaitingItems((prev) =>
        prev.map((item) => (item.id === itemId ? data : item))
      );
    } catch (error) {
      console.error('Waiting list status update failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося оновити статус: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to update status: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Видалити пацієнта з листа очікування?'
        : 'Remove patient from waiting list?'
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('waiting_list')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWaitingItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Waiting list delete failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося видалити: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to delete: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const createAppointmentFromWaitingItem = (item) => {
    const params = new URLSearchParams();

    if (item.client_id) params.set('client', item.client_id);
    if (item.service_id) params.set('service', item.service_id);
    if (item.specialist_id) params.set('specialist', item.specialist_id);
    if (item.location_id) params.set('location', item.location_id);

    navigate(`/registrar/create-appointment?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="registrar-waiting-page">
        <div className="section-eyebrow">
          {lang === 'UA' ? 'Реєстратор' : 'Registrar'}
        </div>

        <h1>{lang === 'UA' ? 'Лист очікування' : 'Waiting list'}</h1>

        <div className="empty-state">
          {lang === 'UA' ? 'Завантаження...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-waiting-page">
      <div className="section-eyebrow">
        {lang === 'UA' ? 'Реєстратор' : 'Registrar'}
      </div>

      <div className="waiting-page-header">
        <div>
          <h1>{lang === 'UA' ? 'Лист очікування' : 'Waiting list'}</h1>

          <p>
            {lang === 'UA'
              ? 'Додавайте пацієнтів у чергу, пропонуйте вільні слоти та створюйте записи.'
              : 'Add patients to queue, offer available slots and create appointments.'}
          </p>
        </div>

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="waiting-layout">
        <section className="waiting-card waiting-form-card">
          <div className="card-title-row">
            <div>
              <h2>
                {lang === 'UA'
                  ? 'Додати в очікування'
                  : 'Add to waiting list'}
              </h2>

              <p>
                {lang === 'UA'
                  ? 'У лист очікування додаються тільки клієнти.'
                  : 'Only clients can be added to the waiting list.'}
              </p>
            </div>
          </div>

          <form className="waiting-form" onSubmit={handleSubmit}>
            <div className="waiting-grid">
              <div className="form-group">
                <label>{lang === 'UA' ? 'Пацієнт' : 'Patient'}</label>

                <select
                  name="client_id"
                  value={form.client_id}
                  onChange={handleChange}
                  disabled={saving}
                  required
                >
                  <option value="">
                    {lang === 'UA' ? 'Оберіть пацієнта' : 'Choose patient'}
                  </option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.email}
                      {client.phone ? ` • ${client.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Послуга' : 'Service'}</label>

                <select
                  name="service_id"
                  value={form.service_id}
                  onChange={handleChange}
                  disabled={saving}
                  required
                >
                  <option value="">
                    {lang === 'UA' ? 'Оберіть послугу' : 'Choose service'}
                  </option>

                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {getServiceName(service, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Бажаний лікар' : 'Preferred specialist'}</label>

                <select
                  name="specialist_id"
                  value={form.specialist_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    {lang === 'UA' ? 'Будь-який лікар' : 'Any specialist'}
                  </option>

                  {specialists.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Бажана локація' : 'Preferred location'}</label>

                <select
                  name="location_id"
                  value={form.location_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    {lang === 'UA' ? 'Будь-яка локація' : 'Any location'}
                  </option>

                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {getLocationName(location, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Бажані дні' : 'Preferred days'}</label>

                <input
                  type="text"
                  name="preferred_days"
                  value={form.preferred_days}
                  onChange={handleChange}
                  placeholder={lang === 'UA' ? 'Напр. пн, ср, пт' : 'E.g. Mon, Wed, Fri'}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Бажаний час' : 'Preferred time'}</label>

                <input
                  type="text"
                  name="preferred_time"
                  value={form.preferred_time}
                  onChange={handleChange}
                  placeholder={lang === 'UA' ? 'Напр. після 15:00' : 'E.g. after 15:00'}
                  disabled={saving}
                />
              </div>

              <div className="form-group waiting-grid-full">
                <label>{lang === 'UA' ? 'Коментар' : 'Comment'}</label>

                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  rows="4"
                  disabled={saving}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary waiting-submit"
              disabled={saving}
            >
              {saving
                ? lang === 'UA'
                  ? 'Додавання...'
                  : 'Adding...'
                : lang === 'UA'
                  ? 'Додати в лист очікування'
                  : 'Add to waiting list'}
            </button>
          </form>
        </section>

        <aside className="waiting-card active-queue-card">
          <h2>{lang === 'UA' ? 'Активна черга' : 'Active queue'}</h2>

          <p>
            {activeQueue.length}{' '}
            {lang === 'UA' ? 'активних запитів' : 'active requests'}
          </p>

          {activeQueue.length > 0 ? (
            <div className="active-queue-list">
              {activeQueue.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="queue-mini-card"
                  onClick={() => setSearch(item.clientName)}
                >
                  <strong>{item.clientName}</strong>
                  <span>{item.serviceName || '—'}</span>
                  <small>
                    {item.preferred_days || '—'} · {item.preferred_time || '—'}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-mini">
              {lang === 'UA'
                ? 'Лист очікування порожній'
                : 'Waiting list is empty'}
            </div>
          )}
        </aside>
      </div>

      <section className="waiting-card waiting-table-card">
        <div className="waiting-table-header">
          <div>
            <h2>{lang === 'UA' ? 'Усі заявки' : 'All requests'}</h2>

            <p>
              {lang === 'UA'
                ? 'Керуйте статусами, створюйте записи або прибирайте неактуальні заявки.'
                : 'Manage statuses, create appointments or remove outdated requests.'}
            </p>
          </div>

          <div className="waiting-filters">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                lang === 'UA'
                  ? 'Пошук: пацієнт, телефон, послуга...'
                  : 'Search: patient, phone, service...'
              }
            />

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="">
                {lang === 'UA' ? 'Усі статуси' : 'All statuses'}
              </option>
              <option value="waiting">
                {lang === 'UA' ? 'Очікує' : 'Waiting'}
              </option>
              <option value="contacted">
                {lang === 'UA' ? 'Зв’язались' : 'Contacted'}
              </option>
              <option value="scheduled">
                {lang === 'UA' ? 'Записано' : 'Scheduled'}
              </option>
              <option value="cancelled">
                {lang === 'UA' ? 'Скасовано' : 'Cancelled'}
              </option>
            </select>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="waiting-table-wrapper">
            <table className="waiting-table">
              <thead>
                <tr>
                  <th>{lang === 'UA' ? 'Пацієнт' : 'Patient'}</th>
                  <th>{lang === 'UA' ? 'Послуга' : 'Service'}</th>
                  <th>{lang === 'UA' ? 'Лікар' : 'Specialist'}</th>
                  <th>{lang === 'UA' ? 'Локація' : 'Location'}</th>
                  <th>{lang === 'UA' ? 'Побажання' : 'Preferences'}</th>
                  <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                  <th>{lang === 'UA' ? 'Дії' : 'Actions'}</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.clientName}</strong>
                      <span>{item.clientPhone || item.clientEmail || '—'}</span>
                    </td>

                    <td>{item.serviceName || '—'}</td>

                    <td>{item.specialistName || (lang === 'UA' ? 'Будь-який' : 'Any')}</td>

                    <td>{item.locationName || (lang === 'UA' ? 'Будь-яка' : 'Any')}</td>

                    <td>
                      <div className="preference-cell">
                        <span>{item.preferred_days || '—'}</span>
                        <span>{item.preferred_time || '—'}</span>
                        {item.comment && <small>{item.comment}</small>}
                      </div>
                    </td>

                    <td>
                      <span className={`waiting-status waiting-status-${item.status}`}>
                        {getStatusLabel(item.status, lang)}
                      </span>
                    </td>

                    <td>
                      <div className="waiting-actions">
                        <button
                          type="button"
                          onClick={() => createAppointmentFromWaitingItem(item)}
                          disabled={saving || item.status === 'scheduled'}
                        >
                          {lang === 'UA' ? 'Запис' : 'Book'}
                        </button>

                        {item.status === 'waiting' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'contacted')}
                            disabled={saving}
                          >
                            {lang === 'UA' ? 'Зв’язались' : 'Contacted'}
                          </button>
                        )}

                        {item.status !== 'scheduled' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'scheduled')}
                            disabled={saving}
                          >
                            {lang === 'UA' ? 'Записано' : 'Scheduled'}
                          </button>
                        )}

                        {item.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'cancelled')}
                            disabled={saving}
                          >
                            {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="danger"
                          onClick={() => deleteItem(item.id)}
                          disabled={saving}
                        >
                          {lang === 'UA' ? 'Видалити' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            {lang === 'UA'
              ? 'Заявок у листі очікування не знайдено'
              : 'No waiting list requests found'}
          </div>
        )}
      </section>
    </div>
  );
};

export default WaitingList;