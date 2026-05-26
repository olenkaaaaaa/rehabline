import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const { lang } = useLanguage();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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

    try {
      setSubmitting(true);

      await resetPassword(email.trim());

      setSent(true);
    } catch (error) {
      console.error('Password reset failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося надіслати лист: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to send email: ${error.message || 'Please try again'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Відновлення пароля' : 'Reset password'}
        </h1>

        {!sent ? (
          <>
            <p className="auth-subtitle">
              {lang === 'UA'
                ? 'Введіть email, і ми надішлемо посилання для зміни пароля'
                : 'Enter your email and we will send a password reset link'}
            </p>

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
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={submitting}
              >
                {submitting
                  ? lang === 'UA'
                    ? 'Надсилання...'
                    : 'Sending...'
                  : lang === 'UA'
                    ? 'Надіслати посилання'
                    : 'Send reset link'}
              </button>

              <div className="auth-footer">
                <p>
                  <Link to="/login" className="register-link">
                    {lang === 'UA' ? '← Назад до входу' : '← Back to login'}
                  </Link>
                </p>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="success-banner">
              {lang === 'UA'
                ? `Ми надіслали посилання для зміни пароля на ${email}`
                : `We sent a password reset link to ${email}`}
            </div>

            <div className="auth-footer">
              <p>
                <Link to="/login" className="register-link">
                  {lang === 'UA' ? 'Повернутися до входу' : 'Back to login'}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;