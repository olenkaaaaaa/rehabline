import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { createAuditLog } from '../../utils/auditLog';
import { FaUpload } from 'react-icons/fa';
import '../../styles/pages/specialist-profile.css';
const SpecialistProfile = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialtyUA: '',
    specialtyEN: '',
    experienceYears: '',
    descriptionUA: '',
    descriptionEN: '',
    directionsUA: '',
    directionsEN: '',
    educationUA: '',
    educationEN: '',
    certificates: '',
    photoUrl: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSpecialist(null);
        return;
      }

      setSpecialist(data);

      setFormData({
        name: data.name || '',
        specialtyUA: data.specialty_ua || '',
        specialtyEN: data.specialty_en || '',
        experienceYears: data.experience_years ?? '',
        descriptionUA: data.description_ua || '',
        descriptionEN: data.description_en || '',
        directionsUA: data.directions_ua || '',
        directionsEN: data.directions_en || '',
        educationUA: data.education_ua || '',
        educationEN: data.education_en || '',
        certificates: data.certificates || '',
        photoUrl: data.photo_url || '',
      });

      setPhotoPreview(data.photo_url || '');
      setPhotoFile(null);
    } catch (error) {
      console.error('Specialist profile loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити профіль: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load profile: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'UA' ? 'Оберіть зображення' : 'Select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        lang === 'UA'
          ? 'Фото не має перевищувати 5 МБ'
          : 'Photo must be less than 5 MB'
      );
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photoFile || !specialist?.id) {
      return formData.photoUrl || null;
    }

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${specialist.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('specialist-photos')
      .upload(filePath, photoFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('specialist-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!specialist?.id) return;

    if (!formData.name.trim()) {
      alert(lang === 'UA' ? 'Введіть ПІБ' : 'Enter full name');
      return;
    }

    try {
      setSaving(true);

      const photoUrl = await uploadPhoto();

      const payload = {
        name: formData.name.trim(),
        specialty_ua: formData.specialtyUA.trim() || null,
        specialty_en: formData.specialtyEN.trim() || null,
        experience_years: formData.experienceYears
          ? Number(formData.experienceYears)
          : 0,
        description_ua: formData.descriptionUA.trim() || null,
        description_en: formData.descriptionEN.trim() || null,
        directions_ua: formData.directionsUA.trim() || null,
        directions_en: formData.directionsEN.trim() || null,
        education_ua: formData.educationUA.trim() || null,
        education_en: formData.educationEN.trim() || null,
        certificates: formData.certificates.trim() || null,
        photo_url: photoUrl,
      };

      const { data, error } = await supabase
        .from('specialists')
        .update(payload)
        .eq('id', specialist.id)
        .select('*')
        .single();

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({
          full_name: formData.name.trim(),
        })
        .eq('id', user.id);

      await createAuditLog({
        user,
        action: 'update_own_specialist_profile',
        entity: 'specialist',
        tableName: 'specialists',
        recordId: specialist.id,
        description: `Лікар оновив свій профіль: ${formData.name.trim()}`,
        metadata: {
          photoUpdated: Boolean(photoFile),
        },
      });

      setSpecialist(data);
      setPhotoFile(null);
      setPhotoPreview(data.photo_url || '');

      alert(lang === 'UA' ? 'Профіль збережено' : 'Profile saved');
    } catch (error) {
      console.error('Specialist profile save failed:', error);

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
      <div className="specialist-profile-page">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мій профіль' : 'My profile'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="specialist-profile-page">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мій профіль' : 'My profile'}
        </h1>

        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Ваш акаунт ще не прив’язаний до спеціаліста. Зверніться до адміністратора.'
              : 'Your account is not linked to a specialist yet. Contact the administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialist-profile-page">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мій профіль' : 'My profile'}
        </h1>

        <button type="button" className="btn-outline" onClick={loadProfile}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <form className="specialist-profile-card" onSubmit={handleSave}>
        <div className="doctor-photo-editor">
          <div className="doctor-photo-preview">
            {photoPreview ? (
              <img src={photoPreview} alt={formData.name || 'Specialist'} />
            ) : (
              <span>{String(formData.name || '?').slice(0, 1)}</span>
            )}
          </div>

          <div>
            <label className="btn-outline photo-upload-btn">
              <FaUpload /> {lang === 'UA' ? 'Завантажити фото' : 'Upload photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>

            <p className="hint">
              {lang === 'UA'
                ? 'Фото буде показуватись на сторінці спеціалістів.'
                : 'The photo will be shown on the specialists page.'}
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>{lang === 'UA' ? 'ПІБ' : 'Full name'}</label>

          <input
            type="text"
            value={formData.name}
            onChange={(event) => handleInputChange('name', event.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>{lang === 'UA' ? 'Спеціальність UA' : 'Specialty UA'}</label>

            <input
              type="text"
              value={formData.specialtyUA}
              onChange={(event) =>
                handleInputChange('specialtyUA', event.target.value)
              }
            />
          </div>

          <div className="form-group half">
            <label>Specialty EN</label>

            <input
              type="text"
              value={formData.specialtyEN}
              onChange={(event) =>
                handleInputChange('specialtyEN', event.target.value)
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>{lang === 'UA' ? 'Досвід, років' : 'Experience, years'}</label>

          <input
            type="number"
            min="0"
            value={formData.experienceYears}
            onChange={(event) =>
              handleInputChange('experienceYears', event.target.value)
            }
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>{lang === 'UA' ? 'Опис UA' : 'Description UA'}</label>

            <textarea
              rows="4"
              value={formData.descriptionUA}
              onChange={(event) =>
                handleInputChange('descriptionUA', event.target.value)
              }
            />
          </div>

          <div className="form-group half">
            <label>Description EN</label>

            <textarea
              rows="4"
              value={formData.descriptionEN}
              onChange={(event) =>
                handleInputChange('descriptionEN', event.target.value)
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>{lang === 'UA' ? 'Напрямки UA' : 'Directions UA'}</label>

            <textarea
              rows="3"
              value={formData.directionsUA}
              onChange={(event) =>
                handleInputChange('directionsUA', event.target.value)
              }
            />
          </div>

          <div className="form-group half">
            <label>Directions EN</label>

            <textarea
              rows="3"
              value={formData.directionsEN}
              onChange={(event) =>
                handleInputChange('directionsEN', event.target.value)
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>{lang === 'UA' ? 'Освіта UA' : 'Education UA'}</label>

            <textarea
              rows="3"
              value={formData.educationUA}
              onChange={(event) =>
                handleInputChange('educationUA', event.target.value)
              }
            />
          </div>

          <div className="form-group half">
            <label>Education EN</label>

            <textarea
              rows="3"
              value={formData.educationEN}
              onChange={(event) =>
                handleInputChange('educationEN', event.target.value)
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>{lang === 'UA' ? 'Сертифікати' : 'Certificates'}</label>

          <textarea
            rows="3"
            value={formData.certificates}
            onChange={(event) =>
              handleInputChange('certificates', event.target.value)
            }
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? lang === 'UA'
                ? 'Збереження...'
                : 'Saving...'
              : lang === 'UA'
                ? 'Зберегти профіль'
                : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecialistProfile;