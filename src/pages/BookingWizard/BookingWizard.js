import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import '../../styles/pages/booking-wizard.css';

import Step1Service from './Step1Service';
import Step2DateTime from './Step2DateTime';
import Step3ClientData from './Step3ClientData';
import Step4Confirm from './Step4Confirm';
import Step5Success from './Step5Success';

import { getAvailableSlots, createAppointmentSafe } from '../../utils/availability';

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const getServiceName = (service, lang) => {
  return lang === 'UA'
    ? service?.name_ua || ''
    : service?.name_en || service?.name_ua || '';
};

const getSpecialistName = (specialist) => {
  return specialist?.name || '';
};

const getLocationName = (location, lang) => {
  return lang === 'UA'
    ? location?.name_ua || location?.name || ''
    : location?.name_en || location?.name_ua || location?.name || '';
};

const BookingWizard = () => {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const [catalog, setCatalog] = useState({
    services: [],
    specialists: [],
    locations: [],
    specialistServices: [],
    specialistLocations: [],
    serviceLocations: [],
  });

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);

  const [bookingData, setBookingData] = useState({
    serviceId: searchParams.get('service') ? Number(searchParams.get('service')) : null,
    specialistId: searchParams.get('specialist') ? Number(searchParams.get('specialist')) : null,
    locationId: searchParams.get('location') ? Number(searchParams.get('location')) : null,
    date: searchParams.get('date') || null,
    time: searchParams.get('time') || null,
    clientName: profile?.full_name || user?.user_metadata?.full_name || '',
    clientPhone: profile?.phone || user?.user_metadata?.phone || '',
    clientEmail: user?.email || '',
    clientNotes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', {
        state: {
          from: `/booking?${searchParams.toString()}`,
        },
      });
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    setBookingData((prev) => ({
      ...prev,
      clientName: prev.clientName || profile?.full_name || user?.user_metadata?.full_name || '',
      clientPhone: prev.clientPhone || profile?.phone || user?.user_metadata?.phone || '',
      clientEmail: prev.clientEmail || user?.email || '',
    }));
  }, [profile, user]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        setLoading(true);
        setPageError('');

        const [
          servicesResponse,
          specialistsResponse,
          locationsResponse,
          specialistServicesResponse,
          specialistLocationsResponse,
          serviceLocationsResponse,
        ] = await Promise.all([
          supabase.from('services').select('*').order('id', { ascending: true }),
          supabase.from('specialists').select('*').order('id', { ascending: true }),
          supabase.from('locations').select('*').order('id', { ascending: true }),
          supabase.from('specialist_services').select('*'),
          supabase.from('specialist_locations').select('*'),
          supabase.from('service_locations').select('*'),
        ]);

        if (servicesResponse.error) throw servicesResponse.error;
        if (specialistsResponse.error) throw specialistsResponse.error;
        if (locationsResponse.error) throw locationsResponse.error;
        if (specialistServicesResponse.error) throw specialistServicesResponse.error;
        if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;
        if (serviceLocationsResponse.error) throw serviceLocationsResponse.error;

        if (!isMounted) return;

        setCatalog({
          services: servicesResponse.data || [],
          specialists: specialistsResponse.data || [],
          locations: locationsResponse.data || [],
          specialistServices: specialistServicesResponse.data || [],
          specialistLocations: specialistLocationsResponse.data || [],
          serviceLocations: serviceLocationsResponse.data || [],
        });
      } catch (error) {
        console.error('Booking catalog loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити дані для запису'
            : 'Failed to load booking data'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const selectedService = useMemo(() => {
    return catalog.services.find((service) => service.id === bookingData.serviceId) || null;
  }, [catalog.services, bookingData.serviceId]);

  const selectedSpecialist = useMemo(() => {
    return catalog.specialists.find((specialist) => specialist.id === bookingData.specialistId) || null;
  }, [catalog.specialists, bookingData.specialistId]);

  const selectedLocation = useMemo(() => {
    return catalog.locations.find((location) => location.id === bookingData.locationId) || null;
  }, [catalog.locations, bookingData.locationId]);

  const availableServices = useMemo(() => {
    if (!bookingData.specialistId) {
      return catalog.services;
    }

    const serviceIds = catalog.specialistServices
      .filter((row) => Number(row.specialist_id) === Number(bookingData.specialistId))
      .map((row) => row.service_id);

    return catalog.services.filter((service) => serviceIds.includes(service.id));
  }, [catalog.services, catalog.specialistServices, bookingData.specialistId]);

  const availableSpecialists = useMemo(() => {
    if (!bookingData.serviceId) {
      return catalog.specialists;
    }

    const specialistIds = catalog.specialistServices
      .filter((row) => Number(row.service_id) === Number(bookingData.serviceId))
      .map((row) => row.specialist_id);

    return catalog.specialists.filter((specialist) => specialistIds.includes(specialist.id));
  }, [catalog.specialists, catalog.specialistServices, bookingData.serviceId]);

  const availableLocations = useMemo(() => {
    if (!bookingData.serviceId && !bookingData.specialistId) {
      return catalog.locations;
    }

    const serviceLocationIds = bookingData.serviceId
      ? catalog.serviceLocations
          .filter((row) => Number(row.service_id) === Number(bookingData.serviceId))
          .map((row) => row.location_id)
      : catalog.locations.map((location) => location.id);

    const specialistLocationIds = bookingData.specialistId
      ? catalog.specialistLocations
          .filter((row) => Number(row.specialist_id) === Number(bookingData.specialistId))
          .map((row) => row.location_id)
      : catalog.locations.map((location) => location.id);

    const allowedLocationIds = serviceLocationIds.filter((id) =>
      specialistLocationIds.includes(id)
    );

    return catalog.locations.filter((location) => allowedLocationIds.includes(location.id));
  }, [
    catalog.locations,
    catalog.serviceLocations,
    catalog.specialistLocations,
    bookingData.serviceId,
    bookingData.specialistId,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadCalendarDays = async () => {
      if (
        !bookingData.serviceId ||
        !bookingData.specialistId ||
        !bookingData.locationId
      ) {
        setCalendarDays([]);
        return;
      }

      try {
        setSlotsLoading(true);

        const days = [];

        for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
          const date = addDays(new Date(), dayOffset);
          const dateString = toDateString(date);

          const slots = await getAvailableSlots({
            specialistId: bookingData.specialistId,
            serviceId: bookingData.serviceId,
            locationId: bookingData.locationId,
            date: dateString,
          });

          days.push({
            date: dateString,
            dayNumber: date.getDate(),
            fullLabel: date.toLocaleDateString(lang === 'UA' ? 'uk-UA' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            slots,
          });
        }

        if (isMounted) {
          setCalendarDays(days);
        }
      } catch (error) {
        console.error('Calendar slots loading failed:', error);

        if (isMounted) {
          setCalendarDays([]);
        }
      } finally {
        if (isMounted) {
          setSlotsLoading(false);
        }
      }
    };

    loadCalendarDays();

    return () => {
      isMounted = false;
    };
  }, [
    bookingData.serviceId,
    bookingData.specialistId,
    bookingData.locationId,
    lang,
  ]);

  useEffect(() => {
    if (
      bookingData.serviceId &&
      bookingData.specialistId &&
      !availableSpecialists.some((specialist) => specialist.id === bookingData.specialistId)
    ) {
      setBookingData((prev) => ({
        ...prev,
        specialistId: null,
        locationId: null,
        date: null,
        time: null,
      }));
    }
  }, [bookingData.serviceId, bookingData.specialistId, availableSpecialists]);

  useEffect(() => {
    if (
      bookingData.locationId &&
      availableLocations.length > 0 &&
      !availableLocations.some((location) => location.id === bookingData.locationId)
    ) {
      setBookingData((prev) => ({
        ...prev,
        locationId: availableLocations[0].id,
        date: null,
        time: null,
      }));
    }
  }, [bookingData.locationId, availableLocations]);

  useEffect(() => {
    if (!bookingData.locationId && availableLocations.length > 0) {
      setBookingData((prev) => ({
        ...prev,
        locationId: availableLocations[0].id,
      }));
    }
  }, [bookingData.locationId, availableLocations]);

  const updateBookingData = (newData) => {
    setBookingData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleConfirm = async () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: `/booking?${searchParams.toString()}`,
        },
      });
      return;
    }

    if (
      !bookingData.serviceId ||
      !bookingData.specialistId ||
      !bookingData.locationId ||
      !bookingData.date ||
      !bookingData.time
    ) {
      alert(lang === 'UA' ? 'Заповніть усі дані запису' : 'Please complete booking details');
      return;
    }

    try {
      setSubmitting(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: bookingData.clientName,
          phone: bookingData.clientPhone,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile update failed:', profileError);
      }

      const data = await createAppointmentSafe({
        clientId: user.id,
        serviceId: bookingData.serviceId,
        specialistId: bookingData.specialistId,
        locationId: bookingData.locationId,
        date: bookingData.date,
        time: bookingData.time,
        status: 'pending',
        notes: bookingData.clientNotes,
      });

      setCreatedAppointment(data);
      nextStep();
    } catch (error) {
      console.error('Appointment creation failed:', error);

      const isSlotError =
        error?.message?.includes('SLOT_NOT_AVAILABLE') ||
        error?.details?.includes('SLOT_NOT_AVAILABLE');

      alert(
        isSlotError
          ? lang === 'UA'
            ? 'Цей час уже недоступний. Оберіть інший слот.'
            : 'This time is no longer available. Please choose another slot.'
          : lang === 'UA'
            ? `Не вдалося створити запис: ${error.message || 'Спробуйте ще раз'}`
            : `Failed to create appointment: ${error.message || 'Please try again'}`
      );

      if (isSlotError) {
        setCurrentStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const commonStepProps = {
    bookingData,
    updateBookingData,
    catalog,
    selectedService,
    selectedSpecialist,
    selectedLocation,
    availableServices,
    availableSpecialists,
    availableLocations,
    calendarDays,
    slotsLoading,
    nextStep,
    prevStep,
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return <Step1Service {...commonStepProps} />;
    }

    if (currentStep === 2) {
      return <Step2DateTime {...commonStepProps} />;
    }

    if (currentStep === 3) {
      return <Step3ClientData {...commonStepProps} />;
    }

    if (currentStep === 4) {
      return (
        <Step4Confirm
          {...commonStepProps}
          onConfirm={handleConfirm}
          submitting={submitting}
        />
      );
    }

    if (currentStep === 5) {
      return (
        <Step5Success
          bookingData={bookingData}
          appointment={createdAppointment}
          selectedService={selectedService}
          selectedSpecialist={selectedSpecialist}
          selectedLocation={selectedLocation}
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="booking-wizard">
        <div className="container">
          <div className="empty-state">
            <p>{lang === 'UA' ? 'Завантаження...' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="booking-wizard">
        <div className="container">
          <div className="empty-state">
            <p>{pageError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-wizard">
      <div className="container">
        {currentStep < 5 && (
          <div className="wizard-header">
            <h1>{lang === 'UA' ? 'Запис на прийом' : 'Booking appointment'}</h1>

            <div className="wizard-steps">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`step-indicator ${currentStep >= step ? 'active' : ''}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
};

export default BookingWizard;

export {
  getServiceName,
  getSpecialistName,
  getLocationName,
};