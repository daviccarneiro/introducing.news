#!/usr/bin/env node
/**
 * Gera a capa de uma edição (PNG 16:9, 2400×1350) na identidade da marca:
 * fundo ink-950, grade fina, uma órbita laranja com as referências da semana
 * (logotipos, uma foto ou um nome) e um título curto com marca-texto.
 *
 * Uso:
 *   node scripts/cover.mjs <slug> [--apply]
 *       lê `design/covers/<slug>.json` e grava
 *       `public/images/covers/<slug>/coverImage.png` (mesmo caminho que o
 *       Keystatic usa no upload). Com --apply, grava `coverImage` no
 *       frontmatter de `src/content/posts/<slug>.mdx`.
 *   node scripts/cover.mjs --find <termo>
 *       procura logotipos disponíveis (pacotes @lobehub/icons-static-svg e
 *       simple-icons).
 *
 * Especificação (`design/covers/<slug>.json`):
 *   {
 *     "headline": ["A IA saiu", "do [chat]"],
 *     "refs": [
 *       { "logo": "claude" },
 *       { "logo": "openai" },
 *       { "photo": { "commons": "File:Exemplo.jpg" } },
 *       { "text": "Jev" }
 *     ]
 *   }
 *
 * - headline: 1 a 3 linhas, até 40 caracteres no total; o trecho entre
 *   colchetes (no máximo um) ganha o marca-texto laranja.
 * - refs: 2 a 4 referências. A primeira fica no centro da órbita; as outras
 *   orbitam em volta. Cada uma é `logo` (nome do --find), `text` (nome curto,
 *   para o que não tem logotipo) ou `photo`.
 * - photo: `commons` baixa do Wikimedia Commons só com licença livre (CC0,
 *   domínio público, CC BY, CC BY-SA) e grava `file`, `credit` e `source` de
 *   volta na especificação; ou `file` (caminho no repositório) + `credit`.
 *   O crédito vai no canto da imagem e deve entrar nas Fontes da edição.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { parseFrontmatter } from './frontmatter.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FONTS_DIR = join(ROOT, 'design/fonts');
const SPECS_DIR = join(ROOT, 'design/covers');
const POSTS_DIR = join(ROOT, 'src/content/posts');
const COVERS_DIR = join(ROOT, 'public/images/covers');
const ICON_SOURCES = {
  lobe: join(ROOT, 'node_modules/@lobehub/icons-static-svg/icons'),
  si: join(ROOT, 'node_modules/simple-icons/icons'),
};

// Tamanho de trabalho (o mesmo das figuras fig-01..03); a saída é 2×.
const W = 1200;
const H = 675;
const SCALE = 2;
const PAD = 72;
const TEXT_MAX_WIDTH = 560;

// Tokens de `src/styles/tokens.css`.
const C = {
  paper: '#FFFFFF',
  ink300: '#C9C9D1',
  ink400: '#9A9AA4',
  ink500: '#6B6B76',
  ink600: '#4B4B55',
  ink700: '#33333A',
  ink800: '#1F1F23',
  ink900: '#141417',
  ink950: '#0B0B0C',
  accent: '#F6821F',
};

const SERIF = "'Source Serif 4', serif";
const SANS = "'Geist', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const ALLOWED_LICENSE = /^(cc0|public domain|pd\b|cc by(-sa)? \d)/i;
const USER_AGENT = 'introducing.news cover script (https://introducing.news; oi@introducing.news)';

// Órbita: centro e raio, com as posições (em graus, sentido horário a partir
// das 3h) das referências que orbitam, conforme a quantidade.
const ORBIT = { cx: 920, cy: 337, r: 214 };
const CENTER_R = 118;
const SATELLITE_R = 58;
const SATELLITE_ANGLES = {
  1: [-38],
  2: [-38, 128],
  3: [-38, 50, 152],
};

// Fontes da marca, sem depender do sistema: o fontconfig do sharp/librsvg
// passa a enxergar só `design/fonts`, e o resultado é igual em qualquer máquina.
const fontconfigDir = join(tmpdir(), 'introducing-news-fontconfig');
async function setupFonts() {
  if (process.env.FONTCONFIG_FILE?.startsWith(fontconfigDir)) return;
  await mkdir(fontconfigDir, { recursive: true });
  const file = join(fontconfigDir, 'fonts.conf');
  await writeFile(
    file,
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${escapeXml(FONTS_DIR)}</dir>\n  <cachedir>${escapeXml(join(fontconfigDir, 'cache'))}</cachedir>\n</fontconfig>\n`,
  );
  process.env.FONTCONFIG_FILE = file;
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Separa cada linha do título em trechos normais e o trecho com marca-texto. */
export function parseHeadline(lines) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 3) {
    throw new Error('headline: use de 1 a 3 linhas.');
  }
  let highlights = 0;
  const parsed = lines.map((line) => {
    if (typeof line !== 'string' || !line.trim()) throw new Error('headline: linha vazia.');
    const match = /^([^[\]]*)(?:\[([^[\]]+)\]([^[\]]*))?$/.exec(line.trim());
    if (!match) throw new Error(`headline: colchetes inválidos em "${line}".`);
    const [, before, mark, after = ''] = match;
    if (mark !== undefined) highlights += 1;
    return { before, mark, after: mark === undefined ? '' : after };
  });
  if (highlights > 1) throw new Error('headline: use no máximo um trecho entre colchetes.');
  const chars = parsed.reduce((n, l) => n + `${l.before}${l.mark ?? ''}${l.after}`.length, 0);
  if (chars > 40) throw new Error(`headline: ${chars} caracteres; o limite é 40 (pouco texto na capa).`);
  return parsed;
}

/** Acha o arquivo do logotipo: `nome`, `lobe:nome` ou `si:nome`. */
export function resolveLogo(name) {
  const prefixed = /^(lobe|si):(.+)$/.exec(name);
  const candidates = prefixed ? [[prefixed[1], prefixed[2]]] : [['lobe', name], ['si', name]];
  for (const [source, slug] of candidates) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Logotipo inválido: "${name}".`);
    if (/-(color|brand-color)$/.test(slug)) {
      throw new Error(`"${name}": use a versão monocromática (sem -color); a capa só usa as cores da marca.`);
    }
    const file = join(ICON_SOURCES[source], `${slug}.svg`);
    if (existsSync(file)) return { source, slug, file };
  }
  throw new Error(`Logotipo "${name}" não encontrado. Procure com: node scripts/cover.mjs --find ${name}`);
}

/** Converte um SVG de ícone num <svg> aninhado, monocromático, dentro da caixa. */
export function iconElement(raw, { x, y, width, height, color, prefix }) {
  const open = /<svg\b([^>]*)>/i.exec(raw);
  const end = raw.lastIndexOf('</svg>');
  if (!open || end < 0) throw new Error('SVG de logotipo inválido.');
  const attr = (name) => new RegExp(`\\b${name}="([^"]+)"`, 'i').exec(open[1])?.[1];
  const viewBox = attr('viewBox') ?? '0 0 24 24';
  const fillRule = attr('fill-rule');
  const inner = raw
    .slice(open.index + open[0].length, end)
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`)
    .replace(/\b(fill|stroke)="(?!none)[^"]*"/g, `$1="${color}"`)
    .replace(/currentColor/g, color);
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}"` +
    ` preserveAspectRatio="xMidYMid meet" fill="${color}"${fillRule ? ` fill-rule="${fillRule}"` : ''}>` +
    `${inner}</svg>`
  );
}

/** Largura do texto renderizado (mesmo motor de texto do SVG: pango). */
async function measure(text, font, letterSpacing = 0) {
  if (!text) return 0;
  // letter_spacing do pango é em 1/1024 de ponto; com dpi 72, ponto = pixel.
  const markup = `<span letter_spacing="${Math.round(letterSpacing * 1024)}">${escapeXml(text)}</span>`;
  const { info } = await sharp({ text: { text: markup, font, dpi: 72, rgba: true } })
    .png()
    .toBuffer({ resolveWithObject: true });
  return info.width;
}

/** Atualiza (ou cria) `coverImage` no frontmatter, sem tocar no resto do arquivo. */
export function applyCoverImage(source, value) {
  const opening = /^---[ \t]*\r?\n/.exec(source);
  if (!opening) throw new Error('Edição sem frontmatter.');
  const rest = source.slice(opening[0].length);
  const closing = /^---[ \t]*\r?$/m.exec(rest);
  if (!closing) throw new Error('Frontmatter sem delimitador de fechamento.');
  let fm = rest.slice(0, closing.index);
  const line = `coverImage: ${value}`;
  if (/^coverImage:.*$/m.test(fm)) fm = fm.replace(/^coverImage:.*$/m, line);
  else if (/^cover:.*$/m.test(fm)) fm = fm.replace(/^(cover:.*)$/m, `$1\n${line}`);
  else fm = `${fm}${line}\n`;
  return `${opening[0]}${fm}${rest.slice(closing.index)}`;
}

function formatKicker({ number, publishedAt }) {
  const iso = publishedAt instanceof Date ? publishedAt.toISOString() : String(publishedAt ?? '');
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const when = date ? `${Number(date[3])} ${MONTHS[Number(date[2]) - 1]} ${date[1]}` : '';
  const edition = Number.isInteger(number) ? `EDIÇÃO #${number}` : 'INTRODUCING.NEWS';
  return when ? `${edition} · ${when}` : edition;
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Baixa a foto do Wikimedia Commons, só com licença livre, e devolve o crédito. */
async function fetchCommonsPhoto(title, dest) {
  const fileTitle = title.startsWith('File:') ? title : `File:${title}`;
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '800',
    titles: fileTitle,
  }).toString();
  const headers = { 'User-Agent': USER_AGENT };
  const response = await fetch(api, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Commons respondeu ${response.status}.`);
  const page = (await response.json())?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`Arquivo não encontrado no Commons: ${fileTitle}`);
  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value);
  if (meta.NonFree?.value === 'true' || !ALLOWED_LICENSE.test(license)) {
    throw new Error(`Licença "${license || 'desconhecida'}" não permitida (use CC0, domínio público, CC BY ou CC BY-SA).`);
  }
  const artist = stripHtml(meta.Artist?.value).slice(0, 60) || 'autor desconhecido';
  const image = await fetch(info.thumburl ?? info.url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!image.ok) throw new Error(`Download da foto falhou (${image.status}).`);
  await writeFile(dest, Buffer.from(await image.arrayBuffer()));
  return {
    file: relative(ROOT, dest).split(sep).join('/'),
    credit: `Foto: ${artist}, ${license}, via Wikimedia Commons`,
    source: info.descriptionurl,
  };
}

function insideRepo(path) {
  const full = resolve(ROOT, path);
  if (!full.startsWith(ROOT)) throw new Error(`Caminho fora do repositório: ${path}`);
  return full;
}

/** Valida as referências e resolve logotipos e fotos (baixando se preciso). */
async function prepareRefs(spec, slug) {
  const refs = spec.refs;
  if (!Array.isArray(refs) || refs.length < 2 || refs.length > 4) {
    throw new Error('refs: use de 2 a 4 referências (logotipos, foto ou nome).');
  }
  let specChanged = false;
  const prepared = [];
  for (const [index, ref] of refs.entries()) {
    const kinds = ['logo', 'text', 'photo'].filter((k) => ref?.[k] !== undefined);
    if (kinds.length !== 1) throw new Error(`refs[${index}]: use exatamente um de logo, text ou photo.`);
    if (ref.logo !== undefined) {
      const logo = resolveLogo(String(ref.logo));
      prepared.push({ kind: 'logo', raw: await readFile(logo.file, 'utf8'), label: ref.label ?? ref.logo });
    } else if (ref.text !== undefined) {
      const text = String(ref.text).trim();
      if (!text || text.length > 12) throw new Error(`refs[${index}].text: de 1 a 12 caracteres.`);
      prepared.push({ kind: 'text', text, label: ref.label ?? text });
    } else {
      const photo = ref.photo ?? {};
      if (!photo.file || !existsSync(insideRepo(photo.file))) {
        if (!photo.commons) throw new Error(`refs[${index}].photo: informe "commons" ou "file" + "credit".`);
        await mkdir(SPECS_DIR, { recursive: true });
        Object.assign(photo, await fetchCommonsPhoto(photo.commons, join(SPECS_DIR, `${slug}-${index}.jpg`)));
        ref.photo = photo;
        specChanged = true;
      }
      if (!photo.credit) throw new Error(`refs[${index}].photo: falta "credit" (autor e licença).`);
      prepared.push({ kind: 'photo', file: insideRepo(photo.file), credit: photo.credit, label: ref.label ?? 'foto' });
    }
  }
  if (prepared.filter((r) => r.kind === 'photo').length > 1) throw new Error('refs: no máximo uma foto por capa.');
  return { refs: prepared, specChanged };
}

async function refElement(ref, { cx, cy, r }, index) {
  if (ref.kind === 'photo') {
    const size = Math.round(r * 2 * SCALE);
    const jpeg = await sharp(ref.file)
      .rotate()
      .resize(size, size, { fit: 'cover', position: sharp.strategy.attention })
      .grayscale()
      .linear(1.08, -8)
      .jpeg({ quality: 86 })
      .toBuffer();
    return (
      `<clipPath id="ref-${index}-clip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<image href="data:image/jpeg;base64,${jpeg.toString('base64')}" x="${cx - r}" y="${cy - r}"` +
      ` width="${r * 2}" height="${r * 2}" clip-path="url(#ref-${index}-clip)" preserveAspectRatio="xMidYMid slice"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink700}" stroke-width="1.5"/>`
    );
  }
  const disc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ink900}" stroke="${C.ink700}" stroke-width="1.5"/>`;
  if (ref.kind === 'text') {
    let size = Math.round(r * 0.62);
    while (size > 12 && (await measure(ref.text, `Geist SemiBold ${size}`)) > r * 1.45) size -= 1;
    return (
      `${disc}<text x="${cx}" y="${cy + size * 0.36}" text-anchor="middle" font-family="${SANS}"` +
      ` font-weight="600" font-size="${size}" fill="${C.paper}">${escapeXml(ref.text)}</text>`
    );
  }
  // Logotipos largos (wordmarks) ocupam mais largura e menos altura.
  const viewBox = /viewBox="([^"]+)"/i.exec(ref.raw)?.[1]?.split(/[\s,]+/).map(Number) ?? [0, 0, 24, 24];
  const ratio = viewBox[2] / viewBox[3];
  const width = ratio > 1.6 ? r * 1.4 : r;
  const height = ratio > 1.6 ? r * 0.6 : r;
  return disc + iconElement(ref.raw, { x: cx - width / 2, y: cy - height / 2, width, height, color: C.paper, prefix: `ref-${index}` });
}

/** Monta o SVG da capa (1200×675, exportado em 2×). */
export async function buildCoverSvg({ headline, refs, kicker, credit }) {
  await setupFonts();
  const lines = parseHeadline(headline);

  // Título: maior tamanho (84 a 56) em que todas as linhas cabem na coluna.
  // O início do marca-texto vem de largura(antes + trecho) − largura(trecho),
  // porque a medição descarta o espaço no fim de "antes".
  let fontSize = 84;
  let widths;
  for (; fontSize >= 56; fontSize -= 2) {
    const font = `Source Serif 4 SemiBold ${fontSize}`;
    const tracking = -fontSize * 0.015;
    widths = await Promise.all(
      lines.map(async (l) => {
        const mark = await measure(l.mark ?? '', font, tracking);
        const upToMark = await measure(`${l.before}${l.mark ?? ''}`, font, tracking);
        const total = await measure(`${l.before}${l.mark ?? ''}${l.after}`, font, tracking);
        return { start: upToMark - mark, mark, total };
      }),
    );
    if (widths.every((w) => w.total <= TEXT_MAX_WIDTH)) break;
  }
  if (fontSize < 56) throw new Error('headline: o texto não cabe na capa; encurte as linhas.');

  const lineHeight = Math.round(fontSize * 1.1);
  const blockHeight = lineHeight * (lines.length - 1) + fontSize * 0.72;
  const firstBaseline = Math.round(H / 2 - blockHeight / 2 + fontSize * 0.72 + 6);
  const headlineSvg = lines
    .map((line, i) => {
      const y = firstBaseline + i * lineHeight;
      const parts = [];
      let band = '';
      if (line.mark) {
        // Faixa de `public/images/highlight.svg` (363×56), esticada sobre o trecho.
        const padX = fontSize * 0.09;
        const bx = PAD + widths[i].start - padX;
        const bw = widths[i].mark + padX * 2;
        const by = y - fontSize * 0.8;
        const bh = fontSize * 1.02;
        band =
          `<path d="M5.04167 13C70.5833 3 171.417 17 357.958 7L358.967 45C242 56 121 42 4.03333 51L5.04167 13Z"` +
          ` fill="${C.accent}" transform="translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${(bw / 363).toFixed(4)} ${(bh / 56).toFixed(4)})"/>`;
        parts.push(escapeXml(line.before), `<tspan fill="${C.ink950}">${escapeXml(line.mark)}</tspan>`, escapeXml(line.after));
      } else {
        parts.push(escapeXml(line.before));
      }
      return (
        `${band}<text x="${PAD}" y="${y}" font-family="${SERIF}" font-weight="600" font-size="${fontSize}"` +
        ` letter-spacing="${(-fontSize * 0.015).toFixed(2)}" fill="${C.paper}" xml:space="preserve">${parts.join('')}</text>`
      );
    })
    .join('');

  // Referências: a primeira no centro da órbita, as outras sobre ela.
  const positions = [{ cx: ORBIT.cx, cy: ORBIT.cy, r: CENTER_R }];
  for (const angle of SATELLITE_ANGLES[refs.length - 1] ?? []) {
    const rad = (angle * Math.PI) / 180;
    positions.push({
      cx: Math.round(ORBIT.cx + ORBIT.r * Math.cos(rad)),
      cy: Math.round(ORBIT.cy + ORBIT.r * Math.sin(rad)),
      r: SATELLITE_R,
    });
  }
  const refsSvg = (await Promise.all(refs.map((ref, i) => refElement(ref, positions[i], i)))).join('');

  // Ponto laranja da órbita num trecho livre (como na fig-01).
  const dotAngle = (-142 * Math.PI) / 180;
  const dot = { x: ORBIT.cx + ORBIT.r * Math.cos(dotAngle), y: ORBIT.cy + ORBIT.r * Math.sin(dotAngle) };

  const logo = await readFile(join(ROOT, 'public/brand/logo-dark.svg'), 'utf8');
  const logoHeight = 26;
  const logoWidth = (178 / 22) * logoHeight;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.ink950}"/>
  <path d="M300 0V${H} M600 0V${H} M900 0V${H} M0 225H${W} M0 450H${W}" stroke="${C.ink800}" stroke-width="1"/>
  <path d="M${PAD - 8} ${PAD - 40} h16 M${PAD} ${PAD - 48} v16 M1112 612 h16 M1120 604 v16" stroke="${C.ink600}" stroke-width="2"/>
  <circle cx="${ORBIT.cx}" cy="${ORBIT.cy}" r="${ORBIT.r + 112}" fill="none" stroke="${C.ink800}" stroke-width="1"/>
  <circle cx="${ORBIT.cx}" cy="${ORBIT.cy}" r="${ORBIT.r}" fill="none" stroke="${C.accent}" stroke-width="2"/>
  <circle cx="${dot.x.toFixed(1)}" cy="${dot.y.toFixed(1)}" r="6" fill="${C.accent}"/>
  ${refsSvg}
  <text x="${PAD}" y="${PAD + 16}" font-family="${MONO}" font-weight="500" font-size="17" letter-spacing="1.4" fill="${C.ink400}">${escapeXml(kicker)}</text>
  ${headlineSvg}
  <svg x="${PAD}" y="${H - PAD - logoHeight + 8}" width="${logoWidth.toFixed(1)}" height="${logoHeight}" viewBox="0 0 178 22">${logo.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')}</svg>
  ${credit ? `<text x="${W - 24}" y="${H - 20}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.ink500}">${escapeXml(credit)}</text>` : ''}
</svg>`;
}

/** PNG com paleta: a capa tem poucas cores (cinzas + laranja), então fica leve sem perder nitidez. */
export async function renderCover(svg) {
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 95, effort: 10, dither: 0.6 }).toBuffer();
}

async function findLogos(term) {
  const query = term.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const rows = [];
  for (const [source, dir] of Object.entries(ICON_SOURCES)) {
    for (const file of await readdir(dir)) {
      const slug = file.replace(/\.svg$/, '');
      if (!file.endsWith('.svg') || !slug.includes(query) || /-(color|brand-color)$/.test(slug)) continue;
      const raw = await readFile(join(dir, file), 'utf8');
      const title = /<title>([^<]*)<\/title>/.exec(raw)?.[1] ?? '';
      rows.push(`${source}:${slug}`.padEnd(36) + title);
    }
  }
  console.log(rows.length ? rows.slice(0, 60).join('\n') : `Nenhum logotipo com "${term}". Use { "text": "Nome" }.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--find') {
    if (!args[1]) throw new Error('Informe o termo: node scripts/cover.mjs --find <termo>');
    return findLogos(args[1]);
  }
  const slug = (args.find((a) => !a.startsWith('--')) ?? '').trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Uso: node scripts/cover.mjs <slug> [--apply] | --find <termo>');
  }
  const specFile = join(SPECS_DIR, `${slug}.json`);
  const postFile = join(POSTS_DIR, `${slug}.mdx`);
  if (!existsSync(specFile)) throw new Error(`Especificação não encontrada: ${relative(ROOT, specFile)}`);
  if (!existsSync(postFile)) throw new Error(`Edição não encontrada: ${relative(ROOT, postFile)}`);

  const spec = JSON.parse(await readFile(specFile, 'utf8'));
  const post = await readFile(postFile, 'utf8');
  const { data } = parseFrontmatter(post);
  const { refs, specChanged } = await prepareRefs(spec, slug);
  if (specChanged) await writeFile(specFile, `${JSON.stringify(spec, null, 2)}\n`);

  const credit = refs.find((r) => r.kind === 'photo')?.credit;
  const svg = await buildCoverSvg({ headline: spec.headline, refs, kicker: formatKicker(data), credit });
  const png = await renderCover(svg);

  const outFile = join(COVERS_DIR, slug, 'coverImage.png');
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, png);
  const publicPath = `/images/covers/${slug}/coverImage.png`;
  console.log(`✔ Capa gerada: ${relative(ROOT, outFile)} (${Math.round(png.length / 1024)} KB)`);
  console.log(`  Referências: ${refs.map((r) => r.label).join(', ')}`);
  if (credit) console.log(`  Crédito (inclua nas Fontes da edição): ${credit}`);

  if (args.includes('--apply')) {
    await writeFile(postFile, applyCoverImage(post, publicPath));
    console.log(`✔ coverImage: ${publicPath} gravado em ${relative(ROOT, postFile)}`);
  } else {
    console.log(`  Para usar: coverImage: ${publicPath} no frontmatter (ou rode com --apply).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`✖ ${error.message}`);
    process.exit(1);
  });
}
