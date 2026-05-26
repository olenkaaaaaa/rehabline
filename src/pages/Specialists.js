import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import '../styles/pages/specialists.css';

const textToList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.UA) return item.UA;
        if (item?.EN) return item.EN;
        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.values(value)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .replace(/[{}"]/g, '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getSpecialty = (specialist, lang) => {
  if (!specialist) return '';

  if (lang === 'UA') {
    return (
      specialist.specialty_ua ||
      specialist.specialty?.UA ||
      specialist.specialty ||
      ''
    );
  }

  return (
    specialist.specialty_en ||
    specialist.specialty_ua ||
    specialist.specialty?.EN ||
    specialist.specialty?.UA ||
    specialist.specialty ||
    ''
  );
};

const getDescription = (specialist, lang) => {
  if (!specialist) return '';

  if (lang === 'UA') {
    return (
      specialist.description_ua ||
      specialist.description?.UA ||
      specialist.description ||
      ''
    );
  }

  return (
    specialist.description_en ||
    specialist.description_ua ||
    specialist.description?.EN ||
    specialist.description?.UA ||
    specialist.description ||
    ''
  );
};

const getDirections = (specialist, lang) => {
  if (!specialist) return [];

  const value =
    lang === 'UA'
      ? specialist.directions_ua ||
        specialist.directions?.UA ||
        specialist.directions
      : specialist.directions_en ||
        specialist.directions_ua ||
        specialist.directions?.EN ||
        specialist.directions?.UA ||
        specialist.directions;

  return textToList(value);
};

const getServiceName = (service, lang) => {
  if (!service) return '';

  if (lang === 'UA') {
    return (
      service.name_ua ||
      service.name?.UA ||
      service.name ||
      service.title_ua ||
      service.title ||
      ''
    );
  }

  return (
    service.name_en ||
    service.name_ua ||
    service.name?.EN ||
    service.name?.UA ||
    service.name ||
    service.title_en ||
    service.title_ua ||
    service.title ||
    ''
  );
};

const getLocationName = (location, lang) => {
  if (!location) return '';

  if (lang === 'UA') {
    return location.name_ua || location.name?.UA || location.name || '';
  }

  return (
    location.name_en ||
    location.name_ua ||
    location.name?.EN ||
    location.name?.UA ||
    location.name ||
    ''
  );
};

const getRoleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'registrar') return '/registrar';
  if (role === 'specialist') return '/specialist';
  return '/client';
};

const Specialists = () => {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [specialistServices, setSpecialistServices] = useState([]);
  const [specialistLocations, setSpecialistLocations] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadSpecialists = async () => {
    try {
      setLoading(true);
      setLoadError('');

      const specialistsResponse = await supabase
        .from('specialists')
        .select('*')
        .order('id', { ascending: true });

      if (specialistsResponse.error) throw specialistsResponse.error;

      const servicesResponse = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true });

      if (servicesResponse.error) throw servicesResponse.error;

      const locationsResponse = await supabase
        .from('locations')
        .select('*')
        .order('id', { ascending: true });

      if (locationsResponse.error) throw locationsResponse.error;

      const specialistServicesResponse = await supabase
        .from('specialist_services')
        .select('*');

      if (specialistServicesResponse.error) {
        console.warn(
          'specialist_services loading failed:',
          specialistServicesResponse.error
        );
      }

      const specialistLocationsResponse = await supabase
        .from('specialist_locations')
        .select('*');

      if (specialistLocationsResponse.error) {
        console.warn(
          'specialist_locations loading failed:',
          specialistLocationsResponse.error
        );
      }

      setSpecialists(specialistsResponse.data || []);
      setServices(servicesResponse.data || []);
      setLocations(locationsResponse.data || []);
      setSpecialistServices(specialistServicesResponse.data || []);
      setSpecialistLocations(specialistLocationsResponse.data || []);
    } catch (error) {
      console.error('Specialists loading failed:', error);

      setLoadError(
        error?.message ||
          (lang === 'UA'
            ? 'Не вдалося завантажити спеціалістів'
            : 'Failed to load specialists')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialists();
  }, []);

  const activeServices = useMemo(() => {
    return services.filter((service) => service.is_active !== false);
  }, [services]);

  const activeLocations = useMemo(() => {
    return locations.filter((location) => location.is_active !== false);
  }, [locations]);

  const enrichedSpecialists = useMemo(() => {
    return specialists
      .filter((specialist) => specialist.is_active !== false)
      .map((specialist) => {
        const linkedServiceIds = specialistServices
          .filter((item) => String(item.specialist_id) === String(specialist.id))
          .map((item) => String(item.service_id));

        const linkedLocationIds = specialistLocations
          .filter((item) => String(item.specialist_id) === String(specialist.id))
          .map((item) => String(item.location_id));

        const linkedServices = activeServices.filter((service) =>
          linkedServiceIds.includes(String(service.id))
        );

        const linkedLocations = activeLocations.filter((location) =>
          linkedLocationIds.includes(String(location.id))
        );

        return {
          ...specialist,
          displaySpecialty: getSpecialty(specialist, lang),
          displayDescription: getDescription(specialist, lang),
          directionsList: getDirections(specialist, lang),
          linkedServiceIds,
          linkedLocationIds,
          linkedServices,
          linkedLocations,
        };
      });
  }, [
    specialists,
    specialistServices,
    specialistLocations,
    activeServices,
    activeLocations,
    lang,
  ]);

  const filteredSpecialists = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let result = enrichedSpecialists.filter((specialist) => {
      const searchText = [
        specialist.name,
        specialist.displaySpecialty,
        specialist.displayDescription,
        specialist.directionsList.join(' '),
        specialist.linkedServices
          .map((service) => getServiceName(service, lang))
          .join(' '),
        specialist.linkedLocations
          .map((location) => getLocationName(location, lang))
          .join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch);

      const matchesService =
        !selectedServiceId ||
        specialist.linkedServiceIds.includes(String(selectedServiceId));

      const matchesLocation =
        !selectedLocationId ||
        specialist.linkedLocationIds.includes(String(selectedLocationId));

      return matchesSearch && matchesService && matchesLocation;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      );
    }

    if (sortBy === 'experience_desc') {
      result = [...result].sort(
        (a, b) =>
          Number(b.experience_years || b.experience || 0) -
          Number(a.experience_years || a.experience || 0)
      );
    }

    if (sortBy === 'experience_asc') {
      result = [...result].sort(
        (a, b) =>
          Number(a.experience_years || a.experience || 0) -
          Number(b.experience_years || b.experience || 0)
      );
    }

    return result;
  }, [
    enrichedSpecialists,
    searchTerm,
    selectedServiceId,
    selectedLocationId,
    sortBy,
    lang,
  ]);

  const handleBooking = (specialistId) => {
    const role = profile?.role || 'client';

    if (role !== 'client') {
      navigate(getRoleHome(role));
      return;
    }

    navigate(`/booking?specialist=${specialistId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedServiceId('');
    setSelectedLocationId('');
    setSortBy('name');
  };

  return (
    <div className="specialists-page">
      <section className="page-hero">
        <div className="container">
          <h1>{lang === 'UA' ? 'Спеціалісти' : 'Specialists'}</h1>

          <p>
            {lang === 'UA'
              ? 'Оберіть спеціаліста, перегляньте його послуги, досвід та доступні локації.'
              : 'Choose a specialist, view their services, experience and available locations.'}
          </p>
        </div>
      </section>

      <section className="specialists-section">
        <div className="container">
          <div className="specialists-filters">
            <div className="filter-group">
              <label>
                {lang === 'UA' ? 'Пошук спеціаліста' : 'Search specialist'}
              </label>

              <input
                type="text"
                value={searchTerm}
                placeholder={
                  lang === 'UA'
                    ? 'Наприклад: реабілітолог, масаж, Демченко...'
                    : 'For example: rehabilitation, massage, Demchenko...'
                }
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>{lang === 'UA' ? 'Послуга' : 'Service'}</label>

              <select
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
              >
                <option value="">
                  {lang === 'UA' ? 'Усі послуги' : 'All services'}
                </option>

                {activeServices.map((service) => (
                  <option key={service.id} value={String(service.id)}>
                    {getServiceName(service, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{lang === 'UA' ? 'Локація' : 'Location'}</label>

              <select
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
              >
                <option value="">
                  {lang === 'UA' ? 'Усі локації' : 'All locations'}
                </option>

                {activeLocations.map((location) => (
                  <option key={location.id} value={String(location.id)}>
                    {getLocationName(location, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{lang === 'UA' ? 'Сортування' : 'Sorting'}</label>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="name">
                  {lang === 'UA' ? 'За іменем' : 'By name'}
                </option>

                <option value="experience_desc">
                  {lang === 'UA'
                    ? 'Досвід: від більшого'
                    : 'Experience: high to low'}
                </option>

                <option value="experience_asc">
                  {lang === 'UA'
                    ? 'Досвід: від меншого'
                    : 'Experience: low to high'}
                </option>
              </select>
            </div>
          </div>

          <div className="specialists-filter-actions">
            <button type="button" className="btn-outline" onClick={clearFilters}>
              {lang === 'UA' ? 'Очистити фільтри' : 'Clear filters'}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={loadSpecialists}
            >
              {lang === 'UA' ? 'Оновити' : 'Refresh'}
            </button>
          </div>

          {loading && (
            <div className="empty-state">
              {lang === 'UA'
                ? 'Завантаження спеціалістів...'
                : 'Loading specialists...'}
            </div>
          )}

          {!loading && loadError && (
            <div className="empty-state error-state">
              <p>
                {lang === 'UA'
                  ? 'Не вдалося завантажити спеціалістів'
                  : 'Failed to load specialists'}
              </p>

              <small>{loadError}</small>

              <button
                type="button"
                className="btn-outline"
                onClick={loadSpecialists}
              >
                {lang === 'UA' ? 'Спробувати ще раз' : 'Try again'}
              </button>
            </div>
          )}

          {!loading && !loadError && filteredSpecialists.length === 0 && (
            <div className="empty-state">
              {lang === 'UA'
                ? 'За вашим запитом спеціалістів не знайдено'
                : 'No specialists found for your request'}
            </div>
          )}

          {!loading && !loadError && filteredSpecialists.length > 0 && (
            <div className="specialists-grid public-specialists-grid">
              {filteredSpecialists.map((specialist) => (
                <article key={specialist.id} className="specialist-card public-specialist-card">
                  <div className="specialist-photo">
                    {specialist.photo_url ? (
                      <img src={specialist.photo_url} alt={specialist.name} />
                    ) : (
                      <div className="specialist-avatar">
                        {String(specialist.name || '?')
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="specialist-card-content">
                    <h3>{specialist.name}</h3>

                    {specialist.displaySpecialty && (
                      <p className="specialist-specialty">
                        {specialist.displaySpecialty}
                      </p>
                    )}

                    <p className="specialist-experience">
                      {lang === 'UA' ? 'Досвід:' : 'Experience:'}{' '}
                      {specialist.experience_years || specialist.experience || 0}{' '}
                      {lang === 'UA' ? 'років' : 'years'}
                    </p>

                    {specialist.displayDescription && (
                      <p className="specialist-description">
                        {specialist.displayDescription}
                      </p>
                    )}

                    {specialist.directionsList.length > 0 && (
                      <div className="specialist-tags">
                        {specialist.directionsList
                          .slice(0, 4)
                          .map((direction, index) => (
                            <span key={`${specialist.id}-direction-${index}`}>
                              {direction}
                            </span>
                          ))}
                      </div>
                    )}

                    {specialist.linkedServices.length > 0 && (
                      <div className="specialist-info-block">
                        <strong>
                          {lang === 'UA' ? 'Послуги:' : 'Services:'}
                        </strong>

                        <p>
                          {specialist.linkedServices
                            .map((service) => getServiceName(service, lang))
                            .join(', ')}
                        </p>
                      </div>
                    )}

                    {specialist.linkedLocations.length > 0 && (
                      <div className="specialist-info-block">
                        <strong>
                          {lang === 'UA' ? 'Локації:' : 'Locations:'}
                        </strong>

                        <p>
                          {specialist.linkedLocations
                            .map((location) => getLocationName(location, lang))
                            .join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="service-actions">
                      <Link
                        to={`/specialists/${specialist.id}`}
                        className="btn-outline"
                      >
                        {lang === 'UA' ? 'Детальніше' : 'Details'}
                      </Link>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleBooking(specialist.id)}
                      >
                        {lang === 'UA' ? 'Записатись' : 'Book'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Specialists;