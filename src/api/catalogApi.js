import { supabase } from '../supabaseClient';

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getDayOfWeekForDb = (date) => {
  const jsDay = date.getDay();

  if (jsDay === 0) return 7;

  return jsDay;
};

const getServiceName = (service, lang) => {
  return lang === 'UA' ? service.name_ua : service.name_en;
};

const getServiceCategory = (service, lang) => {
  return lang === 'UA' ? service.category_ua : service.category_en;
};

const getServiceTag = (service, lang) => {
  return lang === 'UA' ? service.tag_ua : service.tag_en;
};

const getSpecialistSpecialty = (specialist, lang) => {
  return lang === 'UA' ? specialist.specialty_ua : specialist.specialty_en;
};

const getLocationName = (location, lang = 'UA') => {
  if (!location) return '';

  return lang === 'UA'
    ? location.name_ua || location.name || ''
    : location.name_en || location.name || '';
};

export const formatDuration = (minutes, lang = 'UA') => {
  if (!minutes) return lang === 'UA' ? 'Не вказано' : 'Not specified';

  return lang === 'UA' ? `${minutes} хв` : `${minutes} min`;
};

export const formatPrice = (price, lang = 'UA') => {
  const numericPrice = Number(price || 0);

  return lang === 'UA'
    ? `від ${numericPrice} грн`
    : `from ${numericPrice} UAH`;
};

export const formatDateLabel = (dateString, lang = 'UA') => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(lang === 'UA' ? 'uk-UA' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const buildServiceUi = ({
  service,
  lang,
  allLocations = [],
  serviceLocationRows = [],
  specialistServiceRows = [],
  allSpecialists = [],
  visitCount = 0,
}) => {
  const serviceLocations = serviceLocationRows
    .filter((row) => row.service_id === service.id)
    .map((row) => allLocations.find((location) => location.id === row.location_id))
    .filter(Boolean);

  const serviceSpecialists = specialistServiceRows
    .filter((row) => row.service_id === service.id)
    .map((row) => allSpecialists.find((specialist) => specialist.id === row.specialist_id))
    .filter(Boolean);

  return {
    id: service.id,
    name: getServiceName(service, lang),
    name_ua: service.name_ua,
    name_en: service.name_en,
    durationMinutes: service.duration_minutes,
    duration: formatDuration(service.duration_minutes, lang),
    price: Number(service.price || 0),
    priceLabel: formatPrice(service.price, lang),
    category: getServiceCategory(service, lang),
    tag: getServiceTag(service, lang),
    description: lang === 'UA' ? service.description_ua : service.description_en,
    indications: lang === 'UA' ? service.indications_ua || [] : service.indications_en || [],
    locations: serviceLocations,
    specialists: serviceSpecialists,
    visitCount,
    raw: service,
  };
};

const buildSpecialistUi = ({
  specialist,
  lang,
  allLocations = [],
  specialistLocationRows = [],
  specialistServiceRows = [],
  allServices = [],
}) => {
  const specialistLocations = specialistLocationRows
    .filter((row) => row.specialist_id === specialist.id)
    .map((row) => allLocations.find((location) => location.id === row.location_id))
    .filter(Boolean);

  const specialistServices = specialistServiceRows
    .filter((row) => row.specialist_id === specialist.id)
    .map((row) => allServices.find((service) => service.id === row.service_id))
    .filter(Boolean);

  return {
    id: specialist.id,
    name: specialist.name,
    photoUrl: specialist.photo_url,
    specialty: getSpecialistSpecialty(specialist, lang),
    experienceYears: specialist.experience_years || 0,
    description: lang === 'UA' ? specialist.description_ua : specialist.description_en,
    education: lang === 'UA' ? specialist.education_ua || [] : specialist.education_en || [],
    certificates: specialist.certificates || [],
    directions: lang === 'UA' ? specialist.directions_ua || [] : specialist.directions_en || [],
    locations: specialistLocations,
    services: specialistServices,
    raw: specialist,
  };
};

const fetchCatalogBase = async () => {
  const [
    servicesResponse,
    specialistsResponse,
    locationsResponse,
    serviceLocationsResponse,
    specialistServicesResponse,
    specialistLocationsResponse,
  ] = await Promise.all([
    supabase.from('services').select('*').order('id', { ascending: true }),
    supabase.from('specialists').select('*').order('id', { ascending: true }),
    supabase.from('locations').select('*').order('id', { ascending: true }),
    supabase.from('service_locations').select('*'),
    supabase.from('specialist_services').select('*'),
    supabase.from('specialist_locations').select('*'),
  ]);

  if (servicesResponse.error) throw servicesResponse.error;
  if (specialistsResponse.error) throw specialistsResponse.error;
  if (locationsResponse.error) throw locationsResponse.error;
  if (serviceLocationsResponse.error) throw serviceLocationsResponse.error;
  if (specialistServicesResponse.error) throw specialistServicesResponse.error;
  if (specialistLocationsResponse.error) throw specialistLocationsResponse.error;

  return {
    services: servicesResponse.data || [],
    specialists: specialistsResponse.data || [],
    locations: locationsResponse.data || [],
    serviceLocationRows: serviceLocationsResponse.data || [],
    specialistServiceRows: specialistServicesResponse.data || [],
    specialistLocationRows: specialistLocationsResponse.data || [],
  };
};

export const getPopularServices = async (lang = 'UA', limit = 3) => {
  const catalog = await fetchCatalogBase();

  const appointmentsResponse = await supabase
    .from('appointments')
    .select('id, service_id, status');

  if (appointmentsResponse.error) {
    throw appointmentsResponse.error;
  }

  const appointments = appointmentsResponse.data || [];
  const ignoredStatuses = ['cancelled', 'canceled', 'rejected', 'no_show'];

  const visitsByService = appointments.reduce((acc, appointment) => {
    if (!appointment.service_id) return acc;

    if (ignoredStatuses.includes(appointment.status)) return acc;

    acc[appointment.service_id] = (acc[appointment.service_id] || 0) + 1;

    return acc;
  }, {});

  return catalog.services
    .map((service) =>
      buildServiceUi({
        service,
        lang,
        allLocations: catalog.locations,
        serviceLocationRows: catalog.serviceLocationRows,
        specialistServiceRows: catalog.specialistServiceRows,
        allSpecialists: catalog.specialists,
        visitCount: visitsByService[service.id] || 0,
      })
    )
    .sort((a, b) => {
      if (b.visitCount !== a.visitCount) {
        return b.visitCount - a.visitCount;
      }

      return a.id - b.id;
    })
    .slice(0, limit);
};

export const getAllPublicServices = async (lang = 'UA') => {
  const catalog = await fetchCatalogBase();

  const appointmentsResponse = await supabase
    .from('appointments')
    .select('id, service_id, status');

  if (appointmentsResponse.error) {
    throw appointmentsResponse.error;
  }

  const appointments = appointmentsResponse.data || [];
  const ignoredStatuses = ['cancelled', 'canceled', 'rejected', 'no_show'];

  const visitsByService = appointments.reduce((acc, appointment) => {
    if (!appointment.service_id) return acc;

    if (ignoredStatuses.includes(appointment.status)) return acc;

    acc[appointment.service_id] = (acc[appointment.service_id] || 0) + 1;

    return acc;
  }, {});

  return catalog.services.map((service) =>
    buildServiceUi({
      service,
      lang,
      allLocations: catalog.locations,
      serviceLocationRows: catalog.serviceLocationRows,
      specialistServiceRows: catalog.specialistServiceRows,
      allSpecialists: catalog.specialists,
      visitCount: visitsByService[service.id] || 0,
    })
  );
};

export const getAllPublicSpecialists = async (lang = 'UA') => {
  const catalog = await fetchCatalogBase();

  return catalog.specialists.map((specialist) =>
    buildSpecialistUi({
      specialist,
      lang,
      allLocations: catalog.locations,
      specialistLocationRows: catalog.specialistLocationRows,
      specialistServiceRows: catalog.specialistServiceRows,
      allServices: catalog.services,
    })
  );
};

export const getNearestAvailableSlots = async (lang = 'UA', limit = 3) => {
  const today = new Date();
  const dateFrom = toDateString(today);
  const dateTo = toDateString(addDays(today, 14));

  const catalog = await fetchCatalogBase();

  const [schedulesResponse, appointmentsResponse] = await Promise.all([
    supabase
      .from('specialist_schedules')
      .select('*')
      .eq('is_working', true),

    supabase
      .from('appointments')
      .select('id, specialist_id, appointment_date, appointment_time, status')
      .gte('appointment_date', dateFrom)
      .lte('appointment_date', dateTo)
      .in('status', ['pending', 'confirmed']),
  ]);

  if (schedulesResponse.error) throw schedulesResponse.error;
  if (appointmentsResponse.error) throw appointmentsResponse.error;

  const schedules = schedulesResponse.data || [];
  const appointments = appointmentsResponse.data || [];

  const busySlotKeys = new Set(
    appointments.map((appointment) => {
      return `${appointment.specialist_id}_${appointment.appointment_date}_${normalizeTime(
        appointment.appointment_time
      )}`;
    })
  );

  const slots = [];

  for (let dayOffset = 0; dayOffset <= 14; dayOffset += 1) {
    const date = addDays(today, dayOffset);
    const dateString = toDateString(date);
    const dayOfWeek = getDayOfWeekForDb(date);

    const daySchedules = schedules.filter(
      (schedule) => Number(schedule.day_of_week) === Number(dayOfWeek)
    );

    daySchedules.forEach((schedule) => {
      const specialist = catalog.specialists.find(
        (item) => item.id === schedule.specialist_id
      );

      if (!specialist) return;

      const specialistServiceRows = catalog.specialistServiceRows.filter(
        (row) => row.specialist_id === specialist.id
      );

      const specialistLocationRows = catalog.specialistLocationRows.filter(
        (row) => row.specialist_id === specialist.id
      );

      const specialistLocations = specialistLocationRows
        .map((row) => catalog.locations.find((location) => location.id === row.location_id))
        .filter(Boolean);

      specialistServiceRows.forEach((specialistServiceRow) => {
        const service = catalog.services.find(
          (item) => item.id === specialistServiceRow.service_id
        );

        if (!service) return;

        const serviceLocationRows = catalog.serviceLocationRows.filter(
          (row) => row.service_id === service.id
        );

        const serviceLocations = serviceLocationRows
          .map((row) => catalog.locations.find((location) => location.id === row.location_id))
          .filter(Boolean);

        const availableLocation =
          serviceLocations.find((serviceLocation) =>
            specialistLocations.some(
              (specialistLocation) => specialistLocation.id === serviceLocation.id
            )
          ) ||
          serviceLocations[0] ||
          specialistLocations[0] ||
          null;

        const startMinutes = timeToMinutes(schedule.start_time);
        const endMinutes = timeToMinutes(schedule.end_time);
        const durationMinutes = service.duration_minutes || 45;
        const slotStep = 30;

        for (
          let slotMinutes = startMinutes;
          slotMinutes + durationMinutes <= endMinutes;
          slotMinutes += slotStep
        ) {
          const time = minutesToTime(slotMinutes);
          const busyKey = `${specialist.id}_${dateString}_${time}`;

          if (busySlotKeys.has(busyKey)) {
            continue;
          }

          slots.push({
            id: `${service.id}-${specialist.id}-${dateString}-${time}`,
            serviceId: service.id,
            specialistId: specialist.id,
            locationId: availableLocation?.id || '',
            date: dateString,
            dateLabel: formatDateLabel(dateString, lang),
            time,
            service: getServiceName(service, lang),
            specialist: specialist.name,
            specialistSpecialty: getSpecialistSpecialty(specialist, lang),
            location: getLocationName(availableLocation, lang),
          });

          break;
        }
      });
    });
  }

  return slots.slice(0, limit);
};

export const getHomeData = async (lang = 'UA') => {
  const [popularServices, nearestSlots] = await Promise.all([
    getPopularServices(lang, 3),
    getNearestAvailableSlots(lang, 3),
  ]);

  return {
    popularServices,
    nearestSlots,
  };
};