import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { locations } from '../data/mockData';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const Locations = () => {
  const { lang } = useLanguage();
  const mapCenter = { lat: 48.6208, lng: 22.2879 };

  const openDirections = (address) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const makeCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="locations-page">
      <div className="container">
        <h1 className="section-title">{lang === 'UA' ? 'Локації' : 'Locations'}</h1>
        <div className="locations-grid">
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <h2>{location.name[lang]}</h2>
                <p className="location-address">{location.address}</p>
                <p className="location-hours">{location.hours[lang]}</p>
                <div className="location-actions">
                  <button className="btn-outline" onClick={() => openDirections(location.address)}>
                    {lang === 'UA' ? 'Прокласти маршрут' : 'Directions'}
                  </button>
                  <button className="btn-outline" onClick={() => makeCall(location.phone)}>
                    {lang === 'UA' ? 'Подзвонити' : 'Call'}
                  </button>
                </div>
              </div>
            ))}
      
          </div>
          <div className="map-container">
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={12}
                gestureHandling="greedy"
                style={{ width: '100%', height: '100%' }}
              >
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
