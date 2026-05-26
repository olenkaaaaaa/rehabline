import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabaseClient';
import '../styles/pages/locations.css';

const getLocationName = (location, lang) =>
  lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';

const getLocationAddress = (location, lang) =>
  lang === 'UA'
    ? location?.address_ua || location?.address || ''
    : location?.address_en || location?.address_ua || location?.address || '';

const getLocationCity = (location, lang) =>
  lang === 'UA'
    ? location?.city_ua || location?.city || ''
    : location?.city_en || location?.city_ua || location?.city || '';

const getLocationHours = (location, lang) =>
  lang === 'UA'
    ? location?.hours_ua ||
      location?.working_hours_ua ||
      location?.hours ||
      location?.working_hours ||
      ''
    : location?.hours_en ||
      location?.working_hours_en ||
      location?.hours_ua ||
      location?.working_hours_ua ||
      location?.hours ||
      location?.working_hours ||
      '';

const getLocationPhone = (location) =>
  location?.phone || location?.phone_number || location?.contact_phone || '';

const getServiceName = (service, lang) =>
  lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';

const getSpecialistSpecialty = (specialist, lang) =>
  lang === 'UA'
    ? specialist?.specialty_ua || ''
    : specialist?.specialty_en || specialist?.specialty_ua || '';

const getLocationCoordinates = (location) => {
  const lat =
    location?.lat ??
    location?.latitude ??
    location?.coordinates?.lat ??
    location?.coords?.lat;

  const lng =
    location?.lng ??
    location?.longitude ??
    location?.coordinates?.lng ??
    location?.coords?.lng;

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }

  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (Number.isNaN(numericLat) || Number.isNaN(numericLng)) {
    return null;
  }

  return {
    lat: numericLat,
    lng: numericLng,
  };
};

const buildFullAddress = (location, lang) => {
  const name = getLocationName(location, lang);
  const address = getLocationAddress(location, lang);
  const city = getLocationCity(location, lang);

  return [name, address, city, 'Україна'].filter(Boolean).join(', ');
};

const getDirectionsUrl = (location, lang) => {
  const coordinates = getLocationCoordinates(location);

  if (coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
  }

  const fullAddress = buildFullAddress(location, lang);

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    fullAddress
  )}`;
};

const getMapEmbedUrl = (location, lang) => {
  const coordinates = getLocationCoordinates(location);

  if (coordinates) {
    return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=16&output=embed`;
  }

  const fullAddress = buildFullAddress(location, lang);

  return `https://www.google.com/maps?q=${encodeURIComponent(
    fullAddress
  )}&z=16&output=embed`;
};

const makeCall = (phone, lang) => {
  if (!phone) {
    alert(lang === 'UA' ? 'Телефон не вказаний' : 'Phone is not specified');
    return;
  }

  window.location.href = `tel:${phone}`;
};

const Locations = () => {
  const { lang } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [serviceLocationRows, setServiceLocationRows] = useState([]);
  const [specialistLocationRows, setSpecialistLocationRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadLocations = async () => {
      try {
        setLoading(true);
        setPageError('');

        const [
          locationsResponse,
          servicesResponse,
          specialistsResponse,
          serviceLocationsResponse,
          specialistLocationsResponse,
        ] = await Promise.all([
          supabase.from('locations').select('*').order('id', { ascending: true }),
          supabase.from('services').select('*').order('id', { ascending: true }),
          supabase.from('specialists').select('*').order('id', { ascending: true }),
          supabase.from('service_locations').select('*'),
          supabase.from('specialist_locations').select('*'),
        ]);

        if (locationsResponse.error) throw locationsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (serviceLocationsResponse.error) throw serviceLocationsResponse.error;
        if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;

        if (!isMounted) return;

        const loadedLocations = locationsResponse.data || [];

        setLocations(loadedLocations);
        setServices(servicesResponse.data || []);
        setSpecialists(specialistsResponse.data || []);
        setServiceLocationRows(serviceLocationsResponse.data || []);
        setSpecialistLocationRows(specialistLocationsResponse.data || []);

        if (loadedLocations.length > 0) {
          setSelectedLocationId(loadedLocations[0].id);
        }
      } catch (error) {
        console.error('Locations loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити локації з бази'
            : 'Failed to load locations from database'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const enrichedLocations = useMemo(() => {
    return locations.map((location) => {
      const locationServices = serviceLocationRows
        .filter((row) => Number(row.location_id) === Number(location.id))
        .map((row) =>
          services.find((service) => Number(service.id) === Number(row.service_id))
        )
        .filter(Boolean);

      const locationSpecialists = specialistLocationRows
        .filter((row) => Number(row.location_id) === Number(location.id))
        .map((row) =>
          specialists.find(
            (specialist) => Number(specialist.id) === Number(row.specialist_id)
          )
        )
        .filter(Boolean);

      return {
        ...location,
        nameLabel: getLocationName(location, lang),
        addressLabel: getLocationAddress(location, lang),
        cityLabel: getLocationCity(location, lang),
        hoursLabel: getLocationHours(location, lang),
        phoneLabel: getLocationPhone(location),
        coordinates: getLocationCoordinates(location),
        services: locationServices,
        specialists: locationSpecialists,
      };
    });
  }, [
    locations,
    services,
    specialists,
    serviceLocationRows,
    specialistLocationRows,
    lang,
  ]);

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return enrichedLocations;

    return enrichedLocations.filter((location) => {
      const servicesText = location.services
        .map((service) => getServiceName(service, lang))
        .join(' ')
        .toLowerCase();

      const specialistsText = location.specialists
        .map(
          (specialist) =>
            `${specialist.name || ''} ${getSpecialistSpecialty(specialist, lang)}`
        )
        .join(' ')
        .toLowerCase();

      const locationText = [
        location.nameLabel,
        location.addressLabel,
        location.cityLabel,
        location.hoursLabel,
      ]
        .join(' ')
        .toLowerCase();

      return (
        locationText.includes(normalizedSearch) ||
        servicesText.includes(normalizedSearch) ||
        specialistsText.includes(normalizedSearch)
      );
    });
  }, [enrichedLocations, searchTerm, lang]);

  const selectedLocation = useMemo(() => {
    const selectedFromFiltered = filteredLocations.find(
      (location) => Number(location.id) === Number(selectedLocationId)
    );

    return selectedFromFiltered || filteredLocations[0] || null;
  }, [filteredLocations, selectedLocationId]);

  useEffect(() => {
    if (
      filteredLocations.length > 0 &&
      !filteredLocations.some(
        (location) => Number(location.id) === Number(selectedLocationId)
      )
    ) {
      setSelectedLocationId(filteredLocations[0].id);
    }
  }, [filteredLocations, selectedLocationId]);

  return (
    <main className="locations-page">
      <section className="locations-top">
        <div className="container">


          <div className="location-search-card">
            <label htmlFor="location-search">
              {lang === 'UA' ? 'Пошук локації' : 'Search location'}
            </label>

            <input
              id="location-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                lang === 'UA'
                  ? 'Назва, місто, адреса, послуга або спеціаліст...'
                  : 'Name, city, address, service or specialist...'
              }
            />
          </div>
        </div>
      </section>

      <section className="locations-main-section">
        <div className="container">
          {pageError && (
            <div className="empty-state">
              <p>{pageError}</p>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'Завантаження локацій...'
                  : 'Loading locations...'}
              </p>
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="locations-layout">
              <div className="locations-list">
                {filteredLocations.map((location) => (
                  <article
                    key={location.id}
                    className={`location-card ${
                      Number(selectedLocation?.id) === Number(location.id)
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <div className="location-card-head">
                      <div>
                        <h2>{location.nameLabel}</h2>

                        {location.addressLabel && (
                          <p>
                            📍{' '}
                            {[location.cityLabel, location.addressLabel]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/booking?location=${location.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {lang === 'UA' ? 'Запис' : 'Book'}
                      </Link>
                    </div>

                    <div className="location-meta">
                      {location.hoursLabel && <span>🕒 {location.hoursLabel}</span>}
                      {location.phoneLabel && <span>☎ {location.phoneLabel}</span>}
                    </div>

                    <div className="location-stats">
                      <span>
                        {lang === 'UA' ? 'Послуг' : 'Services'}:{' '}
                        {location.services.length}
                      </span>

                      <span>
                        {lang === 'UA' ? 'Спеціалістів' : 'Specialists'}:{' '}
                        {location.specialists.length}
                      </span>
                    </div>

                    {location.services.length > 0 && (
                      <div className="location-tags">
                        {location.services.slice(0, 3).map((service) => (
                          <Link
                            key={service.id}
                            to={`/services/${service.id}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {getServiceName(service, lang)}
                          </Link>
                        ))}

                        {location.services.length > 3 && (
                          <span>+{location.services.length - 3}</span>
                        )}
                      </div>
                    )}

                    {location.specialists.length > 0 && (
                      <div className="location-specialists">
                        {location.specialists.slice(0, 2).map((specialist) => (
                          <Link
                            key={specialist.id}
                            to={`/specialists/${specialist.id}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {specialist.name}
                          </Link>
                        ))}

                        {location.specialists.length > 2 && (
                          <span>+{location.specialists.length - 2}</span>
                        )}
                      </div>
                    )}

                    <div className="location-actions">
                      <a
                        href={getDirectionsUrl(location, lang)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {lang === 'UA' ? 'Маршрут' : 'Directions'}
                      </a>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          makeCall(location.phoneLabel, lang);
                        }}
                      >
                        {lang === 'UA' ? 'Подзвонити' : 'Call'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="locations-map-card">
                <div className="locations-map">
                  {selectedLocation ? (
                    <iframe
                      title={selectedLocation.nameLabel || 'Location map'}
                      src={getMapEmbedUrl(selectedLocation, lang)}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="empty-state">
                      <p>
                        {lang === 'UA'
                          ? 'Оберіть локацію'
                          : 'Select a location'}
                      </p>
                    </div>
                  )}
                </div>

                {selectedLocation && (
                  <div className="selected-location-card">
                    <h3>{selectedLocation.nameLabel}</h3>

                    <p>
                      {[selectedLocation.cityLabel, selectedLocation.addressLabel]
                        .filter(Boolean)
                        .join(', ')}
                    </p>

                    <div className="selected-location-actions">
                      <Link
                        to={`/booking?location=${selectedLocation.id}`}
                        className="btn btn-primary"
                      >
                        {lang === 'UA' ? 'Записатись' : 'Book'}
                      </Link>

                      <a
                        href={getDirectionsUrl(selectedLocation, lang)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                      >
                        {lang === 'UA' ? 'Маршрут' : 'Directions'}
                      </a>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {lang === 'UA'
                  ? 'За вашим запитом локацій не знайдено'
                  : 'No locations found for your request'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Locations;