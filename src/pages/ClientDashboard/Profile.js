import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { clients } from '../../data/mockData';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const Profile = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [medicalInfo, setMedicalInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  // Завантаження даних клієнта з mockData
  useEffect(() => {
    if (user) {
      // Припускаємо, що user.id збігається з id в clients
      const clientData = clients.find(c => c.id === user.id) || clients[0]; // fallback
      setProfile(clientData);
      setEditedProfile(clientData);

      // Медична інформація (можна винести в окремий масив, але для прикладу додамо тут)
      setMedicalInfo({
        bloodType: 'A+',
        allergies: ['Пеніцилін', 'Пилок'],
        chronicDiseases: ['Гіпертонія', 'Остеохондроз'],
        emergencyContact: '+380 99 111 22 33 (Мати)',
      });
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Скасувати редагування – повернути оригінал
      setEditedProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Тут має бути виклик API для оновлення профілю
    setProfile(editedProfile);
    setIsEditing(false);
    console.log('Saved profile:', editedProfile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  if (!profile) {
    return <div className="container loading">{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</div>;
  }

  return (
    <div className="profile-page">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Профіль' : 'Profile'}</h1>

      <div className="profile-grid">
        {/* Ліва колонка – персональні дані */}
        <div className="profile-card">
          <div className="profile-header">
            <h2>{lang === 'UA' ? 'Особисті дані' : 'Personal Information'}</h2>
            <button className="icon-btn" onClick={handleEditToggle}>
              {isEditing ? <FaTimes /> : <FaEdit />}
            </button>
          </div>

          {isEditing ? (
            // Режим редагування
            <div className="profile-form">
              <div className="form-group">
                <label>{lang === 'UA' ? 'ПІБ' : 'Full name'}</label>
                <input
                  type="text"
                  name="name"
                  value={editedProfile.name || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Телефон' : 'Phone'}</label>
                <input
                  type="tel"
                  name="phone"
                  value={editedProfile.phone || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Мова' : 'Language'}</label>
                <select name="language" value={editedProfile.language || 'UA'} onChange={handleChange}>
                  <option value="UA">Українська</option>
                  <option value="EN">English</option>
                </select>
              </div>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Часовий пояс' : 'Timezone'}</label>
                <select name="timezone" value={editedProfile.timezone || 'Europe/Kiev'} onChange={handleChange}>
                  <option value="Europe/Kiev">Europe/Kiev</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
              <button className="btn-primary" onClick={handleSave}>
                <FaSave /> {lang === 'UA' ? 'Зберегти' : 'Save'}
              </button>
            </div>
          ) : (
            // Режим перегляду
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'ПІБ' : 'Full name'}:</span>
                <span className="info-value">{profile.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Телефон' : 'Phone'}:</span>
                <span className="info-value">{profile.phone}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Мова' : 'Language'}:</span>
                <span className="info-value">{profile.language === 'UA' ? 'Українська' : 'English'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Часовий пояс' : 'Timezone'}:</span>
                <span className="info-value">{profile.timezone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Права колонка – медична картка */}
        {medicalInfo && (
          <div className="medical-card">
            <h2>{lang === 'UA' ? 'Медична картка' : 'Medical Card'}</h2>
            <div className="medical-info">
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Група крові' : 'Blood type'}:</span>
                <span className="info-value">{medicalInfo.bloodType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Алергії' : 'Allergies'}:</span>
                <span className="info-value">{medicalInfo.allergies.join(', ')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Хронічні захворювання' : 'Chronic diseases'}:</span>
                <span className="info-value">{medicalInfo.chronicDiseases.join(', ')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{lang === 'UA' ? 'Контакт на випадок екстреної ситуації' : 'Emergency contact'}:</span>
                <span className="info-value">{medicalInfo.emergencyContact}</span>
              </div>
            </div>
            <p className="medical-note">
              {lang === 'UA'
                ? 'Ця інформація допоможе лікарю краще зрозуміти ваш стан.'
                : 'This information helps the doctor better understand your condition.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;