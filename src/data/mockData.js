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
// ==================== КАЛЕНДАР (тестові дані для лютого 2026) ====================

// ==================== ЧАСОВІ СЛОТИ (загальний список) ====================
export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:15', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:15', '18:30', '19:00'
];

export const getServicePopularity = () => {
  // 1. Рахуємо кількість записів на кожну послугу
  const appointmentCounts = {};
  appointments.forEach(app => {
    appointmentCounts[app.serviceId] = (appointmentCounts[app.serviceId] || 0) + 1;
  });

  // 2. Рахуємо середній рейтинг для кожної послуги через відгуки до спеціалістів
  // Спочатку зберемо всі відгуки до спеціалістів, які надають певну послугу
  const serviceRatings = {};
  const serviceRatingCounts = {};

  reviews.forEach(review => {
    // Знаходимо спеціаліста
    const specialist = specialists.find(s => s.id === review.specialistId);
    if (specialist) {
      // Знаходимо всі послуги цього спеціаліста
      specialist.serviceIds.forEach(serviceId => {
        if (!serviceRatings[serviceId]) {
          serviceRatings[serviceId] = 0;
          serviceRatingCounts[serviceId] = 0;
        }
        serviceRatings[serviceId] += review.rating;
        serviceRatingCounts[serviceId] += 1;
      });
    }
  });

  // 3. Обчислюємо фінальний скоринг популярності
  const popularity = {};
  
  services.forEach(service => {
    const id = service.id;
    const appointments = appointmentCounts[id] || 0;
    const avgRating = serviceRatingCounts[id] 
      ? (serviceRatings[id] / serviceRatingCounts[id]).toFixed(1) 
      : 0;
    
    // Комбінований скоринг: (кількість записів * 10) + (середній рейтинг * 2)
    // Можна налаштувати ваги під свої потреби
    popularity[id] = {
      appointments,
      avgRating: parseFloat(avgRating),
      score: appointments * 10 + (parseFloat(avgRating) || 0) * 2
    };
  });

  return popularity;
};
// ==================== СПЕЦІАЛІСТИ ===================
export const specialists = [
  {
    id: 1,
    name: 'Іваненко Марія',
    photo: '/images/doctors/ivanenko.jpg', // заглушка (потім замінити на реальний шлях)
    specialty: { UA: 'Фізичний терапевт', EN: 'Physical therapist' },
    experience: 7,
    description: {
      UA: 'Працює з болем у спині, посттравматичними станами та відновленням рухливості. Використовує доказові протоколи, адаптовані під рівень фізичної підготовки клієнта.',
      EN: 'Works with back pain, post-traumatic conditions and mobility restoration. Uses evidence-based protocols adapted to the client\'s physical fitness level.'
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
    locationIds: [1], // Ужгород, Центр
    serviceIds: [1, 3, 6], // Фізіотерапія, ЛФК, Електротерапія
    reviews: [
      {
        id: 1,
        clientName: 'Олена С.',
        date: '2 тижні тому',
        rating: 5,
        text: 'Після 4 занять біль значно зменшився. Дуже уважно пояснює вправи.'
      },
      {
        id: 2,
        clientName: 'Ігор М.',
        date: '1 місяць тому',
        rating: 4,
        text: 'Професійний підхід, але було кілька запізнень.'
      }
    ]
  },
  {
    id: 2,
    name: 'Коваль Андрій',
    photo: '/images/doctors/koval.jpg',
    specialty: { UA: 'Ортопед-травматолог', EN: 'Orthopedist-traumatologist' },
    experience: 10,
    description: {
      UA: 'Лікар вищої категорії. Спеціалізується на діагностиці та лікуванні захворювань опорно-рухового апарату, травмах та їх наслідках.',
      EN: 'Doctor of the highest category. Specializes in diagnosis and treatment of musculoskeletal diseases, injuries and their consequences.'
    },
    education: {
      UA: ['Національний медичний університет ім. Богомольця - ортопедія (2013)'],
      EN: ['Bogomolets National Medical University - Orthopedics (2013)']
    },
    certificates: ['Сучасна ортопедія (2020)', 'Травматологія (2022)', 'Ендопротезування (2021)'],
    directions: {
      UA: ['Консультації', 'Діагностика', 'Лікування суглобів', 'Травми'],
      EN: ['Consultations', 'Diagnostics', 'Joint treatment', 'Injuries']
    },
    locationIds: [1], // Ужгород, Центр
    serviceIds: [2, 5], // Масаж, Консультація ортопеда
    reviews: [
      {
        id: 3,
        clientName: 'Петро В.',
        date: '3 тижні тому',
        rating: 5,
        text: 'Дуже уважний лікар, призначив ефективне лікування.'
      }
    ]
  },
  {
    id: 3,
    name: 'Соловей Олена',
    photo: '/images/doctors/solovey.jpg',
    specialty: { UA: 'Масажист', EN: 'Massage therapist' },
    experience: 5,
    description: {
      UA: 'Спеціаліст з лікувального та спортивного масажу. Допомагає зняти м\'язове напруження, прискорити відновлення після тренувань та травм.',
      EN: 'Specialist in therapeutic and sports massage. Helps relieve muscle tension, speed up recovery after workouts and injuries.'
    },
    education: {
      UA: ['Курси масажу (2018)', 'Медичний коледж "Монада" (2015-2018)'],
      EN: ['Massage courses (2018)', 'Monada Medical College (2015-2018)']
    },
    certificates: ['Лікувальний масаж (2019)', 'Спортивний масаж (2020)', 'М\'якотканинні техніки (2022)'],
    directions: {
      UA: ['Лікувальний масаж', 'Спортивний масаж', 'Розслаблення', 'Антицелюлітний'],
      EN: ['Therapeutic massage', 'Sports massage', 'Relaxation', 'Anti-cellulite']
    },
    locationIds: [1, 2], // Працює в Центрі та Боздоші
    serviceIds: [1, 2, 6], // Фізіотерапія, Масаж, Електротерапія
    reviews: [
      {
        id: 4,
        clientName: 'Наталія К.',
        date: '1 тиждень тому',
        rating: 5,
        text: 'Чудовий масаж, після сеансу легкість у всьому тілі!'
      },
      {
        id: 5,
        clientName: 'Андрій С.',
        date: '2 тижні тому',
        rating: 5,
        text: 'Професіонал своєї справи. Допоміг з болем у спині після 3 сеансів.'
      }
    ]
  },
  {
    id: 4,
    name: 'Демченко Назар',
    photo: '/images/doctors/demchenko.jpg',
    specialty: { UA: 'Реабілітолог', EN: 'Rehabilitation specialist' },
    experience: 6,
    description: {
      UA: 'Спеціалізується на постопераційному відновленні та реабілітації після травм. Складає індивідуальні програми з урахуванням цілей пацієнта.',
      EN: 'Specializes in post-operative recovery and rehabilitation after injuries. Creates individual programs considering patient\'s goals.'
    },
    education: {
      UA: ['Національний університет фізичного виховання і спорту України - фізична реабілітація (2017)'],
      EN: ['National University of Physical Education and Sport of Ukraine - Physical Rehabilitation (2017)']
    },
    certificates: ['Сучасна реабілітація (2021)', 'Неврологічна реабілітація (2022)', 'Кінезіотейпування (2023)'],
    directions: {
      UA: ['Постопераційне відновлення', 'Реабілітація', 'ЛФК', 'Неврологічна реабілітація'],
      EN: ['Post-operative recovery', 'Rehabilitation', 'Physical therapy', 'Neurological rehabilitation']
    },
    locationIds: [1], // Ужгород, Центр
    serviceIds: [3, 4], // ЛФК, Консультація реабілітолога
    reviews: [
      {
        id: 6,
        clientName: 'Оксана Л.',
        date: '3 тижні тому',
        rating: 5,
        text: 'Дуже допоміг після операції на коліні. Програма вправ ефективна, стан покращився швидше, ніж очікувала.'
      }
    ]
  }
];
// ==================== КАЛЕНДАР ====================
export const calendarData = {
  month: { UA: 'Лютий 2026', EN: 'February 2026' },
  days: [
    { day: 22, slots: [] },
    { day: 23, slots: [] },
    { day: 24, slots: ['09:00', '10:30', '12:15', '16:30', '18:15'] },
    { day: 25, slots: [] },
    { day: 26, slots: [] },
    { day: 27, slots: [] },
    { day: 28, slots: [] },
    { day: 15, slots: [] },
    { day: 16, slots: [] },
    { day: 17, slots: [] },
    { day: 18, slots: [] },
    { day: 19, slots: [] },
    { day: 20, slots: [] },
    { day: 21, slots: [] },
    { day: 8, slots: [] },
    { day: 9, slots: [] },
    { day: 10, slots: [] },
    { day: 11, slots: [] },
    { day: 12, slots: [] },
    { day: 13, slots: [] },
    { day: 14, slots: [] },
  ]
};

// ==================== ЛОКАЦІЇ ====================

export const locations = [
  {
    id: 1,
    name: { UA: 'Ужгород, Центр', EN: 'Uzhhorod, Center' },
    address: 'пл. Театральна, 3',
    phone: '+38 (099) 123-45-67',
    email: 'center@rehabline.ua',
    hours: {
      UA: 'Пн-Пт 08:00-20:00 • Сб 09:00-15:00',
      EN: 'Mon-Fri 08:00-20:00 • Sat 09:00-15:00'
    },
    coordinates: { lat: 48.6208, lng: 22.2879 } // додайте це
  },
  {
    id: 2,
    name: { UA: 'Ужгород, Боздош', EN: 'Uzhhorod, Bozdosh' },
    address: 'вул. Миру, 18',
    phone: '+38 (099) 234-56-78',
    email: 'bozdosh@rehabline.ua',
    hours: {
      UA: 'Пн-Сб 09:00-19:00',
      EN: 'Mon-Sat 09:00-19:00'
    },
    coordinates: { lat: 48.6312, lng: 22.2681 } // додайте це
  }
];
// ==================== КОНТАКТИ ====================
export const contactInfo = {
  hotline: '+38 (0XX) XXX-XX-XX',
  email: 'support@rehabline.ua',
  hours: {
    UA: 'Пн-Пт 08:00-20:00 • Сб 09:00-15:00',
    EN: 'Mon-Fri 08:00-20:00 • Sat 09:00-15:00'
  },
  messengers: {
    telegram: 'https://t.me/rehabline',
    viber: 'https://viber.com/rehabline',
    whatsapp: 'https://wa.me/380XXXXXXXXX'
  }
};
// ==================== КЛІЄНТИ ====================
// У масив clients додайте поле role
export const clients = [
  {
    id: 1,
    name: 'Бурдяк Олена',
    email: 'burdyak.olena@gmail.com',
    phone: '+380 99 123 45 67',
    language: 'UA',
    timezone: 'Europe/Kiev',
    birthDate: '1990-05-15',
    role: 'client' // client, specialist, admin
  },
  // ...
];

// Додаємо нотатки лікаря до записів
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
    specialistNotes: 'Рекомендовано ЛФК, уникати навантажень. Наступний візит через 2 тижні.', // нове поле
  },
  // ... інші
];

// Додаємо рецепти/рекомендації
export const prescriptions = [
  {
    id: 1,
    clientId: 1,
    appointmentId: 1,
    title: { UA: 'План ЛФК', EN: 'Physical therapy plan' },
    description: { UA: 'Вправи для зміцнення м\'язів спини: ...', EN: 'Exercises to strengthen back muscles: ...' },
    fileUrl: '/files/lfk_plan.pdf', // опціонально
    date: '2026-02-10',
  },
  // ... інші
];

// Додаємо відгуки (вже є)