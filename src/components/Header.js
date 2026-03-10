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
          <Link to="/services">Послуги</Link>
          <Link to="/specialists">Спеціалісти</Link>
          <Link to="/locations">Локації</Link>
          <Link to="/contacts">Контакти</Link>
        </nav>
        <div className="header-actions">
          <button onClick={toggleLanguage} className="lang-switcher">
            {lang === 'UA' ? 'EN' : 'UA'}
          </button>
          {user ? (
            <button onClick={logout} className="login-btn">Вийти</button>
          ) : (
            <Link to="/login" className="login-btn">Увійти</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;