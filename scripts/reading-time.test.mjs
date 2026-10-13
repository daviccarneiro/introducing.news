import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { parseFrontmatter } from './frontmatter.mjs';
import { MAX_READING_MINUTES, countWords, readingMinutes } from '../src/lib/reading-time.mjs';

test('a conta de minutos arredonda a 200 palavras por minuto', () => {
  assert.equal(countWords(''), 0);
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('palavra '.repeat(2099)), 10);
  assert.equal(readingMinutes('palavra '.repeat(2100)), 11);
});

test(`edições a partir da #2 têm no máximo ${MAX_READING_MINUTES} minutos de leitura`, async () => {
  const directory = new URL('../src/content/posts/', import.meta.url);
  for (const name of (await readdir(directory)).filter((file) => file.endsWith('.mdx'))) {
    const { data, content } = parseFrontmatter(await readFile(new URL(name, directory), 'utf8'));
    if (Number.isInteger(data.number) && data.number < 2) continue;
    const minutes = readingMinutes(content);
    assert.ok(minutes <= MAX_READING_MINUTES, `${name}: ${minutes} min (limite ${MAX_READING_MINUTES}); rode node scripts/reading-time.mjs ${name.replace(/\.mdx$/, '')}`);
  }
});
