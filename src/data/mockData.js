// ==================== ПОСЛУГИ ====================
export const services = [
  {
    id: 1,
    name: { UA: 'Фізіотерапія (сесія)', EN: 'Physiotherapy (session)' },
    duration: '45 хв',
    price: 600,
    category: { UA: 'Реабілітація', EN: 'Rehabilitation' },
    description: {
      UA: 'Сеанс фізіотерапії для зменшення болю, покращення рухливості та відновлення після травм. Програма підбирається індивідуально.',
      EN: 'Physiotherapy session to reduce pain, improve mobility and recover after injuries. The program is tailored individually.'
    },
    indications: {
      UA: ['біль у спині/суглобах', 'відновлення після операцій', 'посттравматичні стани', "м'язові спазми"],
      EN: ['back/joint pain', 'post-operative recovery', 'post-traumatic conditions', 'muscle spasms']
    },
    tags: { UA: 'Після травм', EN: 'Post-injury' },
    locationIds: [1, 2],
    specialistIds: [1, 3]
  },
  {
    id: 2,
    name: { UA: 'Масаж лікувальний', EN: 'Therapeutic massage' },
    duration: '30 хв',
    price: 450,
    category: { UA: 'Масаж', EN: 'Massage' },
    description: {
      UA: 'Лікувальний масаж для зняття м\'язового напруження, покращення кровообігу та загального розслаблення.',
      EN: 'Therapeutic massage to relieve muscle tension, improve blood circulation and general relaxation.'
    },
    indications: {
      UA: ['біль у спині', 'стрес', 'м\'язова напруга'],
      EN: ['back pain', 'stress', 'muscle tension']
    },
    tags: { UA: 'Біль у спині', EN: 'Back pain' },
    locationIds: [1],
    specialistIds: [2, 3]
  },
  {
    id: 3,
    name: { UA: 'ЛФК / кінезіотерапія', EN: 'Physical therapy / kinesiotherapy' },
    duration: '60 хв',
    price: 650,
    category: { UA: 'Реабілітація', EN: 'Rehabilitation' },
    description: {
      UA: 'Індивідуальні заняття лікувальною фізкультурою для відновлення рухливості, зміцнення м\'язів та покращення координації.',
      EN: 'Individual physical therapy sessions to restore mobility, strengthen muscles and improve coordination.'
    },
    indications: {
      UA: ['порушення постави', 'слабкість м\'язів', 'після травм'],
      EN: ['posture disorders', 'muscle weakness', 'post-injury']
    },
    tags: { UA: 'Відновлення', EN: 'Recovery' },
    locationIds: [1, 2],
    specialistIds: [1, 4]
  },
  {
    id: 4,
    name: { UA: 'Консультація реабілітолога', EN: 'Rehabilitation consultation' },
    duration: '45 хв',
    price: 550,
    category: { UA: 'Консультація', EN: 'Consultation' },
    description: {
      UA: 'Первинна консультація реабілітолога з оцінкою стану, визначенням проблеми та складанням індивідуального плану лікування.',
      EN: 'Initial consultation with a rehabilitation specialist to assess the condition, identify the problem and create an individual treatment plan.'
    },
    indications: {
      UA: ['підбір програми відновлення', 'оцінка стану', 'консультація'],
      EN: ['choosing a recovery program', 'condition assessment', 'consultation']
    },
    tags: { UA: 'План лікування', EN: 'Treatment plan' },
    locationIds: [1],
    specialistIds: [4]
  },
  {
    id: 5,
    name: { UA: 'Консультація ортопеда', EN: 'Orthopedist consultation' },
    duration: '30 хв',
    price: 700,
    category: { UA: 'Медицина', EN: 'Medicine' },
    description: {
      UA: 'Консультація лікаря-ортопеда з діагностикою опорно-рухового апарату та призначенням лікування.',
      EN: 'Consultation with an orthopedist with diagnosis of the musculoskeletal system and prescription of treatment.'
    },
    indications: {
      UA: ['біль у суглобах', 'проблеми з хребтом', 'порушення постави'],
      EN: ['joint pain', 'spine problems', 'posture disorders']
    },
    tags: { UA: 'Діагностика', EN: 'Diagnostics' },
    locationIds: [1],
    specialistIds: [2]
  },
  {
    id: 6,
    name: { UA: 'Електротерапія', EN: 'Electrotherapy' },
    duration: '20 хв',
    price: 350,
    category: { UA: 'Фізіо', EN: 'Physio' },
    description: {
      UA: 'Фізіотерапевтична процедура з використанням електричного струму для знеболення та стимуляції м\'язів.',
      EN: 'Physiotherapy procedure using electric current for pain relief and muscle stimulation.'
    },
    indications: {
      UA: ['біль', 'м\'язові спазми', 'набряки'],
      EN: ['pain', 'muscle spasms', 'swelling']
    },
    tags: { UA: 'Фізіо', EN: 'Physio' },
    locationIds: [1, 2],
    specialistIds: [1, 3]
  }
];

// ==================== СПЕЦІАЛІСТИ ====================
export const specialists = [
  {
    id: 1,
    name: 'Іваненко Марія',
    specialty: { UA: 'Фізичний терапевт', EN: 'Physical therapist' },
    experience: 7,
    description: {
      UA: 'Працює з болем у спині, посттравматичними станами та відновленням рухливості. Використовує доказові протоколи.',
      EN: 'Works with back pain, post-traumatic conditions and mobility restoration. Uses evidence-based protocols.'
    },
    education: {
      UA: ['Львівський нац. мед. університет - фізична терапія (2016)'],
      EN: ['Lviv National Medical University - Physical Therapy (2016)']
    },
    certificates: ['Manual Therapy Basics (2021)', 'Evidence-Based Rehab (2023)'],
    directions: {
      UA: ['Фізіотерапія', 'ЛФК', 'Посттравма', 'Сколіоз', 'Постопераційне відновлення'],
      EN: ['Physiotherapy', 'Physical therapy', 'Post-trauma', 'Scoliosis', 'Post-operative recovery']
    },
    locationIds: [1],
    serviceIds: [1, 3, 6],
    reviews: [
      {
        id: 1,
        clientName: 'Олена С.',
        date: '2 тижні тому',
        rating: 5,
        text: 'Після 4 занять біль значно зменшився. Дуже уважно пояснює вправи.'
      }
    ]
  },
  {
    id: 2,
    name: 'Коваль Андрій',
    specialty: { UA: 'Ортопед-травматолог', EN: 'Orthopedist-traumatologist' },
    experience: 10,
    description: {
      UA: 'Лікар вищої категорії. Спеціалізується на діагностиці та лікуванні захворювань опорно-рухового апарату.',
      EN: 'Doctor of the highest category. Specializes in diagnosis and treatment of musculoskeletal diseases.'
    },
    education: {
      UA: ['Національний медичний університет - ортопедія (2013)'],
      EN: ['National Medical University - Orthopedics (2013)']
    },
    certificates: ['Сучасна ортопедія (2020)', 'Травматологія (2022)'],
    directions: {
      UA: ['Консультації', 'Діагностика', 'Лікування суглобів'],
      EN: ['Consultations', 'Diagnostics', 'Joint treatment']
    },
    locationIds: [1],
    serviceIds: [2, 5]
  },
  {
    id: 3,
    name: 'Соловей Олена',
    specialty: { UA: 'Масажист', EN: 'Massage therapist' },
    experience: 5,
    description: {
      UA: 'Спеціаліст з лікувального та спортивного масажу. Допомагає зняти м\'язове напруження та прискорити відновлення.',
      EN: 'Specialist in therapeutic and sports massage. Helps relieve muscle tension and speed up recovery.'
    },
    education: {
      UA: ['Курси масажу (2018)', 'Медичний коледж'],
      EN: ['Massage courses (2018)', 'Medical College']
    },
    certificates: ['Лікувальний масаж (2019)', 'Спортивний масаж (2020)'],
    directions: {
      UA: ['Лікувальний масаж', 'Спортивний масаж', 'Розслаблення'],
      EN: ['Therapeutic massage', 'Sports massage', 'Relaxation']
    },
    locationIds: [1, 2],
    serviceIds: [1, 2, 6]
  },
  {
    id: 4,
    name: 'Демченко Назар',
    specialty: { UA: 'Реабілітолог', EN: 'Rehabilitation specialist' },
    experience: 6,
    description: {
      UA: 'Спеціалізується на постопераційному відновленні та реабілітації після травм. Складає індивідуальні програми.',
      EN: 'Specializes in post-operative recovery and rehabilitation after injuries. Creates individual programs.'
    },
    education: {
      UA: ['Національний університет фізичного виховання - реабілітація (2017)'],
      EN: ['National University of Physical Education - Rehabilitation (2017)']
    },
    certificates: ['Сучасна реабілітація (2021)', 'Неврологічна реабілітація (2022)'],
    directions: {
      UA: ['Постопераційне відновлення', 'Реабілітація', 'ЛФК'],
      EN: ['Post-operative recovery', 'Rehabilitation', 'Physical therapy']
    },
    locationIds: [1],
    serviceIds: [3, 4]
  }
];

// ==================== ЛОКАЦІЇ ====================
export const locations = [
  {
    id: 1,
    name: { UA: 'Ужгород, Центр', EN: 'Uzhhorod, Center' },
    address: 'пл. Театральна, 3',
    phone: '+38 (0XX) XXX-XX-XX',
    email: 'center@rehabline.ua',
    hours: {
      UA: 'Пн-Пт 08:00-20:00 • Сб 09:00-15:00',
      EN: 'Mon-Fri 08:00-20:00 • Sat 09:00-15:00'
    },
    coordinates: { lat: 48.6208, lng: 22.2879 }
  },
  {
    id: 2,
    name: { UA: 'Ужгород, Боздош', EN: 'Uzhhorod, Bozdosh' },
    address: 'вул. Миру, 18',
    phone: '+38 (0XX) XXX-XX-XX',
    email: 'bozdosh@rehabline.ua',
    hours: {
      UA: 'Пн-Сб 09:00-19:00',
      EN: 'Mon-Sat 09:00-19:00'
    },
    coordinates: { lat: 48.6312, lng: 22.2681 }
  }
];

// ==================== ЗАПИСИ (Appointments) ====================
export const appointments = [
  {
    id: 1,
    clientId: 1,
    serviceId: 1,
    specialistId: 1,
    locationId: 1,
    date: '2026-02-10',
    time: '09:00',
    status: 'confirmed',
    clientNotes: 'Біль у попереку після тренування',
    specialistNotes: ''
  },
  {
    id: 2,
    clientId: 1,
    serviceId: 3,
    specialistId: 1,
    locationId: 1,
    date: '2026-02-12',
    time: '18:15',
    status: 'pending',
    clientNotes: '',
    specialistNotes: ''
  },
  {
    id: 3,
    clientId: 1,
    serviceId: 2,
    specialistId: 3,
    locationId: 2,
    date: '2026-02-18',
    time: '10:30',
    status: 'confirmed',
    clientNotes: '',
    specialistNotes: ''
  },
  {
    id: 4,
    clientId: 2,
    serviceId: 1,
    specialistId: 1,
    locationId: 1,
    date: '2026-02-10',
    time: '10:30',
    status: 'confirmed',
    clientNotes: '',
    specialistNotes: ''
  },
  {
    id: 5,
    clientId: 3,
    serviceId: 2,
    specialistId: 2,
    locationId: 1,
    date: '2026-02-10',
    time: '12:15',
    status: 'pending',
    clientNotes: 'Сильний біль у шиї',
    specialistNotes: ''
  }
];

// ==================== КЛІЄНТИ ====================
export const clients = [
  {
    id: 1,
    name: 'Бурдяк Олена',
    email: 'burdyak.olena@gmail.com',
    phone: '+380 99 123 45 67',
    language: 'UA',
    timezone: 'Europe/Kiev',
    birthDate: '1990-05-15'
  },
  {
    id: 2,
    name: 'Мельник Ірина',
    email: 'iryna.m@gmail.com',
    phone: '+380 50 234 56 78',
    language: 'UA',
    timezone: 'Europe/Kiev',
    birthDate: '1985-08-22'
  },
  {
    id: 3,
    name: 'Климчук Сергій',
    email: 's.klymchuk@ukr.net',
    phone: '+380 67 345 67 89',
    language: 'UA',
    timezone: 'Europe/Kiev',
    birthDate: '1978-03-10'
  }
];

// ==================== ВІДГУКИ ====================
export const reviews = [
  {
    id: 1,
    clientId: 1,
    specialistId: 1,
    appointmentId: 1,
    rating: 5,
    comment: 'Після 4 занять біль значно зменшився. Дуже уважно пояснює вправи.',
    date: '2026-02-15'
  },
  {
    id: 2,
    clientId: 2,
    specialistId: 1,
    appointmentId: 4,
    rating: 4,
    comment: 'Професійний підхід. Рекомендую.',
    date: '2026-02-12'
  }
];

// ==================== ГРАФІК РОБОТИ (для спеціалістів) ====================
export const schedules = [
  {
    specialistId: 1,
    dayOfWeek: 1, // понеділок
    startTime: '09:00',
    endTime: '18:00',
    isWorking: true
  },
  {
    specialistId: 1,
    dayOfWeek: 2, // вівторок
    startTime: '09:00',
    endTime: '18:00',
    isWorking: true
  },
  {
    specialistId: 1,
    dayOfWeek: 3, // середа
    startTime: '09:00',
    endTime: '18:00',
    isWorking: true
  },
  {
    specialistId: 1,
    dayOfWeek: 4, // четвер
    startTime: '09:00',
    endTime: '18:00',
    isWorking: true
  },
  {
    specialistId: 1,
    dayOfWeek: 5, // п'ятниця
    startTime: '09:00',
    endTime: '18:00',
    isWorking: true
  },
  // ... можна додати для інших спеціалістів
];

// ==================== ВИКЛЮЧЕННЯ (відпустки) ====================
export const exceptions = [
  {
    specialistId: 1,
    date: '2026-02-24',
    isAvailable: false,
    reason: 'Відпустка'
  }
];

// ==================== ЧЕРГА ОЧІКУВАННЯ ====================
export const waitlist = [
  {
    id: 1,
    clientId: 3,
    serviceId: 1,
    locationId: 1,
    preferredDays: 'Вт-Чт 08:00-12:00',
    status: 'active'
  }
];

// ==================== НАЛАШТУВАННЯ (глобальні) ====================
export const settings = {
  bufferBetweenAppointments: 10, // хвилин
  cancellationRule: 'Не пізніше 12 год',
  slotStep: 15, // хвилин
  reminders: [
    { time: 24, unit: 'hours', channel: 'email' },
    { time: 2, unit: 'hours', channel: 'sms' }
  ],
  templates: {
    confirmation: {
      UA: 'Вітаємо, {clientName}! Ваш запис на {serviceName} підтверджено. Дата: {date} Час: {time} Локація: {location}',
      EN: 'Hello {clientName}! Your appointment for {serviceName} is confirmed. Date: {date} Time: {time} Location: {location}'
    },
    reminder24: {
      UA: 'Нагадуємо про запис завтра о {time}',
      EN: 'Reminder about your appointment tomorrow at {time}'
    }
  }
};

// ==================== АУДИТ-ЛОГ ====================
export const auditLog = [
  {
    id: 1,
    timestamp: '2026-02-10T09:12:00',
    user: 'Реєстратор',
    action: 'Скасовано запис',
    object: '#A-1024'
  },
  {
    id: 2,
    timestamp: '2026-02-10T09:30:00',
    user: 'Адмін',
    action: 'Змінено тривалість послуги',
    object: 'Фізіотерапія'
  }
];