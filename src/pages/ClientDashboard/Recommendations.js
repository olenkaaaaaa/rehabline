import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { prescriptions, appointments, specialists } from '../../data/mockData';
import { FaFilePdf, FaDownload } from 'react-icons/fa';

const Recommendations = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const clientId = user?.id || 1;

  const myPrescriptions = useMemo(() => {
    return prescriptions
      .filter(p => p.clientId === clientId)
      .map(p => {
        const app = appointments.find(a => a.id === p.appointmentId);
        const specialist = specialists.find(s => s.id === app?.specialistId);
        return {
          ...p,
          specialistName: specialist?.name || '',
          appointmentDate: app?.date,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [clientId]);

  return (
    <div className="recommendations">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Мої рекомендації' : 'My Recommendations'}</h1>
      {myPrescriptions.length === 0 ? (
        <p className="no-data">{lang === 'UA' ? 'Немає рекомендацій' : 'No recommendations yet'}</p>
      ) : (
        <div className="prescriptions-list">
          {myPrescriptions.map(p => (
            <div key={p.id} className="prescription-card">
              <div className="prescription-header">
                <h3>{p.title[lang]}</h3>
                <span className="prescription-date">{p.date}</span>
              </div>
              <p className="prescription-specialist">
                {lang === 'UA' ? 'Лікар:' : 'Doctor:'} {p.specialistName}
              </p>
              <p className="prescription-description">{p.description[lang]}</p>
              {p.fileUrl && (
                <a href={p.fileUrl} className="btn-outline" download>
                  <FaFilePdf /> {lang === 'UA' ? 'Завантажити PDF' : 'Download PDF'}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;