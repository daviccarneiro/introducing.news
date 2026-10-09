import { parse } from 'yaml';

/** Lê o frontmatter YAML do CMS sem interpretar código ou alterar o corpo MDX. */
export function parseFrontmatter(raw) {
  const source = String(raw).replace(/^\uFEFF/, '');
  const opening = /^---[ \t]*\r?\n/.exec(source);
  if (!opening) return { data: {}, content: source };

  const rest = source.slice(opening[0].length);
  const closing = /^---[ \t]*\r?$/m.exec(rest);
  if (!closing) throw new Error('Frontmatter YAML sem delimitador de fechamento.');

  const data = parse(rest.slice(0, closing.index)) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('O frontmatter YAML deve ser um mapa de campos.');
  }

  return {
    data,
    content: rest.slice(closing.index + closing[0].length).replace(/^\n/, ''),
  };
}
