import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Contacts = () => {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted (demo)');
  };

  return (
    <div className="container">
      <h1>{lang === 'UA' ? 'Контакти' : 'Contacts'}</h1>
      <div className="contacts-grid">
        <div>
          <p>Телефон: +38 (0XX) XXX-XX-XX</p>
          <p>Email: support@rehabline.ua</p>
          <p>Telegram: @rehabline</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={lang === 'UA' ? "Ім'я" : "Name"}
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
          />
          <textarea
            placeholder={lang === 'UA' ? "Повідомлення" : "Message"}
            value={form.message}
            onChange={e => setForm({...form, message: e.target.value})}
          />
          <button type="submit" className="btn-primary">
            {lang === 'UA' ? 'Надіслати' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contacts;