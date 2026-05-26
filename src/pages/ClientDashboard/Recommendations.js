import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { FaFilePdf, FaDownload } from 'react-icons/fa';
import '../../styles/pages/client-recommendations.css';

const getPrescriptionTitle = (prescription, lang) => {
  return lang === 'UA'
    ? prescription.title_ua || prescription.title || ''
    : prescription.title_en || prescription.title_ua || prescription.title || '';
};


const getPrescriptionDescription = (prescription, lang) => {
  return lang === 'UA'
    ? prescription.description_ua || prescription.description || ''
    : prescription.description_en ||
        prescription.description_ua ||
        prescription.description ||
        '';
};

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || service?.name || ''
    : service?.name_en || service?.name_ua || service?.name || '';
};

const Recommendations = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const [
          prescriptionsResponse,
          appointmentsResponse,
          specialistsResponse,
          servicesResponse,
        ] = await Promise.all([
          supabase
            .from('prescriptions')
            .select('*')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false }),

          supabase
            .from('appointments')
            .select('*')
            .eq('client_id', user.id),

          supabase
            .from('specialists')
            .select('*'),

          supabase
            .from('services')
            .select('*'),
        ]);

        if (prescriptionsResponse.error) throw prescriptionsResponse.error;
        if (appointmentsResponse.error) throw appointmentsResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (servicesResponse.error) throw servicesResponse.error;

        if (!isMounted) return;

        setPrescriptions(prescriptionsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setSpecialists(specialistsResponse.data || []);
        setServices(servicesResponse.data || []);
      } catch (error) {
        console.error('Recommendations loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити рекомендації'
            : 'Failed to load recommendations'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const myPrescriptions = useMemo(() => {
    return prescriptions.map((prescription) => {
      const appointment = appointments.find(
        (item) => item.id === prescription.appointment_id
      );

      const specialist =
        specialists.find((item) => item.id === prescription.specialist_id) ||
        specialists.find((item) => item.id === appointment?.specialist_id);

      const service = services.find((item) => item.id === appointment?.service_id);

      return {
        ...prescription,
        titleLabel: getPrescriptionTitle(prescription, lang),
        descriptionLabel: getPrescriptionDescription(prescription, lang),
        specialistName: specialist?.name || '',
        serviceName: getServiceName(service, lang),
        appointmentDate: appointment?.appointment_date || '',
        createdDate: prescription.created_at
          ? new Date(prescription.created_at).toLocaleDateString(
              lang === 'UA' ? 'uk-UA' : 'en-US'
            )
          : '',
      };
    });
  }, [prescriptions, appointments, specialists, services, lang]);

  const handleDownload = (prescription) => {
    const fileUrl = prescription.file_url || prescription.fileUrl;

    if (!fileUrl) {
      alert(
        lang === 'UA'
          ? 'Файл для цієї рекомендації не доданий'
          : 'No file is attached to this recommendation'
      );
      return;
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="recommendations">
        <h1 className="dashboard-title">
          {lang === 'UA' ? 'Мої рекомендації' : 'My Recommendations'}
        </h1>

        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Завантаження рекомендацій...'
              : 'Loading recommendations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Мої рекомендації' : 'My Recommendations'}
      </h1>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      {myPrescriptions.length === 0 ? (
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Немає рекомендацій'
              : 'No recommendations yet'}
          </p>
        </div>
      ) : (
        <div className="prescriptions-list">
          {myPrescriptions.map((prescription) => (
            <div key={prescription.id} className="prescription-card">
              <div className="prescription-header">
                <h3>{prescription.titleLabel || '—'}</h3>

                <span className="prescription-date">
                  {prescription.createdDate}
                </span>
              </div>

              {prescription.specialistName && (
                <p className="prescription-specialist">
                  {lang === 'UA' ? 'Спеціаліст:' : 'Specialist:'}{' '}
                  {prescription.specialistName}
                </p>
              )}

              {prescription.serviceName && (
                <p className="prescription-specialist">
                  {lang === 'UA' ? 'Послуга:' : 'Service:'}{' '}
                  {prescription.serviceName}
                </p>
              )}

              {prescription.appointmentDate && (
                <p className="prescription-specialist">
                  {lang === 'UA' ? 'Дата візиту:' : 'Visit date:'}{' '}
                  {prescription.appointmentDate}
                </p>
              )}

              <p className="prescription-description">
                {prescription.descriptionLabel || '—'}
              </p>

              {(prescription.file_url || prescription.fileUrl) && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => handleDownload(prescription)}
                >
                  <FaFilePdf />{' '}
                  {lang === 'UA' ? 'Відкрити PDF' : 'Open PDF'}
                </button>
              )}

              {!prescription.file_url && !prescription.fileUrl && (
                <div className="prescription-no-file">
                  <FaDownload />{' '}
                  {lang === 'UA'
                    ? 'Файл не прикріплено'
                    : 'No file attached'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;