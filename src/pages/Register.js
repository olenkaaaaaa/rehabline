import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from 'react-icons/fa';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { lang } = useLanguage();
  const { register } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: lang,
    timezone: 'Europe/Kiev',
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const pwd = formData.password;

    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    });
  }, [formData.password]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        lang === 'UA'
          ? 'Введіть ПІБ'
          : 'Enter full name';
    }

    const phoneRegex = /^\+?380\d{9}$/;
    const cleanPhone = formData.phone.replace(/\s/g, '');

    if (!formData.phone.trim()) {
      newErrors.phone =
        lang === 'UA'
          ? 'Введіть телефон'
          : 'Enter phone';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone =
        lang === 'UA'
          ? 'Невірний формат телефону'
          : 'Invalid phone format';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email =
        lang === 'UA'
          ? 'Введіть email'
          : 'Enter email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email =
        lang === 'UA'
          ? 'Некоректний email'
          : 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password =
        lang === 'UA'
          ? 'Введіть пароль'
          : 'Enter password';
    } else {
      const values = Object.values(passwordStrength);

      if (values.some((value) => !value)) {
        newErrors.password =
          lang === 'UA'
            ? 'Пароль не відповідає вимогам'
            : 'Password does not meet requirements';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        lang === 'UA'
          ? 'Підтвердіть пароль'
          : 'Confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword =
        lang === 'UA'
          ? 'Паролі не співпадають'
          : 'Passwords do not match';
    }

    if (!formData.agree) {
      newErrors.agree =
        lang === 'UA'
          ? 'Потрібна згода'
          : 'Agreement required';
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    setErrors(validationErrors);

    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      agree: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      await register(
        formData.email,
        formData.password,
        {
          fullName: formData.fullName,
          phone: formData.phone,
          language: formData.language,
          timezone: formData.timezone,
          role: 'client',
        }
      );

      navigate('/login', {
        replace: true,
        state: { from },
      });
    } catch (error) {
      console.error(error);

      alert(
        lang === 'UA'
          ? `Помилка реєстрації: ${error.message || 'Спробуйте ще раз'}`
          : `Registration failed: ${error.message || 'Try again'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStrength = () => {
    const items = [
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
        {items.map((item) => (
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
            ? 'Реєстрація'
            : 'Register'}
        </h1>

        <p className="auth-subtitle">
          {lang === 'UA'
            ? 'Створіть акаунт для онлайн-запису'
            : 'Create account for online booking'}
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="form-group">
            <label>
              {lang === 'UA'
                ? 'ПІБ'
                : 'Full name'}
            </label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              placeholder={
                lang === 'UA'
                  ? 'Іваненко Олена'
                  : 'Olena Ivanenko'
              }
              className={
                touched.fullName && errors.fullName
                  ? 'error'
                  : ''
              }
              disabled={submitting}
            />

            {touched.fullName && errors.fullName && (
              <span className="error-message">
                {errors.fullName}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>
              {lang === 'UA'
                ? 'Телефон'
                : 'Phone'}
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              placeholder="+380991234567"
              className={
                touched.phone && errors.phone
                  ? 'error'
                  : ''
              }
              disabled={submitting}
            />

            {touched.phone && errors.phone && (
              <span className="error-message">
                {errors.phone}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="example@gmail.com"
              className={
                touched.email && errors.email
                  ? 'error'
                  : ''
              }
              disabled={submitting}
            />

            {touched.email && errors.email && (
              <span className="error-message">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>
              {lang === 'UA'
                ? 'Пароль'
                : 'Password'}
            </label>

            <div className="password-input-wrapper">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="********"
                className={
                  touched.password && errors.password
                    ? 'error'
                    : ''
                }
                disabled={submitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={submitting}
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
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>

            {renderStrength()}

            {touched.password && errors.password && (
              <span className="error-message">
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() =>
                  handleBlur('confirmPassword')
                }
                placeholder="********"
                className={
                  touched.confirmPassword &&
                  errors.confirmPassword
                    ? 'error'
                    : ''
                }
                disabled={submitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword((prev) => !prev)
                }
                disabled={submitting}
                aria-label={
                  showConfirmPassword
                    ? lang === 'UA'
                      ? 'Сховати повтор пароля'
                      : 'Hide confirm password'
                    : lang === 'UA'
                      ? 'Показати повтор пароля'
                      : 'Show confirm password'
                }
              >
                {showConfirmPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>

            {touched.confirmPassword &&
              errors.confirmPassword && (
                <span className="error-message">
                  {errors.confirmPassword}
                </span>
              )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                {lang === 'UA'
                  ? 'Мова'
                  : 'Language'}
              </label>

              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="UA">
                  Українська
                </option>

                <option value="EN">
                  English
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                {lang === 'UA'
                  ? 'Часовий пояс'
                  : 'Timezone'}
              </label>

              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="Europe/Kiev">
                  Europe/Kiev
                </option>

                <option value="Europe/London">
                  Europe/London
                </option>

                <option value="America/New_York">
                  America/New_York
                </option>
              </select>
            </div>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
              disabled={submitting}
            />

            <span>
              {lang === 'UA'
                ? 'Погоджуюсь з політикою конфіденційності'
                : 'I agree with privacy policy'}
            </span>
          </label>

          {touched.agree && errors.agree && (
            <span className="error-message">
              {errors.agree}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={submitting}
          >
            {submitting
              ? lang === 'UA'
                ? 'Створення...'
                : 'Creating...'
              : lang === 'UA'
                ? 'Створити акаунт'
                : 'Create account'}
          </button>

          <div className="auth-divider">
            <span>
              {lang === 'UA'
                ? 'або'
                : 'or'}
            </span>
          </div>

          <div className="auth-footer">
            <p>
              {lang === 'UA'
                ? 'Вже маєте акаунт?'
                : 'Already have account?'}{' '}

              <Link
                to="/login"
                state={{ from }}
                className="register-link"
              >
                {lang === 'UA'
                  ? 'Увійти'
                  : 'Login'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;