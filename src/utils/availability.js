import { supabase } from '../supabaseClient';

const toMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const toTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const getDayOfWeekForDb = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const jsDay = date.getDay();

  return jsDay === 0 ? 7 : jsDay;
};

const isPastSlot = (dateString, timeString) => {
  const slotDate = new Date(`${dateString}T${timeString}:00`);
  const now = new Date();

  return slotDate <= now;
};

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

const isDateInApprovedTimeOff = async ({ specialistId, date }) => {
  if (!specialistId || !date) return false;

  /*
    Підтримуємо кілька статусів, бо в різних місцях проєкту могли бути:
    approved / confirmed / accepted.
    Головне — якщо відпустку затвердили, дата має стати недоступною.
  */
  const approvedStatuses = ['approved', 'confirmed', 'accepted'];

  const { data, error } = await supabase
    .from('time_off_requests')
    .select('id, start_date, end_date, status')
    .eq('specialist_id', Number(specialistId))
    .in('status', approvedStatuses)
    .lte('start_date', date)
    .gte('end_date', date);

  if (error) {
    console.warn('Time off check skipped:', error);
    return false;
  }

  return (data || []).length > 0;
};

export const getAvailableSlots = async ({
  specialistId,
  serviceId,
  locationId,
  date,
  slotStepMinutes = 30,
}) => {
  if (!specialistId || !serviceId || !locationId || !date) {
    return [];
  }

  /*
    1. Якщо дата попадає у затверджену відпустку — одразу повертаємо [].
    Через це день у клієнтському календарі має бути сірий і неактивний.
  */
  const isTimeOff = await isDateInApprovedTimeOff({
    specialistId,
    date,
  });

  if (isTimeOff) {
    return [];
  }

  const dayOfWeek = getDayOfWeekForDb(date);

  /*
    2. Беремо тривалість послуги.
  */
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', Number(serviceId))
    .maybeSingle();

  if (serviceError) {
    console.error('Service loading failed:', serviceError);
    throw serviceError;
  }

  const durationMinutes =
    Number(service?.duration_minutes) ||
    Number(service?.duration) ||
    30;

  /*
    3. Беремо активний графік спеціаліста саме для вибраної локації і дня тижня.
  */
  const { data: workingHours, error: workingHoursError } = await supabase
    .from('specialist_working_hours')
    .select('*')
    .eq('specialist_id', Number(specialistId))
    .eq('location_id', Number(locationId))
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (workingHoursError) {
    console.error('Working hours loading failed:', workingHoursError);
    throw workingHoursError;
  }

  if (!workingHours || workingHours.length === 0) {
    return [];
  }

  /*
    4. Беремо записи на цю дату, щоб не показувати зайняті слоти.
  */
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, service_id')
    .eq('specialist_id', Number(specialistId))
    .eq('location_id', Number(locationId))
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed']);

  if (appointmentsError) {
    console.error('Appointments loading failed:', appointmentsError);
    throw appointmentsError;
  }

  const appointmentServiceIds = [
    ...new Set(
      (appointments || [])
        .map((appointment) => appointment.service_id)
        .filter(Boolean)
    ),
  ];

  let appointmentServices = [];

  if (appointmentServiceIds.length > 0) {
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', appointmentServiceIds);

    if (servicesError) {
      console.warn('Appointment services loading skipped:', servicesError);
    } else {
      appointmentServices = servicesData || [];
    }
  }

  const busyRanges = (appointments || [])
    .map((appointment) => {
      const appointmentStart = toMinutes(appointment.appointment_time);

      if (appointmentStart === null) return null;

      const appointmentService = appointmentServices.find(
        (item) => Number(item.id) === Number(appointment.service_id)
      );

      const appointmentDuration =
        Number(appointmentService?.duration_minutes) ||
        Number(appointmentService?.duration) ||
        30;

      return {
        start: appointmentStart,
        end: appointmentStart + appointmentDuration,
      };
    })
    .filter(Boolean);

  /*
    5. Генеруємо слоти з графіка.
    Враховуємо:
    - початок/кінець робочого дня;
    - тривалість послуги;
    - перерву;
    - зайняті записи;
    - минулий час.
  */
  const slots = [];

  workingHours.forEach((workDay) => {
    const workStart = toMinutes(workDay.start_time);
    const workEnd = toMinutes(workDay.end_time);

    if (workStart === null || workEnd === null || workEnd <= workStart) {
      return;
    }

    const breakStart = toMinutes(workDay.break_start);
    const breakEnd = toMinutes(workDay.break_end);

    for (
      let slotStart = workStart;
      slotStart + durationMinutes <= workEnd;
      slotStart += Number(slotStepMinutes)
    ) {
      const slotEnd = slotStart + durationMinutes;
      const slotTime = toTimeString(slotStart);

      if (isPastSlot(date, slotTime)) {
        continue;
      }

      const overlapsBreak =
        breakStart !== null &&
        breakEnd !== null &&
        breakEnd > breakStart &&
        rangesOverlap(slotStart, slotEnd, breakStart, breakEnd);

      if (overlapsBreak) {
        continue;
      }

      const overlapsAppointment = busyRanges.some((range) =>
        rangesOverlap(slotStart, slotEnd, range.start, range.end)
      );

      if (overlapsAppointment) {
        continue;
      }

      slots.push(slotTime);
    }
  });

  return [...new Set(slots)].sort();
};

export const createAppointmentSafe = async ({
  clientId,
  serviceId,
  specialistId,
  locationId,
  date,
  time,
  status = 'pending',
  notes = null,
}) => {
  const availableSlots = await getAvailableSlots({
    specialistId,
    serviceId,
    locationId,
    date,
  });

  const normalizedTime = normalizeTime(time);

  if (!availableSlots.includes(normalizedTime)) {
    const error = new Error('SLOT_NOT_AVAILABLE');
    error.details = 'SLOT_NOT_AVAILABLE';
    throw error;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      client_id: clientId,
      service_id: Number(serviceId),
      specialist_id: Number(specialistId),
      location_id: Number(locationId),
      appointment_date: date,
      appointment_time: normalizedTime,
      status,
      client_notes: notes || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createAppointmentSafe failed:', error);
    throw error;
  }

  return data;
};