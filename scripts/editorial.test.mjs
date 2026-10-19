import assert from 'node:assert/strict';
import { test } from 'node:test';
import { batchDayFor, isDue, isoDay, replaceStatus, saoPauloClock } from '../src/lib/editorial.mjs';

test('o batch é na segunda: outros dias caem na segunda seguinte', () => {
  assert.equal(batchDayFor('2026-10-19'), '2026-10-19'); // segunda
  assert.equal(batchDayFor('2026-10-21'), '2026-10-26'); // quarta → segunda seguinte
  assert.equal(batchDayFor('2026-10-25'), '2026-10-26'); // domingo
});

test('no dia do batch, a edição só vence a partir das 12:00 de Brasília', () => {
  assert.equal(isDue('2026-10-19', { today: '2026-10-19', time: '11:59' }), false);
  assert.equal(isDue('2026-10-19', { today: '2026-10-19', time: '12:00' }), true);
  assert.equal(isDue('2026-10-19', { today: '2026-10-18', time: '23:00' }), false);
  assert.equal(isDue('2026-10-12', { today: '2026-10-19', time: '08:00' }), true);
  assert.equal(isDue('2026-10-21', { today: '2026-10-21', time: '13:00' }), false); // quarta → batch na segunda
});

test('o relógio usa o fuso de Brasília', () => {
  assert.deepEqual(saoPauloClock(new Date('2026-10-19T15:00:00Z')), { today: '2026-10-19', time: '12:00' });
  assert.deepEqual(saoPauloClock(new Date('2026-10-20T02:30:00Z')), { today: '2026-10-19', time: '23:30' });
});

test('isoDay aceita string ou Date e recusa vazio', () => {
  assert.equal(isoDay('2026-10-19'), '2026-10-19');
  assert.equal(isoDay(new Date('2026-10-19T00:00:00Z')), '2026-10-19');
  assert.equal(isoDay(''), null);
  assert.equal(isoDay(undefined), null);
  assert.equal(isoDay('amanhã'), null);
});

const post = (status) =>
  `---\ntitle: 'Status: rascunho'\nnumber: 2\n${status === undefined ? '' : `status: ${status}\n`}---\n\nstatus: draft no corpo fica igual.\n`;

test('replaceStatus troca só a linha de status do frontmatter', () => {
  const next = replaceStatus(post('draft'), ['draft', 'review'], 'scheduled');
  assert.equal(next, post('scheduled'));
  assert.match(next, /status: draft no corpo fica igual/);
  assert.equal(replaceStatus(post('review'), ['draft', 'review'], 'scheduled'), post('scheduled'));
  assert.equal(replaceStatus(post("'draft'"), ['draft'], 'scheduled'), post('scheduled'));
});

test('replaceStatus recusa status fora da lista e trata status ausente como rascunho', () => {
  assert.equal(replaceStatus(post('published'), ['draft', 'review'], 'scheduled'), null);
  assert.equal(replaceStatus(post('draft'), ['scheduled'], 'draft'), null);
  assert.match(replaceStatus(post(undefined), ['draft'], 'scheduled'), /number: 2\nstatus: scheduled\n---/);
  assert.equal(replaceStatus('sem frontmatter', ['draft'], 'scheduled'), null);
});
