import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/layout/header.css';

const Header = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { user, profile, logout } = useAuth();

  const dashboardPath = profile?.role ? `/${profile.role}` : '/client';

  const navItems = [
    {
      path: '/services',
      label: lang === 'UA' ? 'Послуги' : 'Services',
    },
    {
      path: '/specialists',
      label: lang === 'UA' ? 'Спеціалісти' : 'Specialists',
    },
    {
      path: '/locations',
      label: lang === 'UA' ? 'Локації' : 'Locations',
    },
    {
      path: '/contacts',
      label: lang === 'UA' ? 'Контакти' : 'Contacts',
    },
  ];

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <span className="logo-mark">R</span>
          <span>RehabLine</span>
        </Link>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            onClick={toggleLanguage}
            className="lang-switcher"
          >
            {lang === 'UA' ? 'EN' : 'UA'}
          </button>

          {user ? (
            <div className="user-menu">
              <Link to={dashboardPath} className="dashboard-link">
                {lang === 'UA' ? 'Кабінет' : 'Dashboard'}
              </Link>

              <button type="button" onClick={logout} className="login-btn">
                {lang === 'UA' ? 'Вийти' : 'Logout'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              {lang === 'UA' ? 'Увійти' : 'Login'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;