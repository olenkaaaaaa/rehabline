import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../../styles/pages/admin-specialists.css';

const emptyForm = {
  id: null,
  userId: '',
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
  isActive: true,
  serviceIds: [],
  locationIds: [],
  
};

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';
};

const safeText = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.UA) return item.UA;
        if (item?.EN) return item.EN;
        return '';
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return Object.values(value).filter(Boolean).join(', ');
  }

  return String(value);
};

const safeTrimOrNull = (value) => {
  const text = safeText(value).trim();
  return text || null;
};

const Specialists = () => {
  const { lang } = useLanguage();

  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [specialistServices, setSpecialistServices] = useState([]);
  const [specialistLocations, setSpecialistLocations] = useState([]);

  const [editingSpecialist, setEditingSpecialist] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        specialistsResponse,
        servicesResponse,
        locationsResponse,
        profilesResponse,
        specialistServicesResponse,
        specialistLocationsResponse,
      ] = await Promise.all([
        supabase
          .from('specialists')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('services')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('locations')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true }),

        supabase
          .from('specialist_services')
          .select('*'),

        supabase
          .from('specialist_locations')
          .select('*'),
      ]);

      if (specialistsResponse.error) throw specialistsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;
      if (specialistServicesResponse.error) throw specialistServicesResponse.error;
      if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;

      setSpecialists(specialistsResponse.data || []);
      setServices(servicesResponse.data || []);
      setLocations(locationsResponse.data || []);
      setProfiles(profilesResponse.data || []);
      setSpecialistServices(specialistServicesResponse.data || []);
      setSpecialistLocations(specialistLocationsResponse.data || []);
    } catch (error) {
      console.error('Admin specialists loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити спеціалістів: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load specialists: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const usersForLinking = useMemo(() => {
    return profiles.filter((profile) => {
      return profile.role === 'client' || profile.role === 'specialist';
    });
  }, [profiles]);

  const enrichedSpecialists = useMemo(() => {
    return specialists.map((specialist) => {
      const linkedProfile = profiles.find(
        (profile) => profile.id === specialist.user_id
      );

      const linkedServiceIds = specialistServices
        .filter((row) => row.specialist_id === specialist.id)
        .map((row) => row.service_id);

      const linkedLocationIds = specialistLocations
        .filter((row) => row.specialist_id === specialist.id)
        .map((row) => row.location_id);

      const linkedServices = services.filter((service) =>
        linkedServiceIds.includes(service.id)
      );

      const linkedLocations = locations.filter((location) =>
        linkedLocationIds.includes(location.id)
      );

      return {
        ...specialist,
        linkedProfile,
        linkedServiceIds,
        linkedLocationIds,
        linkedServices,
        linkedLocations,
      };
    });
  }, [
    specialists,
    profiles,
    specialistServices,
    specialistLocations,
    services,
    locations,
  ]);

  const filteredSpecialists = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return enrichedSpecialists;

    return enrichedSpecialists.filter((specialist) => {
      const searchText = [
        specialist.name,
        specialist.specialty_ua,
        specialist.specialty_en,
        specialist.linkedProfile?.full_name,
        specialist.linkedProfile?.email,
        specialist.linkedServices
          .map((service) => getServiceName(service, lang))
          .join(' '),
        specialist.linkedLocations
          .map((location) => getLocationName(location, lang))
          .join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedSearch);
    });
  }, [enrichedSpecialists, searchTerm, lang]);

  const resetForm = () => {
    setEditingSpecialist(null);
    setFormData(emptyForm);
  };

  const handleCreate = () => {
    setEditingSpecialist('new');
    setFormData(emptyForm);
  };

  const handleEdit = (specialist) => {
    setEditingSpecialist(specialist.id);

    setFormData({
      id: specialist.id,
      userId: specialist.user_id || '',
      name: safeText(specialist.name),
      specialtyUA: safeText(specialist.specialty_ua || specialist.specialty?.UA),
      specialtyEN: safeText(specialist.specialty_en || specialist.specialty?.EN),
      experienceYears: specialist.experience_years ?? specialist.experience ?? '',
      descriptionUA: safeText(
        specialist.description_ua || specialist.description?.UA
      ),
      descriptionEN: safeText(
        specialist.description_en || specialist.description?.EN
      ),
      directionsUA: safeText(specialist.directions_ua),
      directionsEN: safeText(specialist.directions_en),
      educationUA: safeText(specialist.education_ua),
      educationEN: safeText(specialist.education_en),
      certificates: safeText(specialist.certificates),
      photoUrl: safeText(specialist.photo_url),
      isActive: specialist.is_active ?? true,
      serviceIds: specialist.linkedServiceIds || [],
      locationIds: specialist.linkedLocationIds || [],
    });
  };

  const handleDelete = async (specialist) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Видалити спеціаліста? Його зв’язки з послугами та локаціями також буде видалено.'
        : 'Delete specialist? Links with services and locations will also be removed.'
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const { error: servicesDeleteError } = await supabase
        .from('specialist_services')
        .delete()
        .eq('specialist_id', specialist.id);

      if (servicesDeleteError) throw servicesDeleteError;

      const { error: locationsDeleteError } = await supabase
        .from('specialist_locations')
        .delete()
        .eq('specialist_id', specialist.id);

      if (locationsDeleteError) throw locationsDeleteError;

      const { error } = await supabase
        .from('specialists')
        .delete()
        .eq('id', specialist.id);

      if (error) throw error;

      if (specialist.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'client',
          })
          .eq('id', specialist.user_id);

        if (profileError) {
          console.warn('Profile role reset failed:', profileError);
        }
      }

      await loadData();
    } catch (error) {
      console.error('Delete specialist failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося видалити спеціаліста: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to delete specialist: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxListChange = (field, id, checked) => {
    setFormData((prev) => {
      const currentValues = prev[field] || [];

      return {
        ...prev,
        [field]: checked
          ? [...currentValues, id]
          : currentValues.filter((item) => item !== id),
      };
    });
  };

  const syncSpecialistServices = async (specialistId, serviceIds) => {
    const { error: deleteError } = await supabase
      .from('specialist_services')
      .delete()
      .eq('specialist_id', specialistId);

    if (deleteError) throw deleteError;

    if (serviceIds.length > 0) {
      const rows = serviceIds.map((serviceId) => ({
        specialist_id: specialistId,
        service_id: serviceId,
      }));

      const { error: insertError } = await supabase
        .from('specialist_services')
        .insert(rows);

      if (insertError) throw insertError;
    }
  };

  const syncSpecialistLocations = async (specialistId, locationIds) => {
    const { error: deleteError } = await supabase
      .from('specialist_locations')
      .delete()
      .eq('specialist_id', specialistId);

    if (deleteError) throw deleteError;

    if (locationIds.length > 0) {
      const rows = locationIds.map((locationId) => ({
        specialist_id: specialistId,
        location_id: locationId,
      }));

      const { error: insertError } = await supabase
        .from('specialist_locations')
        .insert(rows);

      if (insertError) throw insertError;
    }
  };


  const ensureScheduleForSpecialist = async (specialistId) => {
    const { data: existingSchedule, error: scheduleLoadError } = await supabase
      .from('specialist_schedules')
      .select('*')
      .eq('specialist_id', specialistId);

    if (scheduleLoadError) {
      console.warn('Schedule check failed:', scheduleLoadError);
      return;
    }

    if (existingSchedule?.length > 0) return;

    const rows = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      specialist_id: specialistId,
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_working: true,
    }));

    const { error: insertError } = await supabase
      .from('specialist_schedules')
      .insert(rows);

    if (insertError) {
      console.warn('Default schedule insert failed:', insertError);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!safeTrimOrNull(formData.name)) {
      alert(lang === 'UA' ? 'Введіть ПІБ спеціаліста' : 'Enter specialist name');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        user_id: formData.userId || null,
        name: safeTrimOrNull(formData.name) || '',
        specialty_ua: safeTrimOrNull(formData.specialtyUA),
        specialty_en: safeTrimOrNull(formData.specialtyEN),
        experience_years: formData.experienceYears
          ? Number(formData.experienceYears)
          : 0,
        description_ua: safeTrimOrNull(formData.descriptionUA),
        description_en: safeTrimOrNull(formData.descriptionEN),
        directions_ua: safeTrimOrNull(formData.directionsUA),
        directions_en: safeTrimOrNull(formData.directionsEN),
        education_ua: safeTrimOrNull(formData.educationUA),
        education_en: safeTrimOrNull(formData.educationEN),
        certificates: safeTrimOrNull(formData.certificates),
        photo_url: safeTrimOrNull(formData.photoUrl),
        is_active: Boolean(formData.isActive),
      };

      let savedSpecialist;

      if (editingSpecialist === 'new') {
        const { data, error } = await supabase
          .from('specialists')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;

        savedSpecialist = data;
      } else {
        const { data, error } = await supabase
          .from('specialists')
          .update(payload)
          .eq('id', formData.id)
          .select('*')
          .single();

        if (error) throw error;

        savedSpecialist = data;
      }

      await syncSpecialistServices(savedSpecialist.id, formData.serviceIds);
      await syncSpecialistLocations(savedSpecialist.id, formData.locationIds);
      await ensureScheduleForSpecialist(savedSpecialist.id);

      if (formData.userId) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            role: 'specialist',
            full_name: safeTrimOrNull(formData.name) || 'Спеціаліст',
          })
          .eq('id', formData.userId);

        if (profileUpdateError) throw profileUpdateError;
      }

      await loadData();
      resetForm();

      alert(lang === 'UA' ? 'Спеціаліста збережено' : 'Specialist saved');
    } catch (error) {
      console.error('Save specialist failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти спеціаліста: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save specialist: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-specialists">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Спеціалісти' : 'Specialists'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-specialists">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Спеціалісти' : 'Specialists'}
        </h1>

        <button className="btn-primary" onClick={handleCreate}>
          <FaPlus /> {lang === 'UA' ? 'Додати спеціаліста' : 'Add specialist'}
        </button>
      </div>

      <div className="records-actions registrar-filters">
        <input
          type="text"
          value={searchTerm}
          placeholder={
            lang === 'UA'
              ? 'Пошук за ПІБ, email, спеціальністю, послугою...'
              : 'Search by name, email, specialty, service...'
          }
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="specialists-list">
        {filteredSpecialists.length > 0 ? (
          <table className="specialists-table appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'ПІБ' : 'Name'}</th>
                <th>{lang === 'UA' ? 'Акаунт' : 'Account'}</th>
                <th>{lang === 'UA' ? 'Спеціальність' : 'Specialty'}</th>
                <th>{lang === 'UA' ? 'Послуги' : 'Services'}</th>
                <th>{lang === 'UA' ? 'Локації' : 'Locations'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredSpecialists.map((specialist) => (
                <tr key={specialist.id}>
                  <td>
                    <strong>{specialist.name}</strong>
                    <div className="table-subtext">ID: {specialist.id}</div>
                  </td>

                  <td>
                    {specialist.linkedProfile ? (
                      <>
                        {specialist.linkedProfile.full_name || '—'}
                        <div className="table-subtext">
                          {specialist.linkedProfile.email || specialist.user_id}
                        </div>
                      </>
                    ) : (
                      <span className="text-warning">
                        {lang === 'UA' ? 'Не прив’язано' : 'Not linked'}
                      </span>
                    )}
                  </td>

                  <td>
                    {lang === 'UA'
                      ? specialist.specialty_ua || '—'
                      : specialist.specialty_en || specialist.specialty_ua || '—'}
                    <div className="table-subtext">
                      {specialist.experience_years || 0}{' '}
                      {lang === 'UA' ? 'років' : 'years'}
                    </div>
                  </td>

                  <td>
                    {specialist.linkedServices.length > 0
                      ? specialist.linkedServices
                          .map((service) => getServiceName(service, lang))
                          .join(', ')
                      : '—'}
                  </td>

                  <td>
                    {specialist.linkedLocations.length > 0
                      ? specialist.linkedLocations
                          .map((location) => getLocationName(location, lang))
                          .join(', ')
                      : '—'}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        specialist.is_active ? 'status-confirmed' : 'status-cancelled'
                      }`}
                    >
                      {specialist.is_active
                        ? lang === 'UA'
                          ? 'Активний'
                          : 'Active'
                        : lang === 'UA'
                          ? 'Неактивний'
                          : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-btn"
                        onClick={() => handleEdit(specialist)}
                        title={lang === 'UA' ? 'Редагувати' : 'Edit'}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(specialist)}
                        title={lang === 'UA' ? 'Видалити' : 'Delete'}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Спеціалістів не знайдено'
                : 'No specialists found'}
            </p>
          </div>
        )}
      </div>

      {(editingSpecialist === 'new' || editingSpecialist) && (
        <div className="modal-overlay" onClick={resetForm}>
          <div
            className="modal-content modal-large"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>
              {editingSpecialist === 'new'
                ? lang === 'UA'
                  ? 'Новий спеціаліст'
                  : 'New specialist'
                : lang === 'UA'
                  ? 'Редагувати спеціаліста'
                  : 'Edit specialist'}
            </h2>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{lang === 'UA' ? 'Прив’язати акаунт' : 'Link account'}</label>

                <select
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                >
                  <option value="">
                    {lang === 'UA' ? 'Не прив’язувати' : 'Do not link'}
                  </option>

                  {usersForLinking.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email || profile.id}
                      {profile.email ? ` · ${profile.email}` : ''}
                      {profile.role ? ` · ${profile.role}` : ''}
                    </option>
                  ))}
                </select>

                <p className="hint">
                  {lang === 'UA'
                    ? 'Після збереження вибраний акаунт автоматично отримає роль specialist.'
                    : 'After saving, selected account will automatically receive specialist role.'}
                </p>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'ПІБ' : 'Full name'}</label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>
                    {lang === 'UA' ? 'Спеціальність UA' : 'Specialty UA'}
                  </label>

                  <input
                    type="text"
                    value={formData.specialtyUA}
                    onChange={(e) => handleInputChange('specialtyUA', e.target.value)}
                  />
                </div>

                <div className="form-group half">
                  <label>Specialty EN</label>

                  <input
                    type="text"
                    value={formData.specialtyEN}
                    onChange={(e) => handleInputChange('specialtyEN', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  {lang === 'UA' ? 'Досвід, років' : 'Experience, years'}
                </label>

                <input
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    handleInputChange('experienceYears', e.target.value)
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Опис UA' : 'Description UA'}</label>

                  <textarea
                    rows="3"
                    value={formData.descriptionUA}
                    onChange={(e) =>
                      handleInputChange('descriptionUA', e.target.value)
                    }
                  />
                </div>

                <div className="form-group half">
                  <label>Description EN</label>

                  <textarea
                    rows="3"
                    value={formData.descriptionEN}
                    onChange={(e) =>
                      handleInputChange('descriptionEN', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Напрямки UA' : 'Directions UA'}</label>

                  <textarea
                    rows="2"
                    value={formData.directionsUA}
                    onChange={(e) =>
                      handleInputChange('directionsUA', e.target.value)
                    }
                  />
                </div>

                <div className="form-group half">
                  <label>Directions EN</label>

                  <textarea
                    rows="2"
                    value={formData.directionsEN}
                    onChange={(e) =>
                      handleInputChange('directionsEN', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Освіта UA' : 'Education UA'}</label>

                  <textarea
                    rows="2"
                    value={formData.educationUA}
                    onChange={(e) =>
                      handleInputChange('educationUA', e.target.value)
                    }
                  />
                </div>

                <div className="form-group half">
                  <label>Education EN</label>

                  <textarea
                    rows="2"
                    value={formData.educationEN}
                    onChange={(e) =>
                      handleInputChange('educationEN', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === 'UA' ? 'Сертифікати' : 'Certificates'}</label>

                <textarea
                  rows="2"
                  value={formData.certificates}
                  onChange={(e) =>
                    handleInputChange('certificates', e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Photo URL</label>

                <input
                  type="text"
                  value={formData.photoUrl}
                  onChange={(e) => handleInputChange('photoUrl', e.target.value)}
                />
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange('isActive', e.target.checked)
                    }
                  />
                  {lang === 'UA' ? 'Активний спеціаліст' : 'Active specialist'}
                </label>
              </div>

              <div className="admin-checkbox-list">
                <h3>{lang === 'UA' ? 'Послуги лікаря' : 'Specialist services'}</h3>

                {services.map((service) => (
                  <label key={service.id}>
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={(e) =>
                        handleCheckboxListChange(
                          'serviceIds',
                          service.id,
                          e.target.checked
                        )
                      }
                    />
                    {getServiceName(service, lang)}
                  </label>
                ))}
              </div>

              <div className="admin-checkbox-list">
                <h3>{lang === 'UA' ? 'Локації лікаря' : 'Specialist locations'}</h3>

                {locations.map((location) => (
                  <label key={location.id}>
                    <input
                      type="checkbox"
                      checked={formData.locationIds.includes(location.id)}
                      onChange={(e) =>
                        handleCheckboxListChange(
                          'locationIds',
                          location.id,
                          e.target.checked
                        )
                      }
                    />
                    {getLocationName(location, lang)}
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  {lang === 'UA' ? 'Скасувати' : 'Cancel'}
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? lang === 'UA'
                      ? 'Збереження...'
                      : 'Saving...'
                    : lang === 'UA'
                      ? 'Зберегти'
                      : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Specialists;