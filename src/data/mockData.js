export const services = [
  {
    id: 1,
    name: { UA: 'Фізіотерапія (сесія)', EN: 'Physiotherapy (session)' },
    duration: '45 хв',
    price: 600,
    category: { UA: 'Реабілітація', EN: 'Rehabilitation' },
    description: {
      UA: 'Сеанс фізіотерапії для зменшення болю та відновлення рухливості.',
      EN: 'Physiotherapy session to reduce pain and restore mobility.'
    },
    indications: {
      UA: ['біль у спині', 'після травм'],
      EN: ['back pain', 'post-injury']
    }
  },
  {
    id: 2,
    name: { UA: 'Масаж лікувальний', EN: 'Therapeutic massage' },
    duration: '30 хв',
    price: 450,
    category: { UA: 'Масаж', EN: 'Massage' },
    description: {
      UA: 'Лікувальний масаж для зняття м’язового напруження.',
      EN: 'Therapeutic massage to relieve muscle tension.'
    },
    indications: {
      UA: ['біль у спині', 'стрес'],
      EN: ['back pain', 'stress']
    }
  }
];

export const specialists = [
  {
    id: 1,
    name: 'Іваненко Марія',
    specialty: { UA: 'Фізичний терапевт', EN: 'Physical therapist' },
    experience: 7
  },
  {
    id: 2,
    name: 'Коваль Андрій',
    specialty: { UA: 'Ортопед-травматолог', EN: 'Orthopedist' },
    experience: 10
  }
];

export const locations = [
  {
    id: 1,
    name: { UA: 'Ужгород, Центр', EN: 'Uzhhorod, Center' },
    address: 'пл. Театральна, 3',
    phone: '+38 (0XX) XXX-XX-XX'
  },
  {
    id: 2,
    name: { UA: 'Ужгород, Боздош', EN: 'Uzhhorod, Bozdosh' },
    address: 'вул. Миру, 18',
    phone: '+38 (0XX) XXX-XX-XX'
  }
];