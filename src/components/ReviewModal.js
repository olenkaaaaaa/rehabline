import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaStar } from 'react-icons/fa';

const ReviewModal = ({ isOpen, onClose, appointment, onSubmit }) => {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hover, setHover] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment, isAnonymous });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{lang === 'UA' ? 'Залиште відгук' : 'Leave a review'}</h2>
        <p>
          {lang === 'UA'
            ? `Як минув візит до ${appointment.specialistName}?`
            : `How was your visit with ${appointment.specialistName}?`}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="rating">
            {[1, 2, 3, 4, 5].map((star) => (
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
            placeholder={lang === 'UA' ? 'Ваш коментар (необов\'язково)' : 'Your comment (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span>{lang === 'UA' ? 'Анонімно' : 'Anonymous'}</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              {lang === 'UA' ? 'Скасувати' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              {lang === 'UA' ? 'Надіслати' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;