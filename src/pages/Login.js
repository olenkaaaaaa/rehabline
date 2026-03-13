import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa';

const Login = () => {
  const { lang } = useLanguage();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Шлях, з якого прийшли, або default залежно від ролі (буде визначено після логіну)
  const from = location.state?.from;

  // Стан форми
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showCodeLogin, setShowCodeLogin] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Таймер для OTP
  useEffect(() => {
    let interval;
    if (showCodeLogin && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCodeLogin, timer]);

  // Обробка входу за паролем
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      // Визначаємо шлях за замовчуванням на основі ролі, якщо from не задано
      let defaultPath = '/client';
      if (userData.role === 'specialist') defaultPath = '/specialist';
      else if (userData.role === 'registrar') defaultPath = '/registrar';
      else if (userData.role === 'admin') defaultPath = '/admin';
      navigate(from || defaultPath, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      alert(lang === 'UA' ? 'Невірний email або пароль' : 'Invalid email or password');
    }
  };

  // Соціальний вхід (демо)
  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Тут буде реальна інтеграція з Firebase, Google OAuth тощо
    // Після успіху – navigate(from || defaultPath)
  };

  // Зміна цифр OTP
  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      // Автоперехід до наступного поля
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  // Вхід за кодом
  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      alert(lang === 'UA' ? 'Введіть 6-значний код' : 'Enter 6-digit code');
      return;
    }
    console.log('Verifying code:', fullCode);
    // Тут має бути запит на перевірку коду
    // Якщо код правильний – отримуємо userData і перенаправляємо
    // Для демо просто перейдемо на головну сторінку клієнта
    navigate('/client', { replace: true });
  };

  // Повторне надсилання коду
  const handleResendCode = () => {
    setTimer(45);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    console.log('Resend OTP');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Вхід' : 'Login'}
        </h1>
        <p className="auth-subtitle">
          {lang === 'UA' ? 'Увійдіть до кабінету' : 'Sign in to your account'}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>{lang === 'UA' ? "Запам'ятати мене" : 'Remember me'}</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                {lang === 'UA' ? 'Забули пароль?' : 'Forgot password?'}
              </Link>
            </div>

            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? (lang === 'UA' ? 'Завантаження...' : 'Loading...') : (lang === 'UA' ? 'Увійти' : 'Sign in')}
            </button>

            <div className="auth-divider">
              <span>{lang === 'UA' ? 'або' : 'or'}</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleSocialLogin('Google')}
                disabled={loading}
              >
                <FaGoogle />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="social-btn facebook"
                onClick={() => handleSocialLogin('Facebook')}
                disabled={loading}
              >
                <FaFacebookF />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                className="social-btn apple"
                onClick={() => handleSocialLogin('Apple')}
                disabled={loading}
              >
                <FaApple />
                <span>Apple</span>
              </button>
            </div>

            <button
              type="button"
              className="code-login-link"
              onClick={() => setShowCodeLogin(true)}
              disabled={loading}
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
                  disabled={loading}
                />
              ))}
            </div>

            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {lang === 'UA' ? 'Підтвердити' : 'Verify'}
            </button>

            <div className="code-resend">
              <span>{lang === 'UA' ? 'Не отримали код?' : 'Didn\'t receive the code?'}</span>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendCode}
                disabled={!canResend || loading}
              >
                {lang === 'UA' ? 'Надіслати ще раз' : 'Resend'}
              </button>
              {timer > 0 && (
                <span className="timer">
                  {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}
                  {timer % 60}
                </span>
              )}
            </div>

            <button
              type="button"
              className="back-to-password"
              onClick={() => {
                setShowCodeLogin(false);
                setCode(['', '', '', '', '', '']);
                setTimer(45);
                setCanResend(false);
              }}
              disabled={loading}
            >
              ← {lang === 'UA' ? 'Назад до входу за паролем' : 'Back to password login'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {lang === 'UA' ? 'Немає акаунта?' : 'Don\'t have an account?'}{' '}
            <Link to="/register" state={{ from }} className="register-link">
              {lang === 'UA' ? 'Зареєструватися' : 'Register'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;