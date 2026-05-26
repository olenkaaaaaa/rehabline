import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';

const ReviewModal = ({ isOpen, onClose, appointment, onSubmit }) => {
  const { lang } = useLanguage();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hover, setHover] = useState(null);

  if (!isOpen) return null;

  const specialistName =
    appointment?.specialists?.name ||
    appointment?.specialistName ||
    (lang === 'UA' ? 'спеціаліста' : 'specialist');

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      appointmentId: appointment?.id,
      rating,
      comment: comment.trim(),
      isAnonymous,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <h2>{lang === 'UA' ? 'Залиште відгук' : 'Leave a review'}</h2>

            <p>
              {lang === 'UA'
                ? `Як минув візит до ${specialistName}?`
                : `How was your visit with ${specialistName}?`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
            <label>{lang === 'UA' ? 'Коментар' : 'Comment'}</label>

            <textarea
              placeholder={
                lang === 'UA'
                  ? 'Ваш коментар необовʼязковий'
                  : 'Your comment is optional'
              }
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
            />
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />

            <span>{lang === 'UA' ? 'Анонімно' : 'Anonymous'}</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {lang === 'UA' ? 'Скасувати' : 'Cancel'}
            </button>

            <button type="submit" className="btn btn-primary">
              {lang === 'UA' ? 'Надіслати' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;