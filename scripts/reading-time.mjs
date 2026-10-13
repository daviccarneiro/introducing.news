#!/usr/bin/env node
/**
 * Tempo de leitura de uma edição, com a mesma conta do site.
 *
 * Uso: node scripts/reading-time.mjs <slug>
 *
 * Sai com erro se passar de 10 minutos (edições a partir da #2). O ideal fica
 * entre 8 e 10: corte palavras e, se precisar, assuntos (EDITORIAL.md, seção 3).
 */
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from './frontmatter.mjs';
import { MAX_READING_MINUTES, WORDS_PER_MINUTE, countWords, readingMinutes } from '../src/lib/reading-time.mjs';

const slug = (process.argv[2] ?? '').trim();
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('✖ Uso: node scripts/reading-time.mjs <slug>');
  process.exit(1);
}

let raw;
try {
  raw = await readFile(new URL(`../src/content/posts/${slug}.mdx`, import.meta.url), 'utf8');
} catch {
  console.error(`✖ Edição não encontrada: src/content/posts/${slug}.mdx`);
  process.exit(1);
}

const { data, content } = parseFrontmatter(raw);
const words = countWords(content);
const minutes = readingMinutes(content);
const limitWords = Math.floor((MAX_READING_MINUTES + 0.5) * WORDS_PER_MINUTE) - 1;
const enforced = !Number.isInteger(data.number) || data.number >= 2;

console.log(`${minutes} min de leitura (${words} palavras; o limite de ${MAX_READING_MINUTES} min vai até ${limitWords} palavras).`);
if (enforced && minutes > MAX_READING_MINUTES) {
  console.error(`✖ Passou do limite: corte cerca de ${words - limitWords} palavras (frases mais diretas ou um assunto a menos).`);
  process.exit(1);
}
