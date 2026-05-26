import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import '../../styles/pages/client-reviews.css';

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getReviewComment = (review) => {
  return review.comment || review.text || review.message || '';
};

const MyReviews = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [savingEdit, setSavingEdit] = useState(false);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    searchParams.get('appointment') || ''
  );
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const [
          reviewsResponse,
          appointmentsResponse,
          servicesResponse,
          specialistsResponse,
        ] = await Promise.all([
          supabase
            .from('reviews')
            .select('*')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false }),

          supabase
            .from('appointments')
            .select('*')
            .eq('client_id', user.id)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false }),

          supabase.from('services').select('*'),

          supabase.from('specialists').select('*'),
        ]);

        if (reviewsResponse.error) throw reviewsResponse.error;
        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;

        if (!isMounted) return;

        setReviews(reviewsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setServices(servicesResponse.data || []);
        setSpecialists(specialistsResponse.data || []);
      } catch (error) {
        console.error('Reviews loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити відгуки'
            : 'Failed to load reviews'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const enrichedReviews = useMemo(() => {
    return reviews.map((review) => {
      const appointment = appointments.find(
        (item) => item.id === review.appointment_id
      );

      const specialist = specialists.find(
        (item) => item.id === review.specialist_id
      );

      const service = services.find(
        (item) => item.id === appointment?.service_id
      );

      return {
        ...review,
        appointment,
        specialist,
        service,
        specialistName: specialist?.name || '',
        serviceName: getServiceName(service, lang),
        dateLabel: review.created_at
          ? new Date(review.created_at).toLocaleDateString(
              lang === 'UA' ? 'uk-UA' : 'en-US'
            )
          : '',
        commentText: getReviewComment(review),
      };
    });
  }, [reviews, appointments, specialists, services, lang]);

  const reviewableAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const alreadyReviewed = reviews.some(
        (review) => review.appointment_id === appointment.id
      );

      return appointment.status === 'completed' && !alreadyReviewed;
    });
  }, [appointments, reviews]);

  const getAppointmentLabel = (appointment) => {
    const service = services.find((item) => item.id === appointment.service_id);
    const specialist = specialists.find((item) => item.id === appointment.specialist_id);

    return `${appointment.appointment_date} ${String(
      appointment.appointment_time || ''
    ).slice(0, 5)} · ${getServiceName(service, lang)} · ${specialist?.name || ''}`;
  };

  const renderStars = (rating, onClick) => {
    return (
      <div className="review-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button ${star <= Number(rating) ? 'active' : ''}`}
            onClick={() => onClick?.(star)}
            disabled={!onClick}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();

    if (!user?.id) return;

    if (!selectedAppointmentId) {
      alert(lang === 'UA' ? 'Оберіть запис' : 'Choose an appointment');
      return;
    }

    if (!newComment.trim()) {
      alert(lang === 'UA' ? 'Напишіть відгук' : 'Write a review');
      return;
    }

    const appointment = appointments.find(
      (item) => item.id === Number(selectedAppointmentId)
    );

    if (!appointment) {
      alert(lang === 'UA' ? 'Запис не знайдено' : 'Appointment not found');
      return;
    }

    try {
      setCreating(true);

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          client_id: user.id,
          appointment_id: appointment.id,
          specialist_id: appointment.specialist_id,
          rating: Number(newRating),
          comment: newComment.trim(),
          is_anonymous: isAnonymous,
        })
        .select('*')
        .single();

      if (error) throw error;

      setReviews((prev) => [data, ...prev]);
      setSelectedAppointmentId('');
      setNewRating(5);
      setNewComment('');
      setIsAnonymous(false);

      alert(lang === 'UA' ? 'Відгук додано' : 'Review added');
    } catch (error) {
      console.error('Create review failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося додати відгук: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to add review: ${error.message || 'Please try again'}`
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReviewId(review.id);
    setEditText(getReviewComment(review));
    setEditRating(Number(review.rating || 5));
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditText('');
    setEditRating(5);
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editText.trim()) {
      alert(lang === 'UA' ? 'Відгук не може бути порожнім' : 'Review cannot be empty');
      return;
    }

    try {
      setSavingEdit(true);

      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: Number(editRating),
          comment: editText.trim(),
        })
        .eq('id', reviewId)
        .eq('client_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      setReviews((prev) =>
        prev.map((review) => (review.id === reviewId ? data : review))
      );

      handleCancelEdit();
    } catch (error) {
      console.error('Update review failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося зберегти відгук'
          : 'Failed to save review'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm(
      lang === 'UA' ? 'Видалити відгук?' : 'Delete review?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('client_id', user.id);

      if (error) throw error;

      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    } catch (error) {
      console.error('Delete review failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося видалити відгук'
          : 'Failed to delete review'
      );
    }
  };

  if (loading) {
    return (
      <div className="my-reviews">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мої відгуки' : 'My Reviews'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження відгуків...' : 'Loading reviews...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reviews">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Мої відгуки' : 'My Reviews'}
      </h1>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      {reviewableAppointments.length > 0 && (
        <section className="review-form-card">
          <h2>{lang === 'UA' ? 'Залишити відгук' : 'Leave a review'}</h2>

          <form onSubmit={handleCreateReview}>
            <div className="form-group">
              <label htmlFor="appointment">
                {lang === 'UA' ? 'Запис' : 'Appointment'}
              </label>

              <select
                id="appointment"
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                disabled={creating}
              >
                <option value="">
                  {lang === 'UA' ? 'Оберіть завершений запис' : 'Choose completed appointment'}
                </option>

                {reviewableAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {getAppointmentLabel(appointment)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{lang === 'UA' ? 'Оцінка' : 'Rating'}</label>
              {renderStars(newRating, setNewRating)}
            </div>

            <div className="form-group">
              <label htmlFor="newComment">
                {lang === 'UA' ? 'Ваш відгук' : 'Your review'}
              </label>

              <textarea
                id="newComment"
                rows="4"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={creating}
                />
                {lang === 'UA' ? 'Залишити анонімно' : 'Leave anonymously'}
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={creating}>
              {creating
                ? lang === 'UA'
                  ? 'Додавання...'
                  : 'Adding...'
                : lang === 'UA'
                  ? 'Додати відгук'
                  : 'Add review'}
            </button>
          </form>
        </section>
      )}

      {enrichedReviews.length === 0 ? (
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Ви ще не залишали відгуків'
              : 'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className="reviews-grid">
          {enrichedReviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div>
                  <span className="specialist-name">
                    {review.specialistName || '—'}
                  </span>

                  {review.serviceName && (
                    <p className="review-service">{review.serviceName}</p>
                  )}
                </div>

                <span className="review-date">{review.dateLabel}</span>
              </div>

              {editingReviewId === review.id ? (
                <div className="review-edit">
                  {renderStars(editRating, setEditRating)}

                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="3"
                    disabled={savingEdit}
                  />

                  <div className="edit-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleSaveEdit(review.id)}
                      disabled={savingEdit}
                    >
                      {savingEdit
                        ? lang === 'UA'
                          ? 'Збереження...'
                          : 'Saving...'
                        : lang === 'UA'
                          ? 'Зберегти'
                          : 'Save'}
                    </button>

                    <button
                      className="btn-outline"
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                    >
                      {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {renderStars(review.rating)}

                  <p className="review-comment">{review.commentText}</p>

                  {review.is_anonymous && (
                    <p className="hint">
                      {lang === 'UA' ? 'Анонімний відгук' : 'Anonymous review'}
                    </p>
                  )}

                  <div className="review-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleEdit(review)}
                      title={lang === 'UA' ? 'Редагувати' : 'Edit'}
                    >
                      <FaEdit />
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDelete(review.id)}
                      title={lang === 'UA' ? 'Видалити' : 'Delete'}
                    >
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