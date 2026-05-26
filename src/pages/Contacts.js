import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/pages/contacts.css';

const Contacts = () => {
  const { lang } = useLanguage();

  return (
    <main className="contacts-page">
      <section className="contacts-hero">
        <div className="container">
          <h1>{lang === 'UA' ? 'Контакти' : 'Contacts'}</h1>
          <p>
            {lang === 'UA'
              ? 'Звʼяжіться з нами зручним способом або залиште повідомлення.'
              : 'Contact us in a convenient way or leave a message.'}
          </p>
        </div>
      </section>

      <section className="contacts-section">
        <div className="container">
          <div className="contacts-grid">
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>{lang === 'UA' ? 'Телефон' : 'Phone'}</h3>
              <p>+38 (0XX) XXX-XX-XX</p>
              <span>
                {lang === 'UA'
                  ? 'Пн–Пт: 08:00–20:00'
                  : 'Mon–Fri: 08:00–20:00'}
              </span>
            </div>

            <div className="contact-card">
              <div className="contact-icon">✉️</div>
              <h3>Email</h3>
              <p>support@rehabline.ua</p>
              <span>
                {lang === 'UA'
                  ? 'Відповідаємо протягом робочого дня'
                  : 'We respond during business hours'}
              </span>
            </div>

            <div className="contact-card">
              <div className="contact-icon">💬</div>
              <h3>{lang === 'UA' ? 'Підтримка' : 'Support'}</h3>
              <p>
                {lang === 'UA'
                  ? 'Допомога із записом'
                  : 'Booking assistance'}
              </p>
              <span>
                {lang === 'UA'
                  ? 'Підкажемо з послугами та спеціалістами'
                  : 'We help with services and specialists'}
              </span>
            </div>
          </div>

          <div className="contact-form-card">
            <div>
              <h2>
                {lang === 'UA'
                  ? 'Напишіть нам'
                  : 'Send us a message'}
              </h2>

              <p>
                {lang === 'UA'
                  ? 'Залиште коротке повідомлення, і адміністратор звʼяжеться з вами.'
                  : 'Leave a short message and the administrator will contact you.'}
              </p>
            </div>

            <form className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    {lang === 'UA' ? 'Ваше імʼя' : 'Your name'}
                  </label>
                  <input type="text" placeholder={lang === 'UA' ? 'Імʼя' : 'Name'} />
                </div>

                <div className="form-group">
                  <label>
                    {lang === 'UA' ? 'Телефон або email' : 'Phone or email'}
                  </label>
                  <input type="text" placeholder="+380..." />
                </div>
              </div>

              <div className="form-group">
                <label>
                  {lang === 'UA' ? 'Повідомлення' : 'Message'}
                </label>
                <textarea
                  rows="5"
                  placeholder={
                    lang === 'UA'
                      ? 'Напишіть ваше питання...'
                      : 'Write your question...'
                  }
                />
              </div>

              <button type="button" className="btn btn-primary">
                {lang === 'UA' ? 'Надіслати' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contacts;