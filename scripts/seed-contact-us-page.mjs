#!/usr/bin/env node
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

const OUTLET_GROUPS = [
  { id: 'dining', label: 'Dining & Retail', cards: [
    { name: 'Tradewinds', blocks: [{ rows: [
      { dayRange: 'Sunday to Thursday', time: '8:00 AM – 9:00 PM', lastOrder: '(last order at 8:30 PM)' },
      { dayRange: 'Friday & Saturday',  time: '8:00 AM – 10:00 PM', lastOrder: '(last order at 9:30 PM)' },
    ] }] },
    { name: 'Union Bar', blocks: [{ rows: [
      { dayRange: 'Sunday to Thursday', time: '11:00 AM – 9:00 PM', lastOrder: '(last order at 8:30 PM)' },
      { dayRange: 'Friday to Sunday',   time: '11:00 AM – 9:30 PM', lastOrder: '(last order at 9:00 PM)' },
    ] }] },
    { name: 'The 2nd Floor', blocks: [
      { subtitle: 'Lunch',  rows: [{ dayRange: 'Tuesday to Sunday', time: '11:30 AM – 2:30 PM', lastOrder: '(last order at 2:00 PM)' }] },
      { subtitle: 'Dinner', rows: [{ dayRange: 'Tuesday to Sunday', time: '5:30 PM – 10:00 PM', lastOrder: '(last order at 9:30 PM)' }] },
    ] },
    { name: 'Essentials', blocks: [{ rows: [{ dayRange: 'Daily', time: '8:00 AM – 9:00 PM' }] }] },
    { name: 'Central',    blocks: [{ rows: [{ dayRange: 'Daily', time: '7:00 AM – 7:00 PM' }] }] },
    { name: 'The Gourmet Pantry', blocks: [{ rows: [
      { dayRange: 'Monday to Thursday', time: '11:00 AM – 8:00 PM' },
      { dayRange: 'Friday to Sunday',   time: '10:00 AM – 8:00 PM' },
    ] }] },
    { name: 'Grillhouse', blocks: [{ rows: [
      { dayRange: 'Sunday to Thursday', time: '11:00 AM – 9:00 PM', lastOrder: '(last order at 8:30 PM)' },
      { dayRange: 'Friday',             time: '11:00 AM – 9:30 PM', lastOrder: '(last order at 9:00 PM)' },
      { dayRange: 'Saturday',           time: '8:30 AM – 9:30 PM',  lastOrder: '(last order at 9:00 PM)' },
    ] }] },
  ] },
  { id: 'fitness', label: 'Fitness & Wellness', cards: [
    { name: 'Gym', blocks: [{ rows: [
      { dayRange: 'Monday to Friday',         time: '5:30 AM – 10:00 PM' },
      { dayRange: 'Saturday, Sunday & PH',    time: '6:00 AM – 9:00 PM' },
    ] }] },
    { name: 'Aquatics', blocks: [{ rows: [{ dayRange: 'Daily', time: '6:00 AM – 9:30 PM' }] }] },
    { name: 'Tennis',   blocks: [{ rows: [{ dayRange: 'Daily', time: '7:00 AM – 10:00 PM' }] }] },
    { name: 'Squash',   blocks: [{ rows: [{ dayRange: 'Daily', time: '6:00 AM – 10:00 PM' }] }] },
    { name: 'sên Spa', blocks: [{ rows: [
      { dayRange: 'Tuesday to Sunday', time: '10:00 AM – 9:00 PM' },
      { dayRange: 'Closed Mondays',    time: '' },
    ] }] },
    { name: 'Pilates Studio', blocks: [{ rows: [{ dayRange: 'By appointment', time: '' }] }] },
  ] },
  { id: 'kids', label: 'Kids', cards: [
    { name: 'The Quad', blocks: [{ rows: [
      { dayRange: 'Tuesday to Sunday', time: '9:00 AM – 7:00 PM' },
      { dayRange: 'Closed Mondays',    time: '' },
    ] }] },
    { name: 'The Quad Poolside', blocks: [{ rows: [{ dayRange: 'Daily',                time: '10:00 AM – 6:00 PM' }] }] },
    { name: 'The Quad Studios',  blocks: [{ rows: [{ dayRange: 'By class schedule',    time: '' }] }] },
    { name: 'The Hangout',       blocks: [{ rows: [{ dayRange: 'Tuesday to Sunday',    time: '12:00 PM – 9:00 PM' }] }] },
  ] },
  { id: 'thinkspace', label: 'Thinkspace & the Bowling Alley', cards: [
    { name: 'Thinkspace', blocks: [{ rows: [{ dayRange: 'Daily', time: '8:00 AM – 10:00 PM' }] }] },
    { name: 'Library',    blocks: [{ rows: [{ dayRange: 'Daily', time: '9:00 AM – 9:00 PM' }] }] },
    { name: 'Meeting Rooms & Business Center', blocks: [{ rows: [{ dayRange: 'Daily', time: '9:00 AM – 7:00 PM' }] }] },
    { name: 'The Bowling Alley', blocks: [{ rows: [
      { dayRange: 'Monday to Thursday', time: '12:00 PM – 7:00 PM' },
      { dayRange: 'Friday',             time: '12:00 PM – 8:00 PM' },
      { dayRange: 'Saturday',           time: '10:30 AM – 8:00 PM' },
      { dayRange: 'Sunday',             time: '9:30 AM – 7:00 PM' },
    ] }] },
  ] },
  { id: 'membership', label: 'Membership', cards: [
    { name: 'Member Services', blocks: [{ rows: [
      { dayRange: 'Monday to Friday',     time: '9:00 AM – 7:00 PM' },
      { dayRange: 'Saturday',             time: '9:00 AM – 5:00 PM' },
      { dayRange: 'Closed Sundays & PH',  time: '' },
    ] }] },
    { name: 'Membership Office', blocks: [{ rows: [
      { dayRange: 'Monday to Friday',  time: '9:00 AM – 7:00 PM' },
      { dayRange: 'Saturday',          time: '10:00 AM – 6:00 PM' },
      { dayRange: 'Closed Sundays',    time: '' },
    ] }] },
  ] },
];

async function upsertContactUsPage() {
  const data = {
    title: 'Contact Us',
    address: ['10 Claymore Hill', 'Singapore 229573'],
    operatingHours: [
      'Sunday to Thursday: 6:00 AM – 11:00 PM',
      'Friday, Saturday & Eve of PH: 6:00 AM – 12:00 AM',
    ],
    phone: '+65 6737-3411',
    email: 'info@amclub.org.sg',
    mapEmbedSrc: 'https://maps.google.com/maps?q=American%20Club%20Singapore&z=15&output=embed',
    outletGroups: OUTLET_GROUPS,
    talkToUsCta: {
      heading: 'Talk to Us',
      body: "Whether you're considering Membership, planning an event, or just have a question — we'd love to hear from you.",
      variant: 'default',
      ctas: [
        { label: 'Make an Enquiry',     href: 'mailto:info@amclub.org.sg', variant: 'primary' },
        { label: 'Membership Enquiry',  href: '/membership',               variant: 'outline' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /contact-us-page payload size:', JSON.stringify(data).length, 'chars'); return; }
  const r = await api(ctx, '/contact-us-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/1] Contact Us Page single type…');
  await upsertContactUsPage();
  console.log('  ✓ contact-us-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
