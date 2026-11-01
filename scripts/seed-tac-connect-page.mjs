#!/usr/bin/env node
/**
 * Seed script: /membership/tac-connect
 *
 *   1. FAQ category "TAC Connect" + its faq-items (shared with /faq and the
 *      chatbot knowledge base)
 *   2. The `tac-connect-page` single type (hero, store links, help contacts,
 *      feature cards, steps, FAQ category link)
 *   3. Header nav: adds "TAC Connect" under Membership → Programs (idempotent
 *      patch of the live header — does not clobber other admin edits)
 *
 * Environment-specific links are flags so each env can differ without code
 * changes (they stay editable in /admin afterwards):
 *   --ios-url=<App Store URL>        (omit → keep current value; none → no iOS button / QR)
 *   --android-url=<Google Play URL>  (omit → keep current value; none → no Android button / QR)
 *   --portal-url=<member portal URL> (omit → keep current value, else https://members.amclub.org.sg/)
 *   --skip-nav                       don't touch the header
 *
 * Rollout: dev + uat first. Prod 404s until this script is run there, so the
 * page, nav link and sitemap entry all stay off prod until then.
 *
 * Usage:
 *   node scripts/seed-tac-connect-page.mjs --env=dev [--dry-run]
 *
 * Images are not supplied yet — the page renders neutral placeholders for the
 * hero, feature cards and step icons until they are uploaded in /admin (or
 * added under media/membership/tac-connect/ and wired here).
 */

import { initEnv, api as rawApi, findOneBySlug as rawFindOneBySlug, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();
const api = (path, opts) => rawApi(ctx, path, opts);
const findOneBySlug = (plural, slug) => rawFindOneBySlug(ctx, plural, slug);

const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const DEFAULT_PORTAL_URL = 'https://members.amclub.org.sg/';
const SKIP_NAV = process.argv.includes('--skip-nav');

const PAGE_PATH = '/membership/tac-connect';
const FAQ_CATEGORY = {
  name: 'TAC Connect',
  slug: 'tac-connect',
  description: 'The TAC Connect member app and member portal — logging in, bookings and help.',
  displayOrder: 7,
};

// [question, answer] — order follows the array.
const FAQ_ITEMS = [
  ['What is TAC Connect?', 'TAC Connect is the Club’s member app. It brings bookings, your account and Club information together in one place. There’s also a TAC Connect member portal for when you’re on a computer.'],
  ['What can I do on TAC Connect?', 'Check your account and transactions, make bookings for events, facilities and the spa, discover your member privileges, find important Club contacts and share your feedback.'],
  ['Where can I download the app?', 'TAC Connect is available on the Apple App Store for iOS devices and the Google Play Store for Android devices.'],
  ['Can I use TAC Connect on my computer?', 'Yes. Log in to the TAC Connect member portal at members.amclub.org.sg. It offers many of the same features as the app, like bookings and your account. Google Chrome is the recommended browser.'],
  ['How do I log in?', 'Your username is your 7-character Membership ID (for example, X123400 – the first character must be a capital letter). Your first password is sent to your registered email address.'],
  ['What happens the first time I log in?', 'You’ll be asked to change your password and choose a security question and answer for future password resets.'],
  ['Do I need to set up the app and the member portal separately?', 'No. You only set up your password and security question once. Your settings work on both the app and the member portal, so there’s no need to repeat it when you switch.'],
  ['I forgot my password. What should I do?', 'You can reset your password using the security question and answer you chose at your first login.'],
  ['Where can I get help?', 'Submit an enquiry via Talk2us! and choose “TAC Connect”, chat with Eli on the Club website, or speak to the Club’s front desk.'],
];

const textToBlocks = (text) => [{ type: 'paragraph', children: [{ type: 'text', text }] }];

// Slugs are namespaced so generic questions ("Where can I get help?") never
// collide with — and overwrite — existing general FAQ entries.
const faqSlug = (question) =>
  `tac-connect-${question.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

async function upsertBySlug(plural, slug, payload) {
  if (DRY) { console.log(`  [dry] upsert ${plural}: ${slug}`); return { documentId: `dry-${slug}` }; }
  const existing = await findOneBySlug(plural, slug);
  const r = existing
    ? await api(`/${plural}/${existing.documentId}`, { method: 'PUT', body: { data: payload } })
    : await api(`/${plural}`, { method: 'POST', body: { data: payload } });
  return r.data;
}

async function seedFaq() {
  console.log('\n── FAQ ──');
  const category = await upsertBySlug('faq-categories', FAQ_CATEGORY.slug, FAQ_CATEGORY);
  for (const [i, [question, answer]] of FAQ_ITEMS.entries()) {
    await upsertBySlug('faq-items', faqSlug(question), {
      question,
      slug: faqSlug(question),
      order: i + 1,
      category: 'membership',
      faqCategory: category.documentId,
      answer: textToBlocks(answer),
    });
  }
  console.log(`  ✓ category "${FAQ_CATEGORY.name}" + ${FAQ_ITEMS.length} items`);
  return category;
}

const FEATURE_CARDS = [
  'Bookings',
  'Account & Transactions',
  'Member Privileges',
  'Club Contacts',
  'Share Feedback',
];

async function seedPage(category) {
  console.log('\n── tac-connect-page ──');
  // Re-running must not wipe links an editor set in /admin: an omitted flag
  // keeps whatever the live entry already has.
  const current = DRY ? null : (await api('/tac-connect-page'))?.data;
  const currentStore = (platform) => current?.appDownload?.links?.find((l) => l.platform === platform)?.url ?? null;
  const IOS_URL = flag('ios-url') ?? currentStore('ios');
  const ANDROID_URL = flag('android-url') ?? currentStore('android');
  const PORTAL_URL =
    flag('portal-url') ?? current?.ctas?.find((c) => c.label === 'Member Portal')?.href ?? DEFAULT_PORTAL_URL;
  const storeLinks = [
    { platform: 'ios', label: 'Download for iOS', url: IOS_URL },
    { platform: 'android', label: 'Download for Android', url: ANDROID_URL },
  ];
  const data = {
    title: 'TAC Connect',
    heading: 'TAC Connect',
    label: 'Your Club. One App.',
    parentLabel: 'Membership',
    parentHref: '/membership',
    description: [
      'TAC Connect is your Club in one app. It’s the simple way to stay connected with The American Club – your bookings, your account and the latest from the Club, all in one place.',
      'Check your account and recent transactions, book events, facilities and the spa, discover your member privileges, find key Club contacts and share your feedback – whenever and wherever suits you.',
      `On the go, use the TAC Connect app on iOS and Android. At your desk, log in to the TAC Connect member portal at ${PORTAL_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}. One login works for both.`,
    ].join('\n\n'),
    ctas: [{ label: 'Member Portal', href: PORTAL_URL, isExternal: true }],
    appDownload: {
      heading: 'Download the App',
      description: 'Scan with your phone camera to download TAC Connect for iOS or Android.',
      links: storeLinks,
    },
    helpContacts: {
      heading: 'Need Help?',
      items: [
        { icon: 'form', text: 'Talk2us! – choose “TAC Connect”', href: 'https://amclub.jotform.com/form/talk2us', action: 'link' },
        { icon: 'chat', text: 'Chat with Eli on the Club website', action: 'open-chat' },
        { icon: 'desk', text: 'Club front desk', action: 'link' },
        { icon: 'phone', text: '6737 3411', href: 'tel:+6567373411', action: 'link' },
      ],
    },
    features: {
      heading: 'What You Can Do on TAC Connect',
      description: 'Everything you need for your Club experience, together in one convenient place.',
      variant: 'overlay',
      columns: 5,
      cards: FEATURE_CARDS.map((title) => ({ title, cta: { label: 'Learn More', href: '#faq' } })),
    },
    steps: {
      heading: 'Get Started in 4 Easy Steps',
      items: [
        { title: 'Download', description: 'Get the TAC Connect app from the App Store or Google Play' },
        { title: 'Log In', description: 'Use your 7-character Membership ID and the password sent to your registered email' },
        { title: 'Set Up Once', description: 'Change your password and pick a security question. It works on the app and the member portal' },
        { title: 'Start Exploring', description: 'Make bookings, check your account and discover your member privileges' },
      ],
    },
    faqHeading: 'Frequently Asked Questions',
    faqCategory: category.documentId,
    seo: {
      metaTitle: 'TAC Connect | The American Club Singapore',
      metaDescription: 'TAC Connect is your Club in one app — bookings, your account and the latest from The American Club, on iOS, Android and the member portal.',
    },
  };
  if (DRY) { console.log('  [dry] PUT /tac-connect-page'); return; }
  // Strapi v5 REST writes publish by default (no ?status=draft).
  await api('/tac-connect-page', { method: 'PUT', body: { data } });
  console.log(`  ✓ published${IOS_URL || ANDROID_URL ? '' : ' (no store URLs yet — buttons/QR hidden)'}`);
}

/** Strip ids so components are re-created, and flatten media to ids. */
const toWritable = (value) => {
  if (Array.isArray(value)) return value.map(toWritable);
  if (value && typeof value === 'object') {
    if ('mime' in value && 'url' in value) return value.id;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'locale', 'localizations'].includes(k)) continue;
      out[k] = toWritable(v);
    }
    return out;
  }
  return value;
};

async function seedNav() {
  console.log('\n── header nav ──');
  if (SKIP_NAV) { console.log('  skipped (--skip-nav)'); return; }
  const header = (await api('/header'))?.data;
  if (!header) throw new Error('No header entry — run seed-header.mjs first');
  const membership = header.navItems?.find((n) => n.href === '/membership');
  const programs = membership?.columns?.find((c) => c.heading === 'Programs');
  if (!programs) throw new Error('Header has no Membership → Programs column');
  if (programs.links.some((l) => l.href === PAGE_PATH)) { console.log('  ✓ already present'); return; }
  programs.links.push({ label: 'TAC Connect', href: PAGE_PATH, isExternal: false });
  if (DRY) { console.log('  [dry] PUT /header (+ TAC Connect)'); return; }
  await api('/header', { method: 'PUT', body: { data: toWritable(header) } });
  console.log('  ✓ added under Membership → Programs');
}

async function main() {
  console.log(`Seeding TAC Connect${DRY ? ' (dry-run)' : ''}`);
  const category = await seedFaq();
  await seedPage(category);
  await seedNav();
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
