import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';

const Login = () => {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showCodeLogin, setShowCodeLogin] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']); // для 6 цифр OTP

  const handleSubmit = (e) => {
    e.preventDefault();
    // Імітація логіну – в реальності тут буде запит до API
    login({ name: 'Тестовий клієнт', role: 'client' });
    navigate('/client');
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Тут буде виклик OAuth
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      // Автоматично переходимо до наступного поля
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    console.log('Verifying code:', fullCode);
    // Тут відправка коду на сервер
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Вхід' : 'Login'}
        </h1>
        <p className="auth-subtitle">
          {lang === 'UA' ? 'Увійдіть до кабінету клієнта' : 'Sign in to your client account'}
        </p>

        {!showCodeLogin ? (
          // Форма входу за паролем
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                {lang === 'UA' ? 'Логін / Email' : 'Username / Email'}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="burdyak.olena@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {lang === 'UA' ? 'Пароль' : 'Password'}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{lang === 'UA' ? 'Запам\'ятати мене' : 'Remember me'}</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                {lang === 'UA' ? 'Забули пароль?' : 'Forgot password?'}
              </Link>
            </div>

            <button type="submit" className="btn-primary auth-btn">
              {lang === 'UA' ? 'Увійти' : 'Sign in'}
            </button>

            <div className="auth-divider">
              <span>{lang === 'UA' ? 'або' : 'or'}</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleSocialLogin('Google')}
              >
                <FaGoogle />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="social-btn facebook"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <FaFacebookF />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                className="social-btn apple"
                onClick={() => handleSocialLogin('Apple')}
              >
                <FaApple />
                <span>Apple</span>
              </button>
            </div>

            <button
              type="button"
              className="code-login-link"
              onClick={() => setShowCodeLogin(true)}
            >
              {lang === 'UA' ? 'Увійти за кодом (SMS/Email)' : 'Login with code (SMS/Email)'}
            </button>
          </form>
        ) : (
          // Форма входу за кодом (OTP)
          <form onSubmit={handleCodeSubmit} className="auth-form">
            <p className="code-info">
              {lang === 'UA'
                ? 'Ми надіслали 6-значний код на ваш телефон або email'
                : 'We sent a 6-digit code to your phone or email'}
            </p>

            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="code-digit"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button type="submit" className="btn-primary auth-btn">
              {lang === 'UA' ? 'Підтвердити' : 'Verify'}
            </button>

            <div className="code-resend">
              <span>{lang === 'UA' ? 'Не отримали код?' : 'Didn\'t receive the code?'}</span>
              <button type="button" className="resend-btn">
                {lang === 'UA' ? 'Надіслати ще раз' : 'Resend'}
              </button>
              <span className="timer">00:45</span>
            </div>

            <button
              type="button"
              className="back-to-password"
              onClick={() => setShowCodeLogin(false)}
            >
              ← {lang === 'UA' ? 'Назад до входу за паролем' : 'Back to password login'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {lang === 'UA' ? 'Немає акаунта?' : 'Don\'t have an account?'}{' '}
            <Link to="/register" className="register-link">
              {lang === 'UA' ? 'Зареєструватися' : 'Register'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;