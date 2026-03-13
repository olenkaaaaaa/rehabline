import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">RehabLine</Link>
        <nav className="nav-menu">
          <Link to="/services">{lang === 'UA' ? 'Послуги' : 'Services'}</Link>
          <Link to="/specialists">{lang === 'UA' ? 'Спеціалісти' : 'Specialists'}</Link>
          <Link to="/locations">{lang === 'UA' ? 'Локації' : 'Locations'}</Link>
          <Link to="/contacts">{lang === 'UA' ? 'Контакти' : 'Contacts'}</Link>
        </nav>
        <div className="header-actions">
          <button onClick={toggleLanguage} className="lang-switcher">
            {lang === 'UA' ? 'EN' : 'UA'}
          </button>
          {user ? (
            <div className="user-menu">
              <Link to={`/${user.role}`} className="dashboard-link">
                {lang === 'UA' ? 'Кабінет' : 'Dashboard'}
              </Link>
              <button onClick={logout} className="login-btn">
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