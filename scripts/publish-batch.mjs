#!/usr/bin/env node
/**
 * Batch de publicação — publica no site as edições programadas no dia do batch.
 *
 * Uso:
 *   node scripts/publish-batch.mjs            # publica as edições vencidas
 *   node scripts/publish-batch.mjs --dry-run  # mostra o que seria publicado
 *   node scripts/publish-batch.mjs --check    # imprime "yes"/"no": há algo pronto e vencido?
 *
 * Uma edição entra no batch com `status: scheduled` e a data em `publishedAt`.
 * A data é normalizada para o próximo dia de batch (toda segunda): uma edição
 * marcada para quarta só é publicada na segunda seguinte. No dia do batch, ela
 * só vence a partir das 12:00 (Brasília), o horário da newsletter: programar
 * na segunda de manhã não publica nem envia antes do meio-dia. A partir daí o
 * status vira `published` e o site (que só mostra publicadas) passa a exibi-la.
 *
 * `--check` não tem dependências externas de propósito: o workflow o executa
 * antes de `npm ci`, garantindo que nada é instalado, commitado ou publicado
 * sem que exista uma edição aprovada, vencida e com o conteúdo essencial
 * preenchido (title, description, signature e publishedAt).
 *
 * Rodado pelo workflow "Publicar batch": em mudanças de src/content/posts
 * (o commit do Keystatic ao programar) e por cron nas segundas (12:00 BRT).
 * O workflow commita o resultado e aciona o Deploy — pushes feitos com
 * GITHUB_TOKEN não disparam outros workflows por conta própria.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { batchDayFor, isDue, isoDay, saoPauloClock } from '../src/lib/editorial.mjs';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const check = args.includes('--check');
const clock = saoPauloClock();

/** Bloco de frontmatter (sem o corpo), ou null se o arquivo não começar com `---`. */
function frontmatterOf(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return match ? { front: match[1], length: match[0].length } : null;
}

/** Valor simples de uma chave do frontmatter (datas, slugs, textos curtos). */
function valueOf(front, key) {
  const match = front.match(new RegExp(`^${key}:[ \\t]*['"]?([^'"\\r\\n]+?)['"]?[ \\t]*$`, 'm'));
  return match?.[1]?.trim() || null;
}

async function scan() {
  const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.mdx')).sort();
  const due = [];
  const incomplete = [];

  for (const name of files) {
    const raw = await readFile(new URL(name, POSTS_DIR), 'utf8');
    const parsed = frontmatterOf(raw);
    if (!parsed || valueOf(parsed.front, 'status') !== 'scheduled') continue;

    const missing = ['title', 'description', 'signature'].filter((key) => !valueOf(parsed.front, key));
    const day = isoDay(valueOf(parsed.front, 'publishedAt') ?? '');
    if (!day) missing.push('publishedAt');

    if (missing.length > 0) {
      incomplete.push({ name, missing });
      continue;
    }

    if (isDue(day, clock)) due.push({ name, raw, front: parsed.front, day, batchDay: batchDayFor(day) });
  }

  return { due, incomplete };
}

const { due, incomplete } = await scan();

for (const { name, missing } of incomplete) {
  console.warn(`⚠ ${name}: "Programada" sem ${missing.join(', ')} — não será publicada até completar.`);
}

if (check) {
  console.log(due.length > 0 ? 'yes' : 'no');
  process.exit(0);
}

if (due.length === 0) {
  console.log('Nada vencido no batch.');
  process.exit(0);
}

let published = 0;
for (const { name, raw, front, day, batchDay } of due) {
  if (day !== batchDay) {
    console.warn(`⚠ ${name}: ${day} não é dia de batch — publicando no batch de ${batchDay}.`);
  }
  if (dryRun) {
    console.log(`◌ [dry-run] publicaria ${name} (data ${day}, batch ${batchDay}).`);
    published += 1;
    continue;
  }

  const nextFront = front.replace(/^status:[ \t]*['"]?scheduled['"]?[ \t]*$/m, 'status: published');
  if (nextFront === front) {
    console.warn(`⚠ ${name}: não encontrei a linha "status: scheduled" no frontmatter — ignorado.`);
    continue;
  }

  const start = raw.indexOf(front);
  await writeFile(
    new URL(name, POSTS_DIR),
    raw.slice(0, start) + nextFront + raw.slice(start + front.length),
    'utf8',
  );
  console.log(`✔ ${name} publicada (data ${day}, batch ${batchDay}).`);
  published += 1;
}

console.log(published > 0 ? `\n${published} edição(ões) publicada(s).` : '\nNada vencido no batch.');
