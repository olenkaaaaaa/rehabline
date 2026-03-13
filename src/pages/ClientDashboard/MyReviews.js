import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { reviews as allReviews, appointments, specialists } from '../../data/mockData';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';

const MyReviews = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const clientId = user?.id || 1;

  const [reviews, setReviews] = useState(allReviews.filter(r => r.clientId === clientId));
  const [editingReview, setEditingReview] = useState(null);
  const [editText, setEditText] = useState('');

  // Збагачуємо відгуки назвами послуг та спеціалістів
  const enrichedReviews = useMemo(() => {
    return reviews.map(review => {
      const app = appointments.find(a => a.id === review.appointmentId);
      const specialist = specialists.find(s => s.id === review.specialistId);
      return {
        ...review,
        specialistName: specialist?.name || '',
        serviceName: app ? appointments.find(a => a.id === review.appointmentId)?.serviceId : '', // спрощено, треба service
      };
    });
  }, [reviews]);

  const handleEdit = (review) => {
    setEditingReview(review.id);
    setEditText(review.comment);
  };

  const handleSave = (id) => {
    // Тут має бути виклик API для оновлення відгуку
    setReviews(prev => prev.map(r => r.id === id ? { ...r, comment: editText } : r));
    setEditingReview(null);
  };

  const handleDelete = (id) => {
    if (window.confirm(lang === 'UA' ? 'Видалити відгук?' : 'Delete review?')) {
      setReviews(prev => prev.filter(r => r.id !== id));
      // API виклик
    }
  };

  return (
    <div className="my-reviews">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Мої відгуки' : 'My Reviews'}</h1>
      {enrichedReviews.length === 0 ? (
        <p className="no-data">{lang === 'UA' ? 'Ви ще не залишали відгуків' : 'No reviews yet'}</p>
      ) : (
        <div className="reviews-grid">
          {enrichedReviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <span className="specialist-name">{review.specialistName}</span>
                <span className="review-date">{review.date}</span>
              </div>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={`star ${i < review.rating ? 'active' : ''}`} />
                ))}
              </div>
              {editingReview === review.id ? (
                <div className="review-edit">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="3"
                  />
                  <div className="edit-actions">
                    <button className="btn-primary" onClick={() => handleSave(review.id)}>
                      {lang === 'UA' ? 'Зберегти' : 'Save'}
                    </button>
                    <button className="btn-outline" onClick={() => setEditingReview(null)}>
                      {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="review-comment">{review.comment}</p>
                  <div className="review-actions">
                    <button className="icon-btn" onClick={() => handleEdit(review)}>
                      <FaEdit />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(review.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;