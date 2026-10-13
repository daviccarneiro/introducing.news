/**
 * Tempo de leitura das edições: uma única conta para o site (`posts.ts`),
 * os scripts e os testes. Conta as palavras do corpo MDX inteiro (tabelas,
 * links e Fontes incluídos) a 200 palavras por minuto.
 */
export const WORDS_PER_MINUTE = 200;

/** Limite das edições semanais a partir da #2 (o ideal fica entre 8 e 10). */
export const MAX_READING_MINUTES = 10;

/** @param {string | undefined} body */
export function countWords(body) {
  const text = (body ?? '').trim();
  return text ? text.split(/\s+/).length : 0;
}

/** @param {string | undefined} body */
export function readingMinutes(body) {
  return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE));
}
