import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { parseFrontmatter } from './frontmatter.mjs';
import { renderEmailBody } from './email-body.mjs';

test('preserva os campos editoriais, datas e o corpo MDX', () => {
  const content = '\n## Uma edição\n\nTexto em **negrito**.\n\n---\n\nFim.\n';
  const result = parseFrontmatter(`---
title: 'Novidades: IA'
number: 2
description: >-
  Resumo da edição
  em duas linhas.
publishedAt: 2026-10-08
signature: davi-carneiro
status: published
coverImage: /images/covers/capa.png
---
${content}`);
  assert.deepEqual(result.data, {
    title: 'Novidades: IA', number: 2, description: 'Resumo da edição em duas linhas.',
    publishedAt: '2026-10-08', signature: 'davi-carneiro', status: 'published',
    coverImage: '/images/covers/capa.png',
  });
  assert.equal(new Date(result.data.publishedAt).toISOString(), '2026-10-08T00:00:00.000Z');
  assert.equal(result.content, content);
});

test('o conteúdo da coleção E-mails continua renderizando links, imagens e listas', () => {
  const { data, content } = parseFrontmatter(`---
edition: novidades-ia
subject: 'IA: modelos novos'
previewText: O resumo desta semana.
---
Texto em **negrito** com [link](https://example.com).

- Primeiro item
- Segundo item

![Capa](/images/emails/capa.png)
`);
  assert.equal(data.edition, 'novidades-ia');
  assert.equal(data.subject, 'IA: modelos novos');
  assert.equal(data.previewText, 'O resumo desta semana.');
  const body = renderEmailBody(content, 'https://introducing.news');
  assert.match(body.html, /<strong[^>]*>negrito<\/strong>/);
  assert.match(body.html, /href="https:\/\/example.com"/);
  assert.match(body.html, /src="https:\/\/introducing.news\/images\/emails\/capa.png"/);
  assert.match(body.text, /• Primeiro item/);
});

test('aceita BOM, CRLF e delimitador final sem quebra de linha', () => {
  const body = '\r\nCorpo\r\n';
  assert.deepEqual(parseFrontmatter(`\uFEFF---\r\ntitle: Título\r\n---\r\n${body}`), {
    data: { title: 'Título' }, content: body,
  });
  assert.deepEqual(parseFrontmatter('---\ntitle: Título\n---'), {
    data: { title: 'Título' }, content: '',
  });
});

test('texto sem frontmatter e mapa vazio preservam o corpo', () => {
  const content = 'Texto\n\n---\n\nCorpo';
  assert.deepEqual(parseFrontmatter(content), { data: {}, content });
  assert.deepEqual(parseFrontmatter('---\n---\nCorpo'), { data: {}, content: 'Corpo' });
});

test('recusa frontmatter incompleto, YAML inválido e estruturas que não são mapas', () => {
  assert.throws(() => parseFrontmatter('---\ntitle: Título'), /fechamento/);
  assert.throws(() => parseFrontmatter('---\ntitle: [\n---\nCorpo'));
  assert.throws(() => parseFrontmatter('---\n- item\n---\nCorpo'), /mapa/);
  assert.throws(() => parseFrontmatter('---\ntexto\n---\nCorpo'), /mapa/);
  assert.throws(() => parseFrontmatter('---\ntitle: Primeiro\ntitle: Segundo\n---\nCorpo'));
});

test('lê todas as edições e valida os campos de envio das publicadas', async () => {
  const directory = new URL('../src/content/posts/', import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.mdx'));
  assert.ok(files.length > 0);
  for (const name of files) {
    const { data, content } = parseFrontmatter(await readFile(new URL(name, directory), 'utf8'));
    if (data.status !== 'published') continue;
    assert.ok(data.title, name);
    assert.ok(data.description, name);
    assert.ok(data.signature, name);
    assert.ok(Number.isFinite(new Date(data.publishedAt).getTime()), name);
    assert.ok(content.trim(), name);
  }
});
