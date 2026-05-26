import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/client-messages.css';

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

const ClientMessages = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);

      if (!selectedMessageId && data && data.length > 0) {
        setSelectedMessageId(data[0].id);
      }
    } catch (error) {
      console.error('Client messages loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити повідомлення: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load messages: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unreadCount = useMemo(() => {
    return messages.filter((message) => !message.is_read).length;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (filter === 'unread') return !message.is_read;
      if (filter === 'read') return message.is_read;

      return true;
    });
  }, [messages, filter]);

  const selectedMessage = useMemo(() => {
    return (
      messages.find(
        (message) => Number(message.id) === Number(selectedMessageId)
      ) || null
    );
  }, [messages, selectedMessageId]);

  const markAsRead = async (messageId) => {
    if (!user?.id || !messageId) return;

    try {
      setSaving(true);

      const readAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('client_messages')
        .update({
          is_read: true,
          read_at: readAt,
        })
        .eq('id', messageId)
        .eq('client_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map((message) =>
          Number(message.id) === Number(messageId) ? data : message
        )
      );
    } catch (error) {
      console.error('Mark message as read failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося позначити як прочитане: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to mark as read: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    try {
      setSaving(true);

      const readAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('client_messages')
        .update({
          is_read: true,
          read_at: readAt,
        })
        .eq('client_id', user.id)
        .eq('is_read', false)
        .select('*');

      if (error) throw error;

      const updatedMap = new Map((data || []).map((item) => [item.id, item]));

      setMessages((prev) =>
        prev.map((message) => updatedMap.get(message.id) || message)
      );
    } catch (error) {
      console.error('Mark all messages as read failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося позначити всі як прочитані: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to mark all as read: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="client-messages-page">
        <h1>{lang === 'UA' ? 'Повідомлення' : 'Messages'}</h1>

        <div className="empty-state">
          {lang === 'UA' ? 'Завантаження...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="client-messages-page">
      <div className="client-messages-header">
        <div>
          <h1>{lang === 'UA' ? 'Повідомлення' : 'Messages'}</h1>

          <p>
            {lang === 'UA'
              ? 'Тут відображаються внутрішні повідомлення від адміністратора або реєстратора.'
              : 'Internal messages from administrator or registrar are displayed here.'}
          </p>
        </div>

        <div className="client-messages-actions">
          <button type="button" className="btn-outline" onClick={loadMessages}>
            {lang === 'UA' ? 'Оновити' : 'Refresh'}
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={markAllAsRead}
            disabled={saving || unreadCount === 0}
          >
            {lang === 'UA' ? 'Позначити всі як прочитані' : 'Mark all as read'}
          </button>
        </div>
      </div>

      <div className="client-message-stats">
        <div className="client-message-stat-card">
          <span>{lang === 'UA' ? 'Усього' : 'Total'}</span>
          <strong>{messages.length}</strong>
        </div>

        <div className="client-message-stat-card unread-stat">
          <span>{lang === 'UA' ? 'Нові' : 'New'}</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="client-message-stat-card">
          <span>{lang === 'UA' ? 'Прочитані' : 'Read'}</span>
          <strong>{messages.length - unreadCount}</strong>
        </div>
      </div>

      <div className="client-messages-layout">
        <section className="client-messages-list-card">
          <div className="messages-filter-tabs">
            <button
              type="button"
              className={!filter ? 'active' : ''}
              onClick={() => setFilter('')}
            >
              {lang === 'UA' ? 'Усі' : 'All'}
            </button>

            <button
              type="button"
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              {lang === 'UA' ? 'Нові' : 'New'}
            </button>

            <button
              type="button"
              className={filter === 'read' ? 'active' : ''}
              onClick={() => setFilter('read')}
            >
              {lang === 'UA' ? 'Прочитані' : 'Read'}
            </button>
          </div>

          {filteredMessages.length > 0 ? (
            <div className="client-message-list">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  className={`client-message-card ${
                    Number(selectedMessageId) === Number(message.id)
                      ? 'active'
                      : ''
                  } ${!message.is_read ? 'unread' : ''}`}
                  onClick={() => setSelectedMessageId(message.id)}
                >
                  <div className="client-message-card-top">
                    <strong>{message.subject}</strong>

                    {!message.is_read && (
                      <span>{lang === 'UA' ? 'Нове' : 'New'}</span>
                    )}
                  </div>

                  <p>{message.message}</p>

                  <small>{formatDateTime(message.created_at, lang)}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {lang === 'UA'
                ? 'Повідомлень немає'
                : 'No messages'}
            </div>
          )}
        </section>

        <aside className="client-message-details-card">
          {selectedMessage ? (
            <>
              <div className="client-message-details-header">
                <div>
                  <span
                    className={`message-read-badge ${
                      selectedMessage.is_read ? 'read' : 'unread'
                    }`}
                  >
                    {selectedMessage.is_read
                      ? lang === 'UA'
                        ? 'Прочитано'
                        : 'Read'
                      : lang === 'UA'
                        ? 'Нове повідомлення'
                        : 'New message'}
                  </span>

                  <h2>{selectedMessage.subject}</h2>

                  <p>{formatDateTime(selectedMessage.created_at, lang)}</p>
                </div>
              </div>

              <div className="client-message-full-text">
                {selectedMessage.message}
              </div>

              {selectedMessage.is_read ? (
                <div className="message-read-info">
                  {lang === 'UA' ? 'Прочитано:' : 'Read at:'}{' '}
                  <strong>{formatDateTime(selectedMessage.read_at, lang)}</strong>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => markAsRead(selectedMessage.id)}
                  disabled={saving}
                >
                  {saving
                    ? lang === 'UA'
                      ? 'Збереження...'
                      : 'Saving...'
                    : lang === 'UA'
                      ? 'Позначити як прочитане'
                      : 'Mark as read'}
                </button>
              )}
            </>
          ) : (
            <div className="empty-state">
              {lang === 'UA'
                ? 'Оберіть повідомлення зі списку'
                : 'Choose a message from the list'}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ClientMessages;