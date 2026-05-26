import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const PostVisitSurvey = ({ appointment, onClose, onSubmit }) => {
  const { lang } = useLanguage();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [feedback, setFeedback] = useState('');

  const specialistName =
    appointment?.specialists?.name ||
    appointment?.specialistName ||
    (lang === 'UA' ? 'спеціаліста' : 'specialist');

  const handleSubmit = () => {
    if (!rating) {
      alert(lang === 'UA' ? 'Будь ласка, оцініть візит' : 'Please rate your visit');
      return;
    }

    onSubmit({
      appointmentId: appointment?.id,
      rating,
      feedback: feedback.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <h2>{lang === 'UA' ? 'Як минув візит?' : 'How was your visit?'}</h2>
            <p>
              {lang === 'UA' ? 'Оцініть ваш візит до' : 'Rate your visit to'}{' '}
              {specialistName}
            </p>
          </div>
        </div>

        <div className="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`rating-star ${(hover || rating) >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              aria-label={`${star} ${lang === 'UA' ? 'зірок' : 'stars'}`}
            >
              <FaStar />
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>{lang === 'UA' ? 'Коментар' : 'Feedback'}</label>

          <textarea
            placeholder={
              lang === 'UA'
                ? 'Ваш коментар необовʼязковий'
                : 'Your feedback is optional'
            }
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={3}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {lang === 'UA' ? 'Пізніше' : 'Later'}
          </button>

          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {lang === 'UA' ? 'Надіслати' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostVisitSurvey;