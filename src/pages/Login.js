import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ name: 'Тестовий клієнт', role: 'client' });
    navigate('/client');
  };

  return (
    <div className="auth-container">
      <h1>{lang === 'UA' ? 'Вхід' : 'Login'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={lang === 'UA' ? 'Пароль' : 'Password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          {lang === 'UA' ? 'Увійти' : 'Log in'}
        </button>
      </form>
      <p>
        <Link to="/register">
          {lang === 'UA' ? 'Немає акаунта? Зареєструватися' : "Don't have an account? Register"}
        </Link>
      </p>
    </div>
  );
};

export default Login;