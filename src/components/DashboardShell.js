import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/dashboard-shell.css';

const getRoleLabel = (role, lang) => {
  const labels = {
    patient: { UA: 'Пацієнт', EN: 'Patient' },
    specialist: { UA: 'Спеціаліст', EN: 'Specialist' },
    registrar: { UA: 'Реєстратор', EN: 'Registrar' },
    admin: { UA: 'Адміністратор', EN: 'Administrator' },
  };

  return labels[role]?.[lang] || role || '';
};

const getInitial = (profile) => {
  const name = profile?.full_name || profile?.name || profile?.email || 'R';
  return name.trim().charAt(0).toUpperCase();
};

const DashboardShell = ({ role, title, subtitle, menuItems = [] }) => {
  const { lang } = useLanguage();
  const { profile, signOut, logout } = useAuth();
  const navigate = useNavigate();

  const currentRole = role || profile?.role;
  const profileName =
    profile?.full_name ||
    profile?.name ||
    profile?.email ||
    (lang === 'UA' ? 'Користувач' : 'User');

  const handleLogout = async () => {
    if (typeof signOut === 'function') {
      await signOut();
    } else if (typeof logout === 'function') {
      await logout();
    }

    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          <span className="dashboard-logo-mark">R</span>
          <span className="dashboard-logo-text">RehabLine</span>
        </Link>

        <div className="dashboard-sidebar-role">
          {getRoleLabel(currentRole, lang)}
        </div>

        <nav className="dashboard-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'dashboard-menu-link active' : 'dashboard-menu-link'
              }
            >
              <span className="dashboard-menu-icon">{item.icon}</span>
              <span>{item.label?.[lang] || item.label?.UA || item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-title-block">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="dashboard-user-card">
            <div className="dashboard-user-avatar">{getInitial(profile)}</div>

            <div className="dashboard-user-info">
              <strong>{profileName}</strong>
              <span>{getRoleLabel(currentRole, lang)}</span>
            </div>

            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={handleLogout}
            >
              {lang === 'UA' ? 'Вийти' : 'Logout'}
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardShell;