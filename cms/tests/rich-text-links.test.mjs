import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { renderEntryMarkdown } = require(path.join(process.env.TEAMUP_TEST_BUILD, 'services', 'markdown.js'));
const uid = 'api::faq-item.faq-item';
const strapi = { contentTypes: { [uid]: { attributes: { answer: { type: 'blocks' } } } } };
const publicUrl = 'https://club.example/faq';
const text = (value) => ({ type: 'text', text: value });
const link = (url, ...children) => ({ type: 'link', url, children });
const paragraph = (...children) => ({ type: 'paragraph', children });
const render = (...answer) => renderEntryMarkdown({ strapi, uid, publicUrl, entry: { answer } });

test('indexes action links and contact links with the surrounding FAQ text and page source', () => {
  const actionUrl = 'https://forms.example/guest?lang=en&member=1';
  const result = render(paragraph(text('Use the '), link(actionUrl, text('Guest '), text('Form')),
    text(' or email '), link('mailto:info@club.example', text('Member Services')), text('.')));
  assert.ok(result.includes(`Use the [Guest Form](${actionUrl}) or email [Member Services](mailto:info@club.example).`));
  assert.ok(result.includes(publicUrl));
});

test('resolves internal links, keeps unlabeled destinations and ignores malformed editor links', () => {
  const result = render(paragraph(link('/membership', text('')), text(' / '),
    link('Thinkspace: Reserve meeting rooms.', text('Desk')), text(' / '),
    link('https://forms.example/guest', text('https://forms.example/guest'))));
  assert.ok(result.includes('https://club.example/membership / Desk / https://forms.example/guest'));
  assert.ok(!result.includes('Thinkspace:'));
});
