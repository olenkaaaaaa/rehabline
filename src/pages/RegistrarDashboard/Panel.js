import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/registrar-panel.css';

const todayString = () => new Date().toISOString().split('T')[0];

const Panel = () => {
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadPanel = async () => {
      try {
        setLoading(true);

        const today = todayString();

        const [
          appointmentsRes,
          waitlistRes,
          clientsRes,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select(`
              *,
              services(*),
              specialists(*),
              locations(*),
              profiles(*)
            `)
            .gte('appointment_date', today)
            .order('appointment_date', {
              ascending: true,
            })
            .order('appointment_time', {
              ascending: true,
            })
            .limit(8),

          supabase
            .from('waitlist')
            .select('*')
            .in('status', ['active', 'offered'])
            .order('created_at', {
              ascending: false,
            })
            .limit(8),

          supabase
            .from('profiles')
            .select('*')
            .in('role', ['client', 'patient'])
            .order('created_at', {
              ascending: false,
            })
            .limit(8),
        ]);

        if (appointmentsRes.error) {
          throw appointmentsRes.error;
        }

        if (waitlistRes.error) {
          throw waitlistRes.error;
        }

        if (clientsRes.error) {
          throw clientsRes.error;
        }

        if (!isMounted) return;

        setAppointments(appointmentsRes.data || []);
        setWaitlist(waitlistRes.data || []);
        setClients(clientsRes.data || []);
      } catch (error) {
        console.error(
          'Registrar panel loading failed:',
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPanel();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const today = todayString();

    return {
      todayAppointments: appointments.filter(
        (item) =>
          item.appointment_date === today
      ).length,

      upcomingAppointments: appointments.length,

      waitlistActive: waitlist.filter(
        (item) => item.status === 'active'
      ).length,

      newClients: clients.length,
    };
  }, [appointments, waitlist, clients]);

  if (loading) {
    return (
      <div className="dashboard-page registrar-page">
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Завантаження...'
              : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page registrar-page">
      <div className="dashboard-header">
        <div>
          <h1>
            {lang === 'UA'
              ? 'Панель реєстратора'
              : 'Registrar dashboard'}
          </h1>

          <p>
            {lang === 'UA'
              ? 'Керуйте записами, листом очікування та пацієнтами'
              : 'Manage appointments, waitlist and patients'}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/registrar/create"
            className="btn btn-primary"
          >
            {lang === 'UA'
              ? 'Створити запис'
              : 'Create appointment'}
          </Link>

          <Link
            to="/registrar/waitlist"
            className="btn btn-secondary"
          >
            {lang === 'UA'
              ? 'Лист очікування'
              : 'Waitlist'}
          </Link>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-4">
        <div className="stat-card">
          <div className="stat-card-value">
            {stats.todayAppointments}
          </div>

          <div className="stat-card-label">
            {lang === 'UA'
              ? 'Записів сьогодні'
              : 'Today appointments'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value">
            {stats.upcomingAppointments}
          </div>

          <div className="stat-card-label">
            {lang === 'UA'
              ? 'Майбутні записи'
              : 'Upcoming appointments'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value">
            {stats.waitlistActive}
          </div>

          <div className="stat-card-label">
            {lang === 'UA'
              ? 'Активний waitlist'
              : 'Active waitlist'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value">
            {stats.newClients}
          </div>

          <div className="stat-card-label">
            {lang === 'UA'
              ? 'Нові пацієнти'
              : 'New patients'}
          </div>
        </div>
      </div>

      <div
        className="dashboard-grid dashboard-grid-2"
        style={{ marginTop: '24px' }}
      >
        <div className="card">
          <div className="section-heading">
            <div>
              <h2>
                {lang === 'UA'
                  ? 'Найближчі записи'
                  : 'Upcoming appointments'}
              </h2>

              <p>
                {lang === 'UA'
                  ? 'Найближчі прийоми у календарі'
                  : 'Nearest appointments in calendar'}
              </p>
            </div>

            <Link
              to="/registrar/appointments"
              className="btn btn-secondary btn-sm"
            >
              {lang === 'UA'
                ? 'Усі'
                : 'All'}
            </Link>
          </div>

          <div className="appointments-list">
            {appointments.length > 0 ? (
              appointments.map((item) => (
                <div
                  key={item.id}
                  className="card card-hover"
                >
                  <div className="appointment-card-top">
                    <strong>
                      {item.appointment_date}
                    </strong>

                    <span className="badge badge-success">
                      {item.status}
                    </span>
                  </div>

                  <div className="appointment-time">
                    {String(
                      item.appointment_time
                    ).slice(0, 5)}
                  </div>

                  <div className="appointment-meta">
                    <div>
                      <strong>
                        {item.profiles?.full_name ||
                          item.profiles?.email ||
                          'Пацієнт'}
                      </strong>
                    </div>

                    <div>
                      {item.specialists?.name || '—'}
                    </div>

                    <div>
                      {item.locations?.name_ua ||
                        item.locations?.name ||
                        '—'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {lang === 'UA'
                    ? 'Записів немає'
                    : 'No appointments'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <h2>
                {lang === 'UA'
                  ? 'Лист очікування'
                  : 'Waitlist'}
              </h2>

              <p>
                {lang === 'UA'
                  ? 'Пацієнти в очікуванні'
                  : 'Waiting patients'}
              </p>
            </div>

            <Link
              to="/registrar/waitlist"
              className="btn btn-secondary btn-sm"
            >
              {lang === 'UA'
                ? 'Відкрити'
                : 'Open'}
            </Link>
          </div>

          <div className="appointments-list">
            {waitlist.length > 0 ? (
              waitlist.map((item) => (
                <div
                  key={item.id}
                  className="card card-hover"
                >
                  <div className="appointment-card-top">
                    <strong>
                      #{item.id}
                    </strong>

                    <span className="badge badge-warning">
                      {item.status}
                    </span>
                  </div>

                  <div className="appointment-meta">
                    <div>
                      {item.preferred_days ||
                        (lang === 'UA'
                          ? 'Будь-які дні'
                          : 'Any days')}
                    </div>

                    <div>
                      {item.preferred_time ||
                        '—'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {lang === 'UA'
                    ? 'Waitlist порожній'
                    : 'Waitlist is empty'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;