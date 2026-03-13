import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointments, clients } from '../../data/mockData';
import { Link } from 'react-router-dom';

const Clients = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const specialistId = user?.id || 1;

  const [searchTerm, setSearchTerm] = useState('');
  const [clientList, setClientList] = useState([]);

  useEffect(() => {
    // Отримуємо унікальних клієнтів, які мали запити до цього спеціаліста
    const specialistAppointments = appointments.filter(app => app.specialistId === specialistId);
    const uniqueClientIds = [...new Set(specialistAppointments.map(app => app.clientId))];
    const specialistClients = clients.filter(c => uniqueClientIds.includes(c.id));
    setClientList(specialistClients);
  }, [specialistId]);

  const filteredClients = clientList.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="clients-page">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Мої клієнти' : 'My Clients'}</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder={lang === 'UA' ? 'Пошук клієнтів...' : 'Search clients...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="clients-grid">
        {filteredClients.map(client => (
          <div key={client.id} className="client-card">
            <h3>{client.name}</h3>
            <p><strong>{lang === 'UA' ? 'Телефон' : 'Phone'}:</strong> {client.phone}</p>
            <p><strong>Email:</strong> {client.email}</p>
            <Link to={`/specialist/clients/${client.id}`} className="btn-link">
              {lang === 'UA' ? 'Історія записів' : 'Appointment history'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clients;