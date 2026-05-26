import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../../styles/pages/admin-services.css';

const emptyForm = {
  id: null,
  nameUA: '',
  nameEN: '',
  durationMinutes: '',
  price: '',
  categoryUA: '',
  categoryEN: '',
  descriptionUA: '',
  descriptionEN: '',
  indicationsUA: '',
  indicationsEN: '',
  tagUA: '',
  tagEN: '',
  isActive: true,
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

const splitTextToArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const arrayToText = (value) => {
  if (!value) return '';

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
};

const Services = () => {
  const { lang } = useLanguage();

  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);

  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        servicesResponse,
        locationsResponse,
        serviceLocationsResponse,
      ] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('locations')
          .select('*')
          .order('id', { ascending: true }),

        supabase
          .from('service_locations')
          .select('*'),
      ]);

      if (servicesResponse.error) throw servicesResponse.error;
      if (locationsResponse.error) throw locationsResponse.error;
      if (serviceLocationsResponse.error) throw serviceLocationsResponse.error;

      setServices(servicesResponse.data || []);
      setLocations(locationsResponse.data || []);
      setServiceLocations(serviceLocationsResponse.data || []);
    } catch (error) {
      console.error('Admin services loading failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити послуги: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to load services: ${error.message || 'Please try again'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enrichedServices = useMemo(() => {
    return services.map((service) => {
      const linkedLocationIds = serviceLocations
        .filter((row) => row.service_id === service.id)
        .map((row) => row.location_id);

      const linkedLocations = locations.filter((location) =>
        linkedLocationIds.includes(location.id)
      );

      return {
        ...service,
        linkedLocationIds,
        linkedLocations,
      };
    });
  }, [services, serviceLocations, locations]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return enrichedServices;

    return enrichedServices.filter((service) => {
      const searchText = [
        service.name_ua,
        service.name_en,
        service.category_ua,
        service.category_en,
        service.description_ua,
        service.description_en,
        arrayToText(service.indications_ua),
        arrayToText(service.indications_en),
        service.tag_ua,
        service.tag_en,
        service.linkedLocations
          .map((location) => getLocationName(location, lang))
          .join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedSearch);
    });
  }, [enrichedServices, searchTerm, lang]);

  const resetForm = () => {
    setEditingService(null);
    setFormData(emptyForm);
  };

  const handleCreate = () => {
    setEditingService('new');
    setFormData(emptyForm);
  };

  const handleEdit = (service) => {
    setEditingService(service.id);

    setFormData({
      id: service.id,
      nameUA: service.name_ua || service.name?.UA || '',
      nameEN: service.name_en || service.name?.EN || '',
      durationMinutes:
        service.duration_minutes ||
        String(service.duration || '').replace(/\D/g, '') ||
        '',
      price: service.price ?? '',
      categoryUA: service.category_ua || service.category?.UA || '',
      categoryEN: service.category_en || service.category?.EN || '',
      descriptionUA: service.description_ua || service.description?.UA || '',
      descriptionEN: service.description_en || service.description?.EN || '',
      indicationsUA: arrayToText(service.indications_ua),
      indicationsEN: arrayToText(service.indications_en),
      tagUA: service.tag_ua || '',
      tagEN: service.tag_en || '',
      isActive: service.is_active ?? true,
      locationIds: service.linkedLocationIds || [],
    });
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      lang === 'UA'
        ? 'Видалити послугу? Зв’язки з локаціями також буде видалено.'
        : 'Delete service? Location links will also be removed.'
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const { error: serviceLocationsDeleteError } = await supabase
        .from('service_locations')
        .delete()
        .eq('service_id', service.id);

      if (serviceLocationsDeleteError) throw serviceLocationsDeleteError;

      const { error: specialistServicesDeleteError } = await supabase
        .from('specialist_services')
        .delete()
        .eq('service_id', service.id);

      if (specialistServicesDeleteError) throw specialistServicesDeleteError;

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Delete service failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося видалити послугу: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to delete service: ${error.message || 'Please try again'}`
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

  const handleLocationChange = (locationId, checked) => {
    setFormData((prev) => {
      const currentValues = prev.locationIds || [];

      return {
        ...prev,
        locationIds: checked
          ? [...currentValues, locationId]
          : currentValues.filter((id) => id !== locationId),
      };
    });
  };

  const syncServiceLocations = async (serviceId, locationIds) => {
    const { error: deleteError } = await supabase
      .from('service_locations')
      .delete()
      .eq('service_id', serviceId);

    if (deleteError) throw deleteError;

    if (locationIds.length > 0) {
      const rows = locationIds.map((locationId) => ({
        service_id: serviceId,
        location_id: locationId,
      }));

      const { error: insertError } = await supabase
        .from('service_locations')
        .insert(rows);

      if (insertError) throw insertError;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.nameUA.trim()) {
      alert(lang === 'UA' ? 'Введіть назву послуги UA' : 'Enter service name UA');
      return;
    }

    if (!formData.durationMinutes || Number(formData.durationMinutes) <= 0) {
      alert(
        lang === 'UA'
          ? 'Введіть тривалість у хвилинах'
          : 'Enter duration in minutes'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name_ua: formData.nameUA.trim(),
        name_en: formData.nameEN.trim() || formData.nameUA.trim(),
        duration_minutes: Number(formData.durationMinutes),
        price: Number(formData.price || 0),
        category_ua: formData.categoryUA.trim() || null,
        category_en: formData.categoryEN.trim() || null,
        description_ua: formData.descriptionUA.trim() || null,
        description_en: formData.descriptionEN.trim() || null,
        indications_ua: splitTextToArray(formData.indicationsUA),
        indications_en: splitTextToArray(formData.indicationsEN),
        tag_ua: formData.tagUA.trim() || null,
        tag_en: formData.tagEN.trim() || null,
        is_active: Boolean(formData.isActive),
      };

      let savedService;

      if (editingService === 'new') {
        const { data, error } = await supabase
          .from('services')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;

        savedService = data;
      } else {
        const { data, error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', formData.id)
          .select('*')
          .single();

        if (error) throw error;

        savedService = data;
      }

      await syncServiceLocations(savedService.id, formData.locationIds);

      await loadData();
      resetForm();

      alert(lang === 'UA' ? 'Послугу збережено' : 'Service saved');
    } catch (error) {
      console.error('Save service failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося зберегти послугу: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to save service: ${error.message || 'Please try again'}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-services">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Послуги' : 'Services'}
        </h1>

        <div className="empty-state">
          <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-services">
      <div className="section-header-row">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Послуги' : 'Services'}
        </h1>

        <button className="btn-primary" onClick={handleCreate}>
          <FaPlus /> {lang === 'UA' ? 'Додати послугу' : 'Add service'}
        </button>
      </div>

      <div className="records-actions registrar-filters">
        <input
          type="text"
          value={searchTerm}
          placeholder={
            lang === 'UA'
              ? 'Пошук за назвою, категорією, описом...'
              : 'Search by name, category, description...'
          }
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="button" className="btn-outline" onClick={loadData}>
          {lang === 'UA' ? 'Оновити' : 'Refresh'}
        </button>
      </div>

      <div className="services-list">
        {filteredServices.length > 0 ? (
          <table className="services-table appointments-table">
            <thead>
              <tr>
                <th>{lang === 'UA' ? 'Назва' : 'Name'}</th>
                <th>{lang === 'UA' ? 'Тривалість' : 'Duration'}</th>
                <th>{lang === 'UA' ? 'Ціна' : 'Price'}</th>
                <th>{lang === 'UA' ? 'Категорія' : 'Category'}</th>
                <th>{lang === 'UA' ? 'Локації' : 'Locations'}</th>
                <th>{lang === 'UA' ? 'Статус' : 'Status'}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong>{getServiceName(service, lang)}</strong>
                    <div className="table-subtext">ID: {service.id}</div>
                  </td>

                  <td>
                    {service.duration_minutes || 0}{' '}
                    {lang === 'UA' ? 'хв' : 'min'}
                  </td>

                  <td>{Number(service.price || 0)} грн</td>

                  <td>
                    {lang === 'UA'
                      ? service.category_ua || '—'
                      : service.category_en || service.category_ua || '—'}
                  </td>

                  <td>
                    {service.linkedLocations.length > 0
                      ? service.linkedLocations
                          .map((location) => getLocationName(location, lang))
                          .join(', ')
                      : '—'}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        service.is_active !== false
                          ? 'status-confirmed'
                          : 'status-cancelled'
                      }`}
                    >
                      {service.is_active !== false
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
                        onClick={() => handleEdit(service)}
                        title={lang === 'UA' ? 'Редагувати' : 'Edit'}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(service)}
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
            <p>{lang === 'UA' ? 'Послуг не знайдено' : 'No services found'}</p>
          </div>
        )}
      </div>

      {(editingService === 'new' || editingService) && (
        <div className="modal-overlay" onClick={resetForm}>
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {editingService === 'new'
                ? lang === 'UA'
                  ? 'Нова послуга'
                  : 'New service'
                : lang === 'UA'
                  ? 'Редагувати послугу'
                  : 'Edit service'}
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
                  <label>
                    {lang === 'UA' ? 'Тривалість, хв' : 'Duration, min'}
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      handleInputChange('durationMinutes', e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Ціна' : 'Price'}</label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Категорія UA' : 'Category UA'}</label>

                  <input
                    type="text"
                    value={formData.categoryUA}
                    onChange={(e) => handleInputChange('categoryUA', e.target.value)}
                  />
                </div>

                <div className="form-group half">
                  <label>Category EN</label>

                  <input
                    type="text"
                    value={formData.categoryEN}
                    onChange={(e) => handleInputChange('categoryEN', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Опис UA' : 'Description UA'}</label>

                  <textarea
                    value={formData.descriptionUA}
                    onChange={(e) =>
                      handleInputChange('descriptionUA', e.target.value)
                    }
                    rows="3"
                  />
                </div>

                <div className="form-group half">
                  <label>Description EN</label>

                  <textarea
                    value={formData.descriptionEN}
                    onChange={(e) =>
                      handleInputChange('descriptionEN', e.target.value)
                    }
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>
                    {lang === 'UA'
                      ? 'Показання UA, через кому'
                      : 'Indications UA, comma-separated'}
                  </label>

                  <textarea
                    value={formData.indicationsUA}
                    onChange={(e) =>
                      handleInputChange('indicationsUA', e.target.value)
                    }
                    rows="2"
                    placeholder={
                      lang === 'UA'
                        ? 'біль у спині, відновлення після травм'
                        : 'back pain, post-injury recovery'
                    }
                  />
                </div>

                <div className="form-group half">
                  <label>Indications EN, comma-separated</label>

                  <textarea
                    value={formData.indicationsEN}
                    onChange={(e) =>
                      handleInputChange('indicationsEN', e.target.value)
                    }
                    rows="2"
                    placeholder="back pain, recovery, mobility issues"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>{lang === 'UA' ? 'Тег UA' : 'Tag UA'}</label>

                  <input
                    type="text"
                    value={formData.tagUA}
                    onChange={(e) => handleInputChange('tagUA', e.target.value)}
                    placeholder={lang === 'UA' ? 'Популярне' : 'Popular'}
                  />
                </div>

                <div className="form-group half">
                  <label>Tag EN</label>

                  <input
                    type="text"
                    value={formData.tagEN}
                    onChange={(e) => handleInputChange('tagEN', e.target.value)}
                    placeholder="Popular"
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
                  {lang === 'UA' ? 'Активна послуга' : 'Active service'}
                </label>
              </div>

              <div className="admin-checkbox-list">
                <h3>{lang === 'UA' ? 'Локації послуги' : 'Service locations'}</h3>

                {locations.map((location) => (
                  <label key={location.id}>
                    <input
                      type="checkbox"
                      checked={formData.locationIds.includes(location.id)}
                      onChange={(e) =>
                        handleLocationChange(location.id, e.target.checked)
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

export default Services;