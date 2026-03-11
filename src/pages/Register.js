import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa';

const Register = () => {
  const { lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  // Основний стан форми
  const [step, setStep] = useState(1); // 1: дані, 2: OTP
  const [role, setRole] = useState('client'); // client, specialist
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    language: 'UA',
    timezone: 'Europe/Kiev',
    // Для лікаря
    specialty: '',
    license: '',
    experience: '',
    clinic: '',
    documents: null,
  });
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Валідація
  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      alert(lang === 'UA' ? 'Заповніть всі поля' : 'Fill all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      alert(lang === 'UA' ? 'Паролі не співпадають' : 'Passwords do not match');
      return false;
    }
    if (!formData.agreeTerms) {
      alert(lang === 'UA' ? 'Потрібно погодитися з умовами' : 'You must agree to the terms');
      return false;
    }
    if (role === 'specialist') {
      if (!formData.specialty || !formData.license) {
        alert(lang === 'UA' ? 'Заповніть професійні дані' : 'Fill professional data');
        return false;
      }
    }
    return true;
  };

  const handleSubmitStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      // Тут можна відправити дані на сервер для створення тимчасового запису
      setStep(2);
      startTimer();
    }
  };

  const startTimer = () => {
    setTimer(45);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    console.log('Verifying code:', fullCode);
    // Імітація успішної реєстрації
    register({
      name: formData.name,
      email: formData.email,
      role: role,
    });
    navigate(`/${role === 'client' ? 'client' : 'specialist'}`);
  };

  const handleSocialRegister = (provider) => {
    console.log(`Register with ${provider}`);
    // Тут буде OAuth
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <h1 className="auth-title">
          {lang === 'UA' ? 'Реєстрація' : 'Register'}
        </h1>
        <p className="auth-subtitle">
          {lang === 'UA' 
            ? 'Створіть акаунт для онлайн-записів' 
            : 'Create an account for online booking'}
        </p>

        {/* Вибір ролі (тільки на першому кроці) */}
        {step === 1 && (
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'client' ? 'active' : ''}`}
              onClick={() => setRole('client')}
            >
              {lang === 'UA' ? 'Клієнт' : 'Client'}
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'specialist' ? 'active' : ''}`}
              onClick={() => setRole('specialist')}
            >
              {lang === 'UA' ? 'Лікар' : 'Specialist'}
            </button>
          </div>
        )}

        {step === 1 ? (
          // Крок 1: Особисті дані
          <form onSubmit={handleSubmitStep1} className="auth-form">
            {/* Спільні поля */}
            <div className="form-group">
              <label>{lang === 'UA' ? 'ПІБ' : 'Full name'}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={lang === 'UA' ? 'Бурдяк Олена' : 'Olena Burdiak'}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="burdyak.olena@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Телефон' : 'Phone'}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+380..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{lang === 'UA' ? 'Пароль' : 'Password'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="********"
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Пароль ще раз' : 'Confirm password'}</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="********"
                  required
                />
              </div>
            </div>

            {/* Специфічні поля для лікаря */}
            {role === 'specialist' && (
              <div className="specialist-fields">
                <h3>{lang === 'UA' ? 'Професійна інформація' : 'Professional info'}</h3>
                
                <div className="form-group">
                  <label>{lang === 'UA' ? 'Спеціальність' : 'Specialty'}</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    placeholder={lang === 'UA' ? 'Фізичний терапевт' : 'Physical therapist'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Номер ліцензії' : 'License number'}</label>
                  <input
                    type="text"
                    value={formData.license}
                    onChange={(e) => setFormData({...formData, license: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Роки досвіду' : 'Years of experience'}</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Місце роботи' : 'Workplace'}</label>
                  <input
                    type="text"
                    value={formData.clinic}
                    onChange={(e) => setFormData({...formData, clinic: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Завантажте документи' : 'Upload documents'}</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFormData({...formData, documents: e.target.files})}
                  />
                  <small>
                    {lang === 'UA' 
                      ? 'Скан ліцензії, сертифікатів (буде перевірено адміном)' 
                      : 'License scan, certificates (will be verified by admin)'}
                  </small>
                </div>
              </div>
            )}

            {/* Додаткові опції */}
            <div className="form-options vertical">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                />
                <span>
                  {lang === 'UA' 
                    ? 'Погоджуюсь на обробку персональних даних (Privacy Policy)' 
                    : 'I agree to the processing of personal data (Privacy Policy)'}
                </span>
              </label>

              <div className="form-row">
                <div className="form-group">
                  <label>{lang === 'UA' ? 'Мова інтерфейсу' : 'Interface language'}</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                  >
                    <option value="UA">Українська (UA)</option>
                    <option value="EN">English (EN)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{lang === 'UA' ? 'Часовий пояс' : 'Timezone'}</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  >
                    <option value="Europe/Kiev">Europe/Kiev</option>
                    <option value="Europe/Warsaw">Europe/Warsaw</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-btn">
              {lang === 'UA' ? 'Створити акаунт' : 'Create account'}
            </button>

            <div className="auth-divider">
              <span>{lang === 'UA' ? 'або' : 'or'}</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleSocialRegister('Google')}
              >
                <FaGoogle /> Google
              </button>
              <button
                type="button"
                className="social-btn facebook"
                onClick={() => handleSocialRegister('Facebook')}
              >
                <FaFacebookF /> Facebook
              </button>
              <button
                type="button"
                className="social-btn apple"
                onClick={() => handleSocialRegister('Apple')}
              >
                <FaApple /> Apple
              </button>
            </div>

            <p className="auth-footer-text">
              {lang === 'UA' ? 'Вже є акаунт?' : 'Already have an account?'}{' '}
              <Link to="/login" className="register-link">
                {lang === 'UA' ? 'Увійти' : 'Log in'}
              </Link>
            </p>
          </form>
        ) : (
          // Крок 2: OTP підтвердження
          <form onSubmit={handleCodeSubmit} className="auth-form">
            <div className="otp-container">
              <p className="code-info">
                {lang === 'UA'
                  ? 'Введіть код, який ми надіслали на телефон або email'
                  : 'Enter the code we sent to your phone or email'}
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
                <span>
                  {lang === 'UA' ? 'Не отримали код?' : "Didn't receive the code?"}
                </span>
                <button
                  type="button"
                  className="resend-btn"
                  disabled={!canResend}
                  onClick={startTimer}
                >
                  {lang === 'UA' ? 'Надіслати ще раз' : 'Resend'}
                </button>
                {timer > 0 && <span className="timer">00:{timer.toString().padStart(2, '0')}</span>}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;