import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const { lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  // Стан форми
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

  // Стан для відображення пароля
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Стан для помилок валідації
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Стан для сили пароля
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Валідація пароля в реальному часі
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

  // Обробка змін у формі
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Позначення поля як "торкнуте" при втраті фокусу
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Валідація всіх полів
  const validateForm = () => {
    const newErrors = {};

    // ПІБ
    if (!formData.fullName.trim()) {
      newErrors.fullName = lang === 'UA' ? "Введіть ПІБ" : "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = lang === 'UA' ? "Ім'я занадто коротке" : "Name is too short";
    }

    // Телефон (український формат)
    const phoneRegex = /^\+?380\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = lang === 'UA' ? "Введіть телефон" : "Phone is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = lang === 'UA' ? "Невірний формат телефону (має бути +380XXXXXXXXX)" : "Invalid phone format (should be +380XXXXXXXXX)";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = lang === 'UA' ? "Введіть email" : "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = lang === 'UA' ? "Некоректний email" : "Invalid email";
    }

    // Пароль
    if (!formData.password) {
      newErrors.password = lang === 'UA' ? "Введіть пароль" : "Password is required";
    } else {
      const strengthValues = Object.values(passwordStrength);
      if (strengthValues.some(v => !v)) {
        newErrors.password = lang === 'UA' ? "Пароль не відповідає вимогам" : "Password does not meet requirements";
      }
    }

    // Підтвердження пароля
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = lang === 'UA' ? "Паролі не співпадають" : "Passwords do not match";
    }

    // Згода
    if (!formData.agree) {
      newErrors.agree = lang === 'UA' ? "Необхідна згода на обробку даних" : "You must agree to the privacy policy";
    }

    return newErrors;
  };

  // Відправка форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      agree: true,
    });

    if (Object.keys(newErrors).length === 0) {
      try {
        await register(formData);
        // Після успішної реєстрації перенаправляємо на логін (або відразу в кабінет)
        navigate('/login', { state: { from } });
      } catch (error) {
        console.error('Registration failed:', error);
        alert(lang === 'UA' ? 'Помилка реєстрації' : 'Registration failed');
      }
    }
  };

  // Функція для відображення індикатора сили пароля
  const renderPasswordStrength = () => {
    const requirements = [
      { key: 'length', label: lang === 'UA' ? 'Мінімум 8 символів' : 'At least 8 characters' },
      { key: 'uppercase', label: lang === 'UA' ? 'Велика літера' : 'Uppercase letter' },
      { key: 'lowercase', label: lang === 'UA' ? 'Мала літера' : 'Lowercase letter' },
      { key: 'number', label: lang === 'UA' ? 'Цифра' : 'Number' },
      { key: 'special', label: lang === 'UA' ? 'Спеціальний символ (!@#$...)' : 'Special character (!@#$...)' },
    ];

    return (
      <div className="password-strength">
        {requirements.map((req) => (
          <div key={req.key} className={`strength-item ${passwordStrength[req.key] ? 'valid' : 'invalid'}`}>
            {passwordStrength[req.key] ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Реєстрація' : 'Register'}
        </h1>
        <p className="auth-subtitle">
          {lang === 'UA' ? 'Створіть акаунт для онлайн-записів' : 'Create an account for online booking'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* ПІБ */}
          <div className="form-group">
            <label htmlFor="fullName">
              {lang === 'UA' ? 'ПІБ' : 'Full name'}
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              placeholder={lang === 'UA' ? 'Бурдж Олена' : 'Olena Burdiak'}
              className={touched.fullName && errors.fullName ? 'error' : ''}
            />
            {touched.fullName && errors.fullName && (
              <span className="error-message">{errors.fullName}</span>
            )}
          </div>

          {/* Телефон */}
          <div className="form-group">
            <label htmlFor="phone">
              {lang === 'UA' ? 'Телефон' : 'Phone'}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              placeholder="+380991234567"
              className={touched.phone && errors.phone ? 'error' : ''}
            />
            {touched.phone && errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="burdyak.olena@gmail.com"
              className={touched.email && errors.email ? 'error' : ''}
            />
            {touched.email && errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Пароль */}
          <div className="form-group">
            <label htmlFor="password">
              {lang === 'UA' ? 'Пароль' : 'Password'}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="********"
                className={touched.password && errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {touched.password && errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
            {renderPasswordStrength()}
          </div>

          {/* Підтвердження пароля */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              {lang === 'UA' ? 'Пароль ще раз' : 'Confirm password'}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="********"
                className={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Мова та часовий пояс */}
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="language">
                {lang === 'UA' ? 'Мова інтерфейсу' : 'Interface language'}
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="UA">Українська (UA)</option>
                <option value="EN">English (EN)</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="timezone">
                {lang === 'UA' ? 'Часовий пояс' : 'Timezone'}
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
              >
                <option value="Europe/Kiev">Europe/Kiev</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>

          {/* Згода */}
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                onBlur={() => handleBlur('agree')}
              />
              <span>
                {lang === 'UA'
                  ? 'Погоджуюсь на обробку персональних даних (Privacy Policy)'
                  : 'I agree to the processing of personal data (Privacy Policy)'}
              </span>
            </label>
            {touched.agree && errors.agree && (
              <span className="error-message">{errors.agree}</span>
            )}
          </div>

          <button type="submit" className="btn-primary auth-btn">
            {lang === 'UA' ? 'Створити акаунт' : 'Create account'}
          </button>

          <div className="auth-divider">
            <span>{lang === 'UA' ? 'або' : 'or'}</span>
          </div>

          <div className="auth-footer">
            <p>
              {lang === 'UA' ? 'Вже маєте акаунт?' : 'Already have an account?'}{' '}
              <Link to="/login" state={{ from }} className="register-link">
                {lang === 'UA' ? 'Увійти' : 'Login'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;