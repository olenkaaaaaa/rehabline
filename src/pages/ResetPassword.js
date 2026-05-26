import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from 'react-icons/fa';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const { lang } = useLanguage();
  const { updatePassword } = useAuth();

  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const passwordStrength = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special:
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
          password
        ),
    };
  }, [password]);

  const validatePassword = () => {
    if (!password) {
      alert(
        lang === 'UA'
          ? 'Введіть новий пароль'
          : 'Enter new password'
      );

      return false;
    }

    const values = Object.values(passwordStrength);

    if (values.some((value) => !value)) {
      alert(
        lang === 'UA'
          ? 'Пароль не відповідає вимогам'
          : 'Password does not meet requirements'
      );

      return false;
    }

    if (password !== confirmPassword) {
      alert(
        lang === 'UA'
          ? 'Паролі не співпадають'
          : 'Passwords do not match'
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setSubmitting(true);

      await updatePassword(password);

      alert(
        lang === 'UA'
          ? 'Пароль успішно змінено'
          : 'Password changed successfully'
      );

      navigate('/login', {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      alert(
        lang === 'UA'
          ? `Не вдалося змінити пароль: ${
              error.message || 'Спробуйте ще раз'
            }`
          : `Failed to change password: ${
              error.message || 'Try again'
            }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStrength = () => {
    const requirements = [
      {
        key: 'length',
        label:
          lang === 'UA'
            ? 'Мінімум 8 символів'
            : 'At least 8 characters',
      },

      {
        key: 'uppercase',
        label:
          lang === 'UA'
            ? 'Велика літера'
            : 'Uppercase letter',
      },

      {
        key: 'lowercase',
        label:
          lang === 'UA'
            ? 'Мала літера'
            : 'Lowercase letter',
      },

      {
        key: 'number',
        label:
          lang === 'UA'
            ? 'Цифра'
            : 'Number',
      },

      {
        key: 'special',
        label:
          lang === 'UA'
            ? 'Спецсимвол'
            : 'Special symbol',
      },
    ];

    return (
      <div className="password-strength">
        {requirements.map((item) => (
          <div
            key={item.key}
            className={`strength-item ${
              passwordStrength[item.key]
                ? 'valid'
                : 'invalid'
            }`}
          >
            {passwordStrength[item.key] ? (
              <FaCheck className="icon valid" />
            ) : (
              <FaTimes className="icon invalid" />
            )}

            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="auth-page">
      <div className="card auth-container">
        <h1 className="auth-title">
          {lang === 'UA'
            ? 'Новий пароль'
            : 'New password'}
        </h1>

        <p className="auth-subtitle">
          {lang === 'UA'
            ? 'Створіть новий безпечний пароль'
            : 'Create a new secure password'}
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="password">
              {lang === 'UA'
                ? 'Новий пароль'
                : 'New password'}
            </label>

            <div className="password-input-wrapper">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                id="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="********"
                required
                disabled={submitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={submitting}
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>

            {renderStrength()}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              {lang === 'UA'
                ? 'Повторіть пароль'
                : 'Confirm password'}
            </label>

            <div className="password-input-wrapper">
              <input
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                id="confirmPassword"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="********"
                required
                disabled={submitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={submitting}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={submitting}
          >
            {submitting
              ? lang === 'UA'
                ? 'Збереження...'
                : 'Saving...'
              : lang === 'UA'
                ? 'Змінити пароль'
                : 'Change password'}
          </button>

          <div className="auth-footer">
            <p>
              <Link
                to="/login"
                className="register-link"
              >
                {lang === 'UA'
                  ? '← Назад до входу'
                  : '← Back to login'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;