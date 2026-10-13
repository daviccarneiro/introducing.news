import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildEmail } from './email-template.mjs';

const base = {
  title: 'A IA saiu do chat',
  description: 'Resumo da edição.',
  url: 'https://introducing.news/arquivo/x/?utm_source=newsletter',
  site: 'https://introducing.news',
  author: { name: 'Davi Carneiro', role: '' },
};

test('a capa entra entre o título e o resumo, com link para a edição', () => {
  const { html } = buildEmail({ ...base, cover: '/images/covers/x/coverImage.png' });
  const title = html.indexOf('A IA saiu do chat</h1>');
  const cover = html.indexOf('src="https://introducing.news/images/covers/x/coverImage.png"');
  const summary = html.indexOf('Resumo da edição.</p>');
  assert.ok(title > 0 && title < cover && cover < summary);
  assert.match(html, /<a href="https:\/\/introducing.news\/arquivo\/x\/\?utm_source=newsletter"[^>]*><img src="https:\/\/introducing.news\/images\/covers/);
});

test('sem capa (ou com SVG) o e-mail sai sem imagem e sem variável pendente', () => {
  for (const cover of [undefined, '/brand/cover.svg']) {
    const { html } = buildEmail({ ...base, cover });
    assert.doesNotMatch(html, /\{\{\{COVER\}\}\}|images\/covers|cover\.svg/);
  }
});
