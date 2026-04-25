export interface ContactInfo {
  address: string[];
  operatingHours: string[];
  phone: string;
  email: string;
  mapEmbedSrc: string;
}

export interface OutletScheduleRow {
  dayRange: string;
  time: string;
  lastOrder?: string;
}

export interface OutletScheduleBlock {
  subtitle?: string;
  rows: OutletScheduleRow[];
}

export interface OutletCard {
  name: string;
  blocks: OutletScheduleBlock[];
}

export interface OutletGroup {
  id: string;
  label: string;
  cards: OutletCard[];
}

export const contactInfo: ContactInfo = {
  address: ['10 Claymore Hill', 'Singapore 229573'],
  operatingHours: [
    'Sunday to Thursday: 6:00 a.m. – 11:00 p.m.',
    'Friday, Saturday & Eve of PH: 6:00 a.m. – 12:00 a.m.',
  ],
  phone: '+65 6737-3411',
  email: 'info@amclub.org.sg',
  mapEmbedSrc:
    'https://maps.google.com/maps?q=American%20Club%20Singapore&z=15&output=embed',
};

export const outletGroups: OutletGroup[] = [
  {
    id: 'dining',
    label: 'Dining & Retail',
    cards: [
      {
        name: 'Tradewinds',
        blocks: [
          {
            rows: [
              { dayRange: 'Sunday to Thursday', time: '8:00 a.m. – 9:00 p.m.', lastOrder: '(last order at 8:30 p.m.)' },
              { dayRange: 'Friday & Saturday', time: '8:00 a.m. – 10:00 p.m.', lastOrder: '(last order at 9:30 p.m.)' },
            ],
          },
        ],
      },
      {
        name: 'Union Bar',
        blocks: [
          {
            rows: [
              { dayRange: 'Sunday to Thursday', time: '11:00 a.m. – 9:00 p.m.', lastOrder: '(last order at 8:30 p.m.)' },
              { dayRange: 'Friday to Sunday', time: '11:00 a.m. – 9:30 p.m.', lastOrder: '(last order at 9:00 p.m.)' },
            ],
          },
        ],
      },
      {
        name: 'The 2nd Floor',
        blocks: [
          {
            subtitle: 'Lunch',
            rows: [
              { dayRange: 'Tuesday to Sunday', time: '11:30 a.m. – 2:30 p.m.', lastOrder: '(last order at 2:00 p.m.)' },
            ],
          },
          {
            subtitle: 'Dinner',
            rows: [
              { dayRange: 'Tuesday to Sunday', time: '5:30 p.m. – 10:00 p.m.', lastOrder: '(last order at 9:30 p.m.)' },
            ],
          },
        ],
      },
      {
        name: 'Essentials',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '8:00 a.m. – 9:00 p.m.' }] }],
      },
      {
        name: 'Central',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '7:00 a.m. – 7:00 p.m.' }] }],
      },
      {
        name: 'The Gourmet Pantry',
        blocks: [
          {
            rows: [
              { dayRange: 'Monday to Thursday', time: '11:00 a.m. – 8:00 p.m.' },
              { dayRange: 'Friday to Sunday', time: '10:00 a.m. – 8:00 p.m.' },
            ],
          },
        ],
      },
      {
        name: 'Grillhouse',
        blocks: [
          {
            rows: [
              { dayRange: 'Sunday to Thursday', time: '11:00 a.m. – 9:00 p.m.', lastOrder: '(last order at 8:30 p.m.)' },
              { dayRange: 'Friday to Sunday', time: '11:00 a.m. – 9:30 p.m.', lastOrder: '(last order at 9:00 p.m.)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness & Wellness',
    cards: [
      {
        name: 'Gym',
        blocks: [
          {
            rows: [
              { dayRange: 'Monday to Friday', time: '5:30 a.m. – 10:00 p.m.' },
              { dayRange: 'Saturday, Sunday & PH', time: '6:00 a.m. – 9:00 p.m.' },
            ],
          },
        ],
      },
      {
        name: 'Aquatics',
        blocks: [
          {
            rows: [
              { dayRange: 'Daily', time: '6:00 a.m. – 9:30 p.m.' },
            ],
          },
        ],
      },
      {
        name: 'Tennis',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '7:00 a.m. – 10:00 p.m.' }] }],
      },
      {
        name: 'Squash',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '6:00 a.m. – 10:00 p.m.' }] }],
      },
      {
        name: 'sên Spa',
        blocks: [
          {
            rows: [
              { dayRange: 'Tuesday to Sunday', time: '10:00 a.m. – 9:00 p.m.' },
              { dayRange: 'Closed Mondays', time: '' },
            ],
          },
        ],
      },
      {
        name: 'Pilates Studio',
        blocks: [{ rows: [{ dayRange: 'By appointment', time: '' }] }],
      },
    ],
  },
  {
    id: 'kids',
    label: 'Kids',
    cards: [
      {
        name: 'The Quad',
        blocks: [
          {
            rows: [
              { dayRange: 'Tuesday to Sunday', time: '9:00 a.m. – 7:00 p.m.' },
              { dayRange: 'Closed Mondays', time: '' },
            ],
          },
        ],
      },
      {
        name: 'The Quad Poolside',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '10:00 a.m. – 6:00 p.m.' }] }],
      },
      {
        name: 'The Quad Studios',
        blocks: [{ rows: [{ dayRange: 'By class schedule', time: '' }] }],
      },
      {
        name: 'The Hangout',
        blocks: [
          {
            rows: [
              { dayRange: 'Tuesday to Sunday', time: '12:00 p.m. – 9:00 p.m.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'thinkspace',
    label: 'Thinkspace & the Bowling Alley',
    cards: [
      {
        name: 'Thinkspace',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '8:00 a.m. – 10:00 p.m.' }] }],
      },
      {
        name: 'Library',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '9:00 a.m. – 9:00 p.m.' }] }],
      },
      {
        name: 'Meeting Rooms & Business Center',
        blocks: [{ rows: [{ dayRange: 'Daily', time: '9:00 a.m. – 7:00 p.m.' }] }],
      },
      {
        name: 'The Bowling Alley',
        blocks: [
          {
            rows: [
              { dayRange: 'Monday to Thursday', time: '12:00 p.m. – 7:00 p.m.' },
              { dayRange: 'Friday', time: '12:00 p.m. – 8:00 p.m.' },
              { dayRange: 'Saturday', time: '10:30 a.m. – 8:00 p.m.' },
              { dayRange: 'Sunday', time: '9:30 a.m. – 7:00 p.m.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'membership',
    label: 'Membership',
    cards: [
      {
        name: 'Member Services',
        blocks: [
          {
            rows: [
              { dayRange: 'Monday to Friday', time: '9:00 a.m. – 7:00 p.m.' },
              { dayRange: 'Saturday', time: '9:00 a.m. – 5:00 p.m.' },
              { dayRange: 'Closed Sundays & PH', time: '' },
            ],
          },
        ],
      },
      {
        name: 'Membership Office',
        blocks: [
          {
            rows: [
              { dayRange: 'Monday to Friday', time: '12:00 p.m. – 7:00 p.m.' },
              { dayRange: 'Saturday', time: '1:00 p.m. – 8:00 p.m.' },
              { dayRange: 'Closed Sundays', time: '' },
            ],
          },
        ],
      },
    ],
  },
];
