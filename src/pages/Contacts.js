import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { contactInfo } from '../data/mockData';

const Contacts = () => {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    topic: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Імітація відправки форми
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', phone: '', email: '', topic: '', message: '' });
      
      // Скинути повідомлення про успіх через 5 секунд
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="contacts-page">
      <div className="container">
        <h1 className="section-title">
          {lang === 'UA' ? 'Контакти' : 'Contacts'}
        </h1>

        <div className="contacts-grid">
          {/* Ліва колонка – форма */}
          <div className="contact-form-card">
            <h2>
              {lang === 'UA' 
                ? 'Зв\'яжіться з нами' 
                : 'Get in touch'}
            </h2>
            <p className="form-subtitle">
              {lang === 'UA'
                ? 'Залиште своє повідомлення, і наш менеджер зв\'яжеться з вами найближчим часом'
                : 'Leave your message and our manager will contact you soon'}
            </p>

            {submitSuccess && (
              <div className="success-message">
                {lang === 'UA'
                  ? 'Дякуємо! Ваше повідомлення надіслано.'
                  : 'Thank you! Your message has been sent.'}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder={lang === 'UA' ? "Ваше ім'я" : "Your name"}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder={lang === 'UA' ? "Номер телефону" : "Phone number"}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="topic"
                  placeholder={lang === 'UA' ? "Тема" : "Subject"}
                  value={formData.topic}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <textarea
                  name="message"
                  rows="5"
                  placeholder={lang === 'UA' ? "Повідомлення" : "Message"}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (lang === 'UA' ? 'Відправка...' : 'Sending...') 
                  : (lang === 'UA' ? 'Надіслати' : 'Send')}
              </button>
            </form>

            <p className="privacy-note">
              {lang === 'UA'
                ? 'Натискаючи "Надіслати", ви погоджуєтесь з політикою конфіденційності'
                : 'By clicking "Send", you agree to our privacy policy'}
            </p>
          </div>

          {/* Права колонка – контактна інформація */}
          <div className="contact-info-card">
            <h2>{lang === 'UA' ? 'Контакти' : 'Contact info'}</h2>
            
            <div className="info-block">
              <h3>{lang === 'UA' ? 'Гаряча лінія' : 'Hotline'}</h3>
              <a href={`tel:${contactInfo.hotline.replace(/\s/g, '')}`} className="info-link">
                {contactInfo.hotline}
              </a>
            </div>

            <div className="info-block">
              <h3>Email</h3>
              <a href={`mailto:${contactInfo.email}`} className="info-link">
                {contactInfo.email}
              </a>
            </div>

            <div className="info-block">
              <h3>{lang === 'UA' ? 'Години роботи' : 'Working hours'}</h3>
              <p>{contactInfo.hours[lang]}</p>
            </div>

            <div className="info-block">
              <h3>{lang === 'UA' ? 'Месенджери' : 'Messengers'}</h3>
              <div className="messenger-links">
                <a href={contactInfo.messengers.telegram} target="_blank" rel="noopener noreferrer" className="messenger-link">
                  Telegram
                </a>
                <a href={contactInfo.messengers.viber} target="_blank" rel="noopener noreferrer" className="messenger-link">
                  Viber
                </a>
                <a href={contactInfo.messengers.whatsapp} target="_blank" rel="noopener noreferrer" className="messenger-link">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;