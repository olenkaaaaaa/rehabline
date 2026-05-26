import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../../styles/pages/admin-locations.css';

const emptyForm = {
  id: null,
  nameUA: '',
  nameEN: '',
  addressUA: '',
  addressEN: '',
  phone: '',
  email: '',
  hoursUA: '',
  hoursEN: '',
  lat: '',
  lng: '',
  isActive: true,
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';
};

const getLocationAddress = (location, lang) => {
  return lang === 'UA'
    ? location?.address_ua || location?.address || ''
    : location?.address_en || location?.address_ua || location?.address || '';
};

const Locations = () => {
  const { lang } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadLocations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      setLocations(data || []);
    } catch (error) {
      console.error('Admin locations loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити локації: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load locations: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return locations;

    return locations.filter((location) => {
      const searchText = [
        location.name_ua,
        location.name_en,
        location.name,
        location.address_ua,
        location.address_en,
        location.address,
        location.phone,
        location.email,
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedSearch);
    });
  }, [locations, searchTerm]);

  const resetForm = () => {
    setEditingLocation(null);
    setFormData(emptyForm);
  };

  const handleCreate = () => {
    setEditingLocation('new');
    setFormData(emptyForm);
  };

  const handleEdit = (location) => {
    setEditingLocation(location.id);

    setFormData({
      id: location.id,
      nameUA: location.name_ua || location.name?.UA || location.name || '',
      nameEN: location.name_en || location.name?.EN || '',
      addressUA: location.address_ua || location.address || '',
      addressEN: location.address_en || '',
      phone: location.phone || '',
      email: location.email || '',
      hoursUA: location.hours_ua || location.hours?.UA || '',
      hoursEN: location.hours_en || location.hours?.EN || '',
      lat: location.lat ?? location.latitude ?? location.coordinates?.lat ?? '',
      lng: location.lng ?? location.longitude ?? location.coordinates?.lng ?? '',
      isActive: location.is_active ?? true,
    });
  };

  const handleDelete = async (location) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Видалити локацію? Зв’язки з послугами та спеціалістами також буде видалено.'
        : 'Delete location? Links with services and specialists will also be removed.'
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await supabase
        .from('service_locations')
        .delete()
        .eq('location_id', location.id);

      await supabase
        .from('specialist_locations')
        .delete()
        .eq('location_id', location.id);

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', location.id);

      if (error) throw error;

      await loadLocations();
    } catch (error) {
      console.error('Delete location failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося видалити локацію: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to delete location: ${error.message || 'Please try again'}`
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

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.nameUA.trim()) {
      alert(lang === 'UA' ? 'Введіть назву локації UA' : 'Enter location name UA');
      return;
    }

    if (!formData.addressUA.trim()) {
      alert(lang === 'UA' ? 'Введіть адресу' : 'Enter address');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name_ua: formData.nameUA.trim(),
        name_en: formData.nameEN.trim() || formData.nameUA.trim(),
        address_ua: formData.addressUA.trim(),
        address_en: formData.addressEN.trim() || formData.addressUA.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        hours_ua: formData.hoursUA.trim() || null,
        hours_en: formData.hoursEN.trim() || null,
        lat: formData.lat === '' ? null : Number(formData.lat),
        lng: formData.lng === '' ? null : Number(formData.lng),
        is_active: Boolean(formData.isActive),
      };

      if (editingLocation === 'new') {
        const { error } = await supabase
          .from('locations')
          .insert(payload);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('locations')
          .update(payload)
          .eq('id', formData.id);

        if (error) throw error;
      }

      await loadLocations();
      resetForm();

      alert(lang === 'UA' ? 'Локацію збережено' : 'Location saved');
    } catch (error) {
      console.error('Save location failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти локацію: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save location: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-locations">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Локації' : 'Locations'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-locations">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Локації' : 'Locations'}
        </h1>

        <button className="btn-primary" onClick={handleCreate}>
          <FaPlus /> {lang === 'UA' ? 'Додати локацію' : 'Add location'}
        </button>
      </div>

      <div className="records-actions registrar-filters">
        <input
          type="text"
          value={searchTerm}
          placeholder={
            lang === 'UA'
              ? 'Пошук за назвою, адресою, телефоном...'
              : 'Search by name, address, phone...'
          }
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="button" className="btn-outline" onClick={loadLocations}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="locations-list">
        {filteredLocations.length > 0 ? (
          <table className="locations-table appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Назва' : 'Name'}</th>
                <th>{lang === 'UA' ? 'Адреса' : 'Address'}</th>
                <th>{lang === 'UA' ? 'Контакти' : 'Contacts'}</th>
                <th>{lang === 'UA' ? 'Години' : 'Hours'}</th>
                <th>{lang === 'UA' ? 'Координати' : 'Coordinates'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredLocations.map((location) => (
                <tr key={location.id}>
                  <td>
                    <strong>{getLocationName(location, lang)}</strong>
                    <div className="table-subtext">ID: {location.id}</div>
                  </td>

                  <td>{getLocationAddress(location, lang) || '—'}</td>

                  <td>
                    {location.phone || '—'}
                    {location.email && (
                      <div className="table-subtext">{location.email}</div>
                    )}
                  </td>

                  <td>
                    {lang === 'UA'
                      ? location.hours_ua || '—'
                      : location.hours_en || location.hours_ua || '—'}
                  </td>

                  <td>
                    {location.lat && location.lng
                      ? `${location.lat}, ${location.lng}`
                      : '—'}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        location.is_active !== false
                          ? 'status-confirmed'
                          : 'status-cancelled'
                      }`}
                    >
                      {location.is_active !== false
                        ? lang === 'UA'
                          ? 'Активна'
                          : 'Active'
                        : lang === 'UA'
                          ? 'Неактивна'
                          : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-btn"
                        onClick={() => handleEdit(location)}
                        title={lang === 'UA' ? 'Редагувати' : 'Edit'}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(location)}
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
            <p>{lang === 'UA' ? 'Локацій не знайдено' : 'No locations found'}</p>
          </div>
        )}
      </div>

      {(editingLocation === 'new' || editingLocation) && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingLocation === 'new'
                ? lang === 'UA'
                  ? 'Нова локація'
                  : 'New location'
                : lang === 'UA'
                  ? 'Редагувати локацію'
                  : 'Edit location'}
            </h2>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Назва UA' : 'Name UA'}</label>

                  <input
                    type="text"
                    value={formData.nameUA}
                    onChange={(e) => handleInputChange('nameUA', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half">
                  <label>Name EN</label>

                  <input
                    type="text"
                    value={formData.nameEN}
                    onChange={(e) => handleInputChange('nameEN', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Адреса UA' : 'Address UA'}</label>

                  <input
                    type="text"
                    value={formData.addressUA}
                    onChange={(e) => handleInputChange('addressUA', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half">
                  <label>Address EN</label>

                  <input
                    type="text"
                    value={formData.addressEN}
                    onChange={(e) => handleInputChange('addressEN', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Телефон' : 'Phone'}</label>

                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group half">
                  <label>Email</label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Години роботи UA' : 'Hours UA'}</label>

                  <input
                    type="text"
                    value={formData.hoursUA}
                    onChange={(e) => handleInputChange('hoursUA', e.target.value)}
                    placeholder="Пн-Пт 08:00-20:00"
                  />
                </div>

                <div className="form-group half">
                  <label>Hours EN</label>

                  <input
                    type="text"
                    value={formData.hoursEN}
                    onChange={(e) => handleInputChange('hoursEN', e.target.value)}
                    placeholder="Mon-Fri 08:00-20:00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Latitude</label>

                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => handleInputChange('lat', e.target.value)}
                  />
                </div>

                <div className="form-group half">
                  <label>Longitude</label>

                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => handleInputChange('lng', e.target.value)}
                  />
                </div>
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
                  {lang === 'UA' ? 'Активна локація' : 'Active location'}
                </label>
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

export default Locations;