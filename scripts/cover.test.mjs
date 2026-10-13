import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';
import { applyCoverImage, buildCoverSvg, iconElement, parseHeadline, renderCover, resolveLogo } from './cover.mjs';

test('o título separa o trecho com marca-texto e respeita os limites', () => {
  assert.deepEqual(parseHeadline(['A IA saiu', 'do [chat]']), [
    { before: 'A IA saiu', mark: undefined, after: '' },
    { before: 'do ', mark: 'chat', after: '' },
  ]);
  assert.throws(() => parseHeadline(['[um]', '[dois]']), /no máximo um/);
  assert.throws(() => parseHeadline(['a', 'b', 'c', 'd']), /1 a 3 linhas/);
  assert.throws(() => parseHeadline(['um título comprido demais para', 'caber na capa sem poluir']), /limite é 40/);
  assert.throws(() => parseHeadline(['colchete [aberto']), /colchetes inválidos/);
});

test('logotipos vêm dos pacotes, só em versão monocromática', () => {
  assert.equal(resolveLogo('openai').source, 'lobe');
  assert.equal(resolveLogo('si:whatsapp').source, 'si');
  assert.throws(() => resolveLogo('claude-color'), /monocromática/);
  assert.throws(() => resolveLogo('../package'), /inválido/);
  assert.throws(() => resolveLogo('marca-que-nao-existe'), /não encontrado/);
});

test('o ícone vira um <svg> aninhado na cor pedida, sem colisão de ids', () => {
  const raw = '<svg viewBox="0 0 24 24" fill-rule="evenodd"><title>X</title><defs><linearGradient id="a"/></defs><path fill="#10A37F" d="M0 0" stroke="url(#a)"/></svg>';
  const out = iconElement(raw, { x: 1, y: 2, width: 30, height: 30, color: '#FFFFFF', prefix: 'ref-0' });
  assert.match(out, /^<svg x="1" y="2" width="30" height="30" viewBox="0 0 24 24"/);
  assert.match(out, /fill-rule="evenodd"/);
  assert.doesNotMatch(out, /<title>|#10A37F/);
  assert.match(out, /id="ref-0-a"/);
});

test('coverImage é criado depois de cover ou substituído no frontmatter', () => {
  const post = "---\ntitle: 'X'\ncover: fig-02\nstatus: draft\n---\n\nTexto.\n";
  const created = applyCoverImage(post, '/images/covers/x/coverImage.png');
  assert.equal(created, "---\ntitle: 'X'\ncover: fig-02\ncoverImage: /images/covers/x/coverImage.png\nstatus: draft\n---\n\nTexto.\n");
  assert.equal(applyCoverImage(created, '/novo.png'), created.replace('/images/covers/x/coverImage.png', '/novo.png'));
});

test('a capa renderiza em 2400×1350 com as fontes da marca', async () => {
  const raw = await readFile(resolveLogo('claude').file, 'utf8');
  const svg = await buildCoverSvg({
    headline: ['A IA saiu', 'do [chat]'],
    refs: [{ kind: 'logo', raw }, { kind: 'text', text: 'Jev' }],
    kicker: 'EDIÇÃO #1 · 12 OUT 2026',
  });
  assert.match(svg, /'Source Serif 4'/);
  const { width, height, format } = await sharp(await renderCover(svg)).metadata();
  assert.deepEqual({ width, height, format }, { width: 2400, height: 1350, format: 'png' });
});
