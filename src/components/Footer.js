import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { lang } = useLanguage();

  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div>
          <Link to="/" className="public-footer-logo">
            RehabLine
          </Link>

          <p>
            {lang === 'UA'
              ? 'Онлайн-запис на медичні та реабілітаційні послуги.'
              : 'Online booking for medical and rehabilitation services.'}
          </p>
        </div>

        <div className="public-footer-info">
          <p>© 2026 RehabLine</p>
          <p>{lang === 'UA' ? 'Усі права захищено' : 'All rights reserved'}</p>
        </div>

        <div className="public-footer-contacts">
          <p>+38 (0XX) XXX-XX-XX</p>
          <p>support@rehabline.ua</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;