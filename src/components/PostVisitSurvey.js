import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaStar } from 'react-icons/fa';

const PostVisitSurvey = ({ appointment, onClose, onSubmit }) => {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert(lang === 'UA' ? 'Будь ласка, оцініть візит' : 'Please rate your visit');
      return;
    }
    onSubmit({ appointmentId: appointment.id, rating, feedback });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{lang === 'UA' ? 'Як минув візит?' : 'How was your visit?'}</h2>
        <p>
          {lang === 'UA' ? 'Оцініть ваш візит до' : 'Rate your visit to'} {appointment.specialistName}
        </p>

        <div className="rating">
          {[1, 2, 3, 4, 5].map(star => (
            <FaStar
              key={star}
              className={`star ${(hover || rating) >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </div>

        <textarea
          placeholder={lang === 'UA' ? 'Ваш коментар (необов\'язково)' : 'Your feedback (optional)'}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows="3"
        />

        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>
            {lang === 'UA' ? 'Пізніше' : 'Later'}
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {lang === 'UA' ? 'Надіслати' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostVisitSurvey;