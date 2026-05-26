import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaFacebookF, FaGoogle } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const emptyCode = ['', '', '', '', '', ''];

const getSafeRedirect = (resultRedirect, from) => {
  /*
    Важливо:
    рольовий redirect з AuthContext має бути першим.
    Інакше, якщо користувача раніше перекинуло на login зі сторінки /client,
    після входу спеціаліста або реєстратора знову відкриє /client.
  */
  if (resultRedirect) return resultRedirect;

  if (
    typeof from === 'string' &&
    from &&
    !from.includes('/login') &&
    !from.includes('/register')
  ) {
    return from;
  }

  return '/client';
};

const Login = () => {
  const { lang } = useLanguage();

  const {
    login,
    sendLoginCode,
    verifyLoginCode,
    loginWithProvider,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [showCodeLogin, setShowCodeLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [code, setCode] = useState(emptyCode);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!showCodeLogin || timer <= 0) return undefined;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showCodeLogin, timer]);

  const validateEmail = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert(lang === 'UA' ? 'Введіть email' : 'Enter email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      alert(lang === 'UA' ? 'Некоректний email' : 'Invalid email');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail()) return;

    if (!password) {
      alert(lang === 'UA' ? 'Введіть пароль' : 'Enter password');
      return;
    }

    try {
      setSubmitting(true);

      const result = await login(email.trim(), password);

      navigate(getSafeRedirect(result?.redirectTo, from), {
        replace: true,
      });
    } catch (error) {
      console.error('Login failed:', error);

      alert(
        lang === 'UA'
          ? 'Невірний email або пароль'
          : 'Invalid email or password'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCodeLogin = async () => {
    if (!validateEmail()) return;

    try {
      setSubmitting(true);

      await sendLoginCode(email.trim());

      setShowCodeLogin(true);
      setCode(emptyCode);
      setTimer(45);
      setCanResend(false);

      alert(
        lang === 'UA'
          ? 'Код надіслано на ваш email'
          : 'Code has been sent to your email'
      );
    } catch (error) {
      console.error('Send code failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати код: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to send code: ${error.message || 'Please try again'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderLogin = async (provider) => {
    try {
      setSubmitting(true);
      await loginWithProvider(provider);
    } catch (error) {
      console.error(`${provider} login failed:`, error);

      alert(
        lang === 'UA'
          ? `Помилка входу через ${provider}: ${error.message || 'Спробуйте ще раз'}`
          : `${provider} login failed: ${error.message || 'Please try again'}`
      );

      setSubmitting(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;

    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pastedValue) return;

    const newCode = [...emptyCode];

    pastedValue.split('').forEach((digit, index) => {
      newCode[index] = digit;
    });

    setCode(newCode);

    const nextIndex = pastedValue.length >= 6 ? 5 : pastedValue.length;
    document.getElementById(`code-${nextIndex}`)?.focus();
  };

  const handleCodeSubmit = async (event) => {
    event.preventDefault();

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      alert(lang === 'UA' ? 'Введіть 6-значний код' : 'Enter 6-digit code');
      return;
    }

    try {
      setSubmitting(true);

      const result = await verifyLoginCode(email.trim(), fullCode);

      navigate(getSafeRedirect(result?.redirectTo, from), {
        replace: true,
      });
    } catch (error) {
      console.error('Verify code failed:', error);

      alert(
        lang === 'UA'
          ? 'Невірний або прострочений код'
          : 'Invalid or expired code'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!validateEmail()) return;

    try {
      setSubmitting(true);

      await sendLoginCode(email.trim());

      setTimer(45);
      setCanResend(false);
      setCode(emptyCode);

      alert(
        lang === 'UA'
          ? 'Новий код надіслано на email'
          : 'New code has been sent to your email'
      );
    } catch (error) {
      console.error('Resend code failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати код: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to send code: ${error.message || 'Please try again'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetCodeMode = () => {
    setShowCodeLogin(false);
    setCode(emptyCode);
    setTimer(45);
    setCanResend(false);
  };

  const isDisabled = submitting;

  return (
    <div className="auth-page">
      <div className="card auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Вхід' : 'Login'}
        </h1>

        <p className="auth-subtitle">
          {lang === 'UA' ? 'Увійдіть до кабінету' : 'Sign in to your account'}
        </p>

        {!showCodeLogin ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                required
                disabled={isDisabled}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {lang === 'UA' ? 'Пароль' : 'Password'}
              </label>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  disabled={isDisabled}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isDisabled}
                  aria-label={
                    showPassword
                      ? lang === 'UA'
                        ? 'Сховати пароль'
                        : 'Hide password'
                      : lang === 'UA'
                        ? 'Показати пароль'
                        : 'Show password'
                  }
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isDisabled}
                />

                <span>
                  {lang === 'UA' ? "Запам'ятати мене" : 'Remember me'}
                </span>
              </label>

              <Link to="/forgot-password" className="forgot-link">
                {lang === 'UA' ? 'Забули пароль?' : 'Forgot password?'}
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={isDisabled}
            >
              {isDisabled
                ? lang === 'UA'
                  ? 'Завантаження...'
                  : 'Loading...'
                : lang === 'UA'
                  ? 'Увійти'
                  : 'Sign in'}
            </button>

            <div className="auth-divider">
              <span>{lang === 'UA' ? 'або' : 'or'}</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleProviderLogin('google')}
                disabled={isDisabled}
              >
                <FaGoogle />
                <span>Google</span>
              </button>

              <button
                type="button"
                className="social-btn facebook"
                onClick={() => handleProviderLogin('facebook')}
                disabled={isDisabled}
              >
                <FaFacebookF />
                <span>Facebook</span>
              </button>
            </div>

            <button
              type="button"
              className="code-login-link"
              onClick={handleStartCodeLogin}
              disabled={isDisabled}
            >
              {lang === 'UA'
                ? 'Увійти за кодом на email'
                : 'Login with email code'}
            </button>

            <div className="auth-footer">
              <p>
                {lang === 'UA' ? 'Немає акаунта?' : "Don't have an account?"}{' '}
                <Link to="/register" state={{ from }} className="register-link">
                  {lang === 'UA' ? 'Зареєструватися' : 'Register'}
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="auth-form">
            <p className="code-info">
              {lang === 'UA'
                ? `Ми надіслали 6-значний код на email: ${email}`
                : `We sent a 6-digit code to email: ${email}`}
            </p>

            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(event) => handleCodeChange(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  onPaste={handleCodePaste}
                  className="code-digit"
                  autoFocus={index === 0}
                  disabled={isDisabled}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={isDisabled}
            >
              {isDisabled
                ? lang === 'UA'
                  ? 'Перевірка...'
                  : 'Verifying...'
                : lang === 'UA'
                  ? 'Підтвердити'
                  : 'Verify'}
            </button>

            <div className="code-resend">
              <span>
                {lang === 'UA' ? 'Не отримали код?' : "Didn't receive the code?"}
              </span>

              <button
                type="button"
                className="resend-btn"
                onClick={handleResendCode}
                disabled={!canResend || isDisabled}
              >
                {lang === 'UA' ? 'Надіслати ще раз' : 'Resend'}
              </button>

              {timer > 0 && (
                <span className="timer">
                  {Math.floor(timer / 60)}:
                  {timer % 60 < 10 ? '0' : ''}
                  {timer % 60}
                </span>
              )}
            </div>

            <button
              type="button"
              className="back-to-password"
              onClick={resetCodeMode}
              disabled={isDisabled}
            >
              ← {lang === 'UA' ? 'Назад до входу за паролем' : 'Back to password login'}
            </button>

            <div className="auth-footer">
              <p>
                {lang === 'UA' ? 'Немає акаунта?' : "Don't have an account?"}{' '}
                <Link to="/register" state={{ from }} className="register-link">
                  {lang === 'UA' ? 'Зареєструватися' : 'Register'}
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;