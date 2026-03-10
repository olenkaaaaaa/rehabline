import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { locations } from '../data/mockData';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const Locations = () => {
  const { lang } = useLanguage();

  // Центр карти (Ужгород)
  const mapCenter = { lat: 48.6208, lng: 22.2879 };

  // Функція для побудови маршруту в Google Maps
  const openDirections = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  // Функція для дзвінка
  const makeCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="locations-page">
      <div className="container">
        <h1 className="section-title">{lang === 'UA' ? 'Локації' : 'Locations'}</h1>

        {/* Двоколонковий макет: список локацій зліва, карта справа */}
        <div className="locations-grid">
          {/* Ліва колонка – список локацій */}
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <h2>{location.name[lang]}</h2>
                <p className="location-address">{location.address}</p>
                <p className="location-hours">{location.hours[lang]}</p>
                
                <div className="location-actions">
                  <button 
                    className="btn-outline"
                    onClick={() => openDirections(location.address)}
                  >
                    {lang === 'UA' ? 'Прокласти маршрут' : 'Directions'}
                  </button>
                  <button 
                    className="btn-outline"
                    onClick={() => makeCall(location.phone)}
                  >
                    {lang === 'UA' ? 'Подзвонити' : 'Call'}
                  </button>
                </div>
              </div>
            ))}

            {/* Контактна інформація (згідно з мокапом) */}
            <div className="contact-info-card">
              <h3>{lang === 'UA' ? 'Контакти' : 'Contact'}</h3>
              <p><strong>Email:</strong> hello@rehabline.ua</p>
              <p><strong>{lang === 'UA' ? 'Телефон' : 'Phone'}:</strong> +38 (0XX) XXX-XX-XX</p>
              <p><strong>{lang === 'UA' ? 'Графік' : 'Hours'}:</strong> Пн-Пт 08:00-20:00 • Сб 09:00-15:00</p>
            </div>
          </div>

          {/* Права колонка – карта */}
          <div className="map-container">
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={12}
                mapId="YOUR_MAP_ID" // Опціонально, для кастомізації стилю
                gestureHandling="greedy"
              >
                {/* Маркери для кожної локації */}
                {locations.map(location => (
                  <Marker
                    key={location.id}
                    position={location.coordinates}
                    title={location.name[lang]}
                    onClick={() => openDirections(location.address)}
                  />
                ))}
              </Map>
            </APIProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;