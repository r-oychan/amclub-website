#!/usr/bin/env node
// Unit tests for the draft/modified classification in list-drafts.mjs.
//
// The MODIFIED branch is rare against real data (dev, uat and prod were all
// clean when this was written), so it is covered here rather than shipping
// unexercised.
//
// Usage: node --test scripts/list-drafts.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDocuments } from './list-drafts.mjs';

const doc = (documentId, updatedAt) => ({ documentId, updatedAt, name: documentId });

test('a document with no published counterpart is DRAFT', () => {
  const { drafts, modified } = classifyDocuments(
    [doc('a', '2026-08-13T10:00:00.000Z')],
    [],
  );
  assert.deepEqual(drafts.map((d) => d.documentId), ['a']);
  assert.equal(modified.length, 0);
});

test('a draft newer than its published version is MODIFIED', () => {
  const { drafts, modified } = classifyDocuments(
    [doc('a', '2026-08-13T12:00:00.000Z')],
    [doc('a', '2026-08-13T10:00:00.000Z')],
  );
  assert.equal(drafts.length, 0);
  assert.deepEqual(modified.map((d) => d.documentId), ['a']);
});

test('a draft matching its published version is neither', () => {
  const { drafts, modified } = classifyDocuments(
    [doc('a', '2026-08-13T10:00:00.000Z')],
    [doc('a', '2026-08-13T10:00:00.000Z')],
  );
  assert.equal(drafts.length, 0);
  assert.equal(modified.length, 0);
});

test('sub-second skew between the two rows is not reported as MODIFIED', () => {
  // Publishing writes both rows; the draft row often lands a few hundred ms
  // later. That is noise, not a pending edit.
  const { modified } = classifyDocuments(
    [doc('a', '2026-08-13T10:00:00.900Z')],
    [doc('a', '2026-08-13T10:00:00.100Z')],
  );
  assert.equal(modified.length, 0);
});

test('a draft OLDER than published is not reported', () => {
  const { drafts, modified } = classifyDocuments(
    [doc('a', '2026-08-13T09:00:00.000Z')],
    [doc('a', '2026-08-13T10:00:00.000Z')],
  );
  assert.equal(drafts.length, 0);
  assert.equal(modified.length, 0);
});

test('mixed set is split correctly and published-only rows are ignored', () => {
  const { drafts, modified } = classifyDocuments(
    [
      doc('never-published', '2026-08-01T00:00:00.000Z'),
      doc('edited', '2026-08-13T12:00:00.000Z'),
      doc('clean', '2026-08-10T00:00:00.000Z'),
    ],
    [
      doc('edited', '2026-08-13T10:00:00.000Z'),
      doc('clean', '2026-08-10T00:00:00.000Z'),
      doc('published-only', '2026-08-09T00:00:00.000Z'),
    ],
  );
  assert.deepEqual(drafts.map((d) => d.documentId), ['never-published']);
  assert.deepEqual(modified.map((d) => d.documentId), ['edited']);
});
