import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import '../../styles/pages/client-profile.css';

const Profile = () => {
  const { lang } = useLanguage();
  const { user, profile: authProfile, ensureProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let currentProfile = authProfile;

        if (!currentProfile) {
          currentProfile = await ensureProfile(user);
        }

        const normalizedProfile = {
          id: user.id,
          full_name:
            currentProfile?.full_name ||
            user?.user_metadata?.full_name ||
            user?.email ||
            '',
          phone:
            currentProfile?.phone ||
            user?.user_metadata?.phone ||
            '',
          email: user?.email || '',
          role: currentProfile?.role || 'client',
          language: currentProfile?.language || 'UA',
          timezone: currentProfile?.timezone || 'Europe/Kiev',
        };

        if (!isMounted) return;

        setProfile(normalizedProfile);
        setEditedProfile(normalizedProfile);
      } catch (error) {
        console.error('Profile loading failed:', error);

        alert(
          lang === 'UA'
            ? 'Не вдалося завантажити профіль'
            : 'Failed to load profile'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user, authProfile, ensureProfile, lang]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProfile(profile);
    }

    setIsEditing((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateProfile = () => {
    if (!editedProfile.full_name?.trim()) {
      alert(lang === 'UA' ? 'Введіть ПІБ' : 'Enter full name');
      return false;
    }

    if (!editedProfile.phone?.trim()) {
      alert(lang === 'UA' ? 'Введіть телефон' : 'Enter phone');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!validateProfile()) return;

    try {
      setSaving(true);

      const payload = {
        id: user.id,
        full_name: editedProfile.full_name.trim(),
        phone: editedProfile.phone.trim(),
        role: editedProfile.role || 'client',
        language: editedProfile.language || 'UA',
        timezone: editedProfile.timezone || 'Europe/Kiev',
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, {
          onConflict: 'id',
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const updatedProfile = {
        ...data,
        email: user.email,
      };

      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);

      alert(
        lang === 'UA'
          ? 'Профіль збережено'
          : 'Profile saved'
      );
    } catch (error) {
      console.error('Profile save failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти профіль: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save profile: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Профіль' : 'Profile'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Профіль' : 'Profile'}
        </h1>

        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Профіль не знайдено'
              : 'Profile not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Профіль' : 'Profile'}
      </h1>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-header">
            <h2>{lang === 'UA' ? 'Особисті дані' : 'Personal information'}</h2>

            <button
              type="button"
              className="icon-btn"
              onClick={handleEditToggle}
              disabled={saving}
              title={isEditing ? 'Cancel' : 'Edit'}
            >
              {isEditing ? <FaTimes /> : <FaEdit />}
            </button>
          </div>

          {isEditing ? (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="full_name">
                  {lang === 'UA' ? 'ПІБ' : 'Full name'}
                </label>

                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={editedProfile.full_name || ''}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  {lang === 'UA' ? 'Телефон' : 'Phone'}
                </label>

                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={editedProfile.phone || ''}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="+380..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editedProfile.email || ''}
                  disabled
                />

                <small>
                  {lang === 'UA'
                    ? 'Email змінюється через налаштування акаунта'
                    : 'Email is changed through account settings'}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="language">
                  {lang === 'UA' ? 'Мова' : 'Language'}
                </label>

                <select
                  id="language"
                  name="language"
                  value={editedProfile.language || 'UA'}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="UA">Українська</option>
                  <option value="EN">English</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timezone">
                  {lang === 'UA' ? 'Часовий пояс' : 'Timezone'}
                </label>

                <select
                  id="timezone"
                  name="timezone"
                  value={editedProfile.timezone || 'Europe/Kiev'}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="Europe/Kiev">Europe/Kiev</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <FaSave />{' '}
                {saving
                  ? lang === 'UA'
                    ? 'Збереження...'
                    : 'Saving...'
                  : lang === 'UA'
                    ? 'Зберегти'
                    : 'Save'}
              </button>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'ПІБ' : 'Full name'}:
                </span>

                <span className="info-value">{profile.full_name || '—'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Телефон' : 'Phone'}:
                </span>

                <span className="info-value">{profile.phone || '—'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>

                <span className="info-value">{profile.email || user?.email || '—'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Роль' : 'Role'}:
                </span>

                <span className="info-value">{profile.role || 'client'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Мова' : 'Language'}:
                </span>

                <span className="info-value">
                  {profile.language === 'UA' ? 'Українська' : 'English'}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  {lang === 'UA' ? 'Часовий пояс' : 'Timezone'}:
                </span>

                <span className="info-value">{profile.timezone || 'Europe/Kiev'}</span>
              </div>
            </div>
          )}
        </div>

        {/* <div className="medical-card">
          <h2>{lang === 'UA' ? 'Медична інформація' : 'Medical information'}</h2>

          <p className="medical-note">
            {lang === 'UA'
              ? 'Медична картка буде доступна після додавання рекомендацій або документів спеціалістом.'
              : 'Medical card will be available after a specialist adds recommendations or documents.'}
          </p>

          <div className="medical-actions">
            <button type="button" className="btn-outline" disabled>
              {lang === 'UA'
                ? 'Медична картка скоро'
                : 'Medical card coming soon'}
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Profile;