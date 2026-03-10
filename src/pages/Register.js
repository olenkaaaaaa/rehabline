import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Register = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <h1>{lang === 'UA' ? 'Реєстрація' : 'Register'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={lang === 'UA' ? "ПІБ" : "Full name"}
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder={lang === 'UA' ? 'Пароль' : 'Password'}
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          required
        />
        <button type="submit" className="btn-primary">
          {lang === 'UA' ? 'Створити акаунт' : 'Create account'}
        </button>
      </form>
    </div>
  );
};

export default Register;