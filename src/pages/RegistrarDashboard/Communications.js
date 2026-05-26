import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/registrar-communications.css';

const formatDateTime = (value, lang) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(lang === 'UA' ? 'uk-UA' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const defaultForm = {
  client_id: '',
  subject: '',
  message: '',
};

const Communications = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);

  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [clientsResponse, messagesResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role')
          .in('role', ['client', 'patient'])
          .order('full_name', { ascending: true }),

        supabase
          .from('client_messages')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (clientsResponse.error) throw clientsResponse.error;
      if (messagesResponse.error) throw messagesResponse.error;

      setClients(clientsResponse.data || []);
      setMessages(messagesResponse.data || []);
    } catch (error) {
      console.error('Communications loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити звернення: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load messages: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedMessages = useMemo(() => {
    return messages.map((message) => {
      const client = clients.find(
        (item) => String(item.id) === String(message.client_id)
      );

      return {
        ...message,
        clientName:
          client?.full_name ||
          client?.email ||
          (lang === 'UA' ? 'Клієнт' : 'Client'),
        clientPhone: client?.phone || '',
        clientEmail: client?.email || '',
      };
    });
  }, [messages, clients, lang]);

  const filteredMessages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return enrichedMessages.filter((message) => {
      const matchesReadFilter =
        !readFilter ||
        (readFilter === 'unread' && !message.is_read) ||
        (readFilter === 'read' && message.is_read);

      const searchText = [
        message.clientName,
        message.clientPhone,
        message.clientEmail,
        message.subject,
        message.message,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesReadFilter && matchesSearch;
    });
  }, [enrichedMessages, search, readFilter]);

  const selectedMessage = useMemo(() => {
    return (
      enrichedMessages.find(
        (message) => Number(message.id) === Number(selectedMessageId)
      ) || null
    );
  }, [enrichedMessages, selectedMessageId]);

  const unreadCount = useMemo(() => {
    return enrichedMessages.filter((message) => !message.is_read).length;
  }, [enrichedMessages]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.client_id) {
      alert(lang === 'UA' ? 'Оберіть клієнта' : 'Choose client');
      return false;
    }

    if (!form.subject.trim()) {
      alert(lang === 'UA' ? 'Введіть тему' : 'Enter subject');
      return false;
    }

    if (!form.message.trim()) {
      alert(lang === 'UA' ? 'Введіть текст повідомлення' : 'Enter message text');
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
        created_by: user?.id || null,
        subject: form.subject.trim(),
        message: form.message.trim(),
        is_read: false,
        read_at: null,
      };

      const { data, error } = await supabase
        .from('client_messages')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      setMessages((prev) => [data, ...prev]);
      setForm(defaultForm);
      setSelectedMessageId(data.id);

      alert(
        lang === 'UA'
          ? 'Повідомлення надіслано в кабінет клієнта'
          : 'Message sent to client cabinet'
      );
    } catch (error) {
      console.error('Message create failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося створити повідомлення: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to create message: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setForm(defaultForm);
  };

  if (loading) {
    return (
      <div className="registrar-communications-page">
        <h1>{lang === 'UA' ? 'Звернення' : 'Messages'}</h1>

        <div className="empty-state">
          {lang === 'UA' ? 'Завантаження...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-communications-page">
      <div className="communications-header">
        <div>
          <div className="section-eyebrow">
            {lang === 'UA' ? 'Реєстратор' : 'Registrar'}
          </div>

          <h1>{lang === 'UA' ? 'Звернення' : 'Messages'}</h1>

          <p>
            {lang === 'UA'
              ? 'Створюйте внутрішні повідомлення для клієнтів. Вони будуть доступні у кабінеті клієнта.'
              : 'Create internal messages for clients. They will be available in the client cabinet.'}
          </p>
        </div>

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="communications-stats">
        <div className="communication-stat-card">
          <span>{lang === 'UA' ? 'Усього повідомлень' : 'Total messages'}</span>
          <strong>{enrichedMessages.length}</strong>
        </div>

        <div className="communication-stat-card">
          <span>{lang === 'UA' ? 'Непрочитані клієнтами' : 'Unread by clients'}</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="communication-stat-card">
          <span>{lang === 'UA' ? 'Прочитані' : 'Read'}</span>
          <strong>{enrichedMessages.length - unreadCount}</strong>
        </div>
      </div>

      <div className="communications-layout">
        <section className="communication-card create-message-card">
          <h2>
            {lang === 'UA'
              ? 'Створити повідомлення клієнту'
              : 'Create message for client'}
          </h2>

          <form className="communication-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{lang === 'UA' ? 'Клієнт' : 'Client'}</label>

              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть клієнта' : 'Choose client'}
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email}
                    {client.phone ? ` · ${client.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Тема' : 'Subject'}</label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                disabled={saving}
                placeholder={
                  lang === 'UA'
                    ? 'Наприклад: Уточнення щодо запису'
                    : 'For example: Appointment clarification'
                }
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Текст' : 'Message'}</label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                disabled={saving}
                rows="5"
                placeholder={
                  lang === 'UA'
                    ? 'Напишіть повідомлення, яке клієнт побачить у своєму кабінеті...'
                    : 'Write the message that the client will see in their cabinet...'
                }
                required
              />
            </div>

            <div className="communication-form-actions">
              <button type="button" className="btn-outline" onClick={clearForm}>
                {lang === 'UA' ? 'Очистити' : 'Clear'}
              </button>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving
                  ? lang === 'UA'
                    ? 'Створення...'
                    : 'Creating...'
                  : lang === 'UA'
                    ? 'Створити'
                    : 'Create'}
              </button>
            </div>
          </form>
        </section>

        <aside className="communication-card message-details-card">
          {selectedMessage ? (
            <>
              <div className="details-header">
                <div>
                  <h2>{selectedMessage.subject}</h2>

                  <p>
                    {formatDateTime(selectedMessage.created_at, lang)}
                  </p>
                </div>

                <span
                  className={`message-status ${
                    selectedMessage.is_read ? 'message-status-read' : 'message-status-unread'
                  }`}
                >
                  {selectedMessage.is_read
                    ? lang === 'UA'
                      ? 'Прочитано'
                      : 'Read'
                    : lang === 'UA'
                      ? 'Нове'
                      : 'New'}
                </span>
              </div>

              <div className="details-row">
                <span>{lang === 'UA' ? 'Клієнт' : 'Client'}</span>
                <strong>{selectedMessage.clientName}</strong>
              </div>

              <div className="details-row">
                <span>{lang === 'UA' ? 'Телефон' : 'Phone'}</span>
                <strong>{selectedMessage.clientPhone || '—'}</strong>
              </div>

              <div className="details-row">
                <span>Email</span>
                <strong>{selectedMessage.clientEmail || '—'}</strong>
              </div>

              <div className="message-body">
                {selectedMessage.message}
              </div>

              {selectedMessage.is_read && (
                <div className="details-row">
                  <span>{lang === 'UA' ? 'Прочитано' : 'Read at'}</span>
                  <strong>{formatDateTime(selectedMessage.read_at, lang)}</strong>
                </div>
              )}
            </>
          ) : (
            <div className="empty-mini">
              {lang === 'UA'
                ? 'Оберіть звернення зі списку'
                : 'Choose a message from the list'}
            </div>
          )}
        </aside>
      </div>

      <section className="communication-card messages-list-card">
        <div className="messages-list-header">
          <div>
            <h2>{lang === 'UA' ? 'Історія повідомлень' : 'Message history'}</h2>

            <p>
              {lang === 'UA'
                ? 'Тут видно, які повідомлення були створені для клієнтів і чи прочитав їх клієнт.'
                : 'Here you can see which messages were created for clients and whether the client has read them.'}
            </p>
          </div>

          <div className="message-filters">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                lang === 'UA'
                  ? 'Пошук: клієнт, телефон, тема...'
                  : 'Search: client, phone, subject...'
              }
            />

            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value)}
            >
              <option value="">
                {lang === 'UA' ? 'Усі' : 'All'}
              </option>

              <option value="unread">
                {lang === 'UA' ? 'Нові' : 'Unread'}
              </option>

              <option value="read">
                {lang === 'UA' ? 'Прочитані' : 'Read'}
              </option>
            </select>
          </div>
        </div>

        {filteredMessages.length > 0 ? (
          <div className="messages-table-wrapper">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>{lang === 'UA' ? 'Дата' : 'Date'}</th>
                  <th>{lang === 'UA' ? 'Клієнт' : 'Client'}</th>
                  <th>{lang === 'UA' ? 'Тема' : 'Subject'}</th>
                  <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                  <th>{lang === 'UA' ? 'Дія' : 'Action'}</th>
                </tr>
              </thead>

              <tbody>
                {filteredMessages.map((message) => (
                  <tr
                    key={message.id}
                    className={
                      Number(selectedMessageId) === Number(message.id)
                        ? 'selected-row'
                        : ''
                    }
                  >
                    <td>{formatDateTime(message.created_at, lang)}</td>

                    <td>
                      <strong>{message.clientName}</strong>
                      <span>{message.clientPhone || message.clientEmail || '—'}</span>
                    </td>

                    <td>
                      <strong>{message.subject}</strong>
                      <span>{message.message}</span>
                    </td>

                    <td>
                      <span
                        className={`message-status ${
                          message.is_read
                            ? 'message-status-read'
                            : 'message-status-unread'
                        }`}
                      >
                        {message.is_read
                          ? lang === 'UA'
                            ? 'Прочитано'
                            : 'Read'
                          : lang === 'UA'
                            ? 'Нове'
                            : 'New'}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setSelectedMessageId(message.id)}
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
            {lang === 'UA'
              ? 'Повідомлень не знайдено'
              : 'No messages found'}
          </div>
        )}
      </section>
    </div>
  );
};

export default Communications;