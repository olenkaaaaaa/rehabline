import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';

const AuditLog = () => {
  const { lang } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Audit logs loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити аудит-лог: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load audit log: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actionOptions = useMemo(() => {
    const uniqueActions = new Set(
      logs.map((log) => log.action).filter(Boolean)
    );

    return Array.from(uniqueActions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesAction = !actionFilter || log.action === actionFilter;

      const searchText = [
        log.user_email,
        log.user_id,
        log.action,
        log.entity,
        log.table_name,
        log.record_id,
        log.description,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedFilter || searchText.includes(normalizedFilter);

      return matchesAction && matchesSearch;
    });
  }, [logs, filter, actionFilter]);

  if (loading) {
    return (
      <div className="dashboard-page audit-log-page">
        <div className="dashboard-header">
          <div>
            <h1>{lang === 'UA' ? 'Аудит-лог' : 'Audit log'}</h1>
            <p>
              {lang === 'UA'
                ? 'Журнал дій у системі'
                : 'System activity journal'}
            </p>
          </div>
        </div>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page audit-log-page">
      <div className="dashboard-header">
        <div>
          <h1>{lang === 'UA' ? 'Аудит-лог' : 'Audit log'}</h1>

          <p>
            {lang === 'UA'
              ? 'Перегляд останніх дій користувачів і змін у системі'
              : 'View recent user actions and system changes'}
          </p>
        </div>

        <button type="button" className="btn btn-secondary" onClick={loadLogs}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="card audit-controls">
        <div className="form-group">
          <label>{lang === 'UA' ? 'Пошук' : 'Search'}</label>

          <input
            type="text"
            placeholder={lang === 'UA' ? 'Користувач, дія, обʼєкт...' : 'User, action, object...'}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label>{lang === 'UA' ? 'Дія' : 'Action'}</label>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="">
              {lang === 'UA' ? 'Усі дії' : 'All actions'}
            </option>

            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredLogs.length > 0 ? (
        <div className="table-wrapper card">
          <table className="table audit-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Час' : 'Time'}</th>
                <th>{lang === 'UA' ? 'Користувач' : 'User'}</th>
                <th>{lang === 'UA' ? 'Дія' : 'Action'}</th>
                <th>{lang === 'UA' ? "Об'єкт" : 'Object'}</th>
                <th>{lang === 'UA' ? 'Опис' : 'Description'}</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString(
                          lang === 'UA' ? 'uk-UA' : 'en-US'
                        )
                      : '—'}
                  </td>

                  <td>{log.user_email || log.user_id || '—'}</td>

                  <td>
                    <span className="badge badge-warning">
                      {log.action || '—'}
                    </span>
                  </td>

                  <td>
                    {log.entity || log.table_name || '—'}

                    {log.record_id && (
                      <div className="table-subtext">
                        ID: {log.record_id}
                      </div>
                    )}
                  </td>

                  <td>{log.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Записів аудиту не знайдено'
              : 'No audit logs found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditLog;