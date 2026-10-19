import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { parseFrontmatter } from './frontmatter.mjs';
import { MIN_VISUALS, countVisuals, placeholdersIn } from '../src/lib/editorial.mjs';

const POSTS = new URL('../src/content/posts/', import.meta.url);
const EMAILS = new URL('../src/content/emails/', import.meta.url);
const NOTES = new URL('../editorial/notes/', import.meta.url);

const files = async (directory, extension) => {
  try {
    return (await readdir(directory)).filter((name) => name.endsWith(extension));
  } catch {
    return [];
  }
};

test('a checagem de placeholder pega aviso de rascunho e deixa link normal passar', () => {
  assert.deepEqual(placeholdersIn('Texto pronto, com [fonte oficial](https://exemplo.com).'), []);
  assert.ok(placeholdersIn('> Rascunho: sugestão da curadoria automática.').length > 0);
  assert.ok(placeholdersIn('Preço: [inserir valor]').length > 0);
  assert.ok(placeholdersIn('TODO conferir a data').length > 0);
  assert.equal(countVisuals('![a](/x.svg)\n\ntexto\n\n![b](/y.png)'), 2);
});

test('edições e e-mails não têm texto de rascunho (dúvidas vão em editorial/notes, pelo Telegram)', async () => {
  for (const [directory, label] of [[POSTS, 'posts'], [EMAILS, 'emails']]) {
    for (const name of await files(directory, '.mdx')) {
      const found = placeholdersIn(await readFile(new URL(name, directory), 'utf8'));
      assert.deepEqual(found, [], `src/content/${label}/${name}: ${found.join(' | ')}`);
    }
  }
});

test(`edições a partir da #2 têm pelo menos ${MIN_VISUALS} gráficos ou imagens no corpo`, async () => {
  for (const name of await files(POSTS, '.mdx')) {
    const { data, content } = parseFrontmatter(await readFile(new URL(name, POSTS), 'utf8'));
    if (Number.isInteger(data.number) && data.number < 2) continue;
    const visuals = countVisuals(content);
    assert.ok(visuals >= MIN_VISUALS, `${name}: ${visuals} gráfico(s)/imagem(ns) (mínimo ${MIN_VISUALS}); ver EDITORIAL.md seção 6`);
  }
});

test('cada arquivo de editorial/notes aponta para uma edição existente', async () => {
  const posts = new Set((await files(POSTS, '.mdx')).map((name) => name.replace(/\.mdx$/, '')));
  for (const name of await files(NOTES, '.md')) {
    if (name === 'README.md') continue;
    assert.ok(posts.has(name.replace(/\.md$/, '')), `editorial/notes/${name} não corresponde a src/content/posts/${name.replace(/\.md$/, '.mdx')}`);
  }
});
