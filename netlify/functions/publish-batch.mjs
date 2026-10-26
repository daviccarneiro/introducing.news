/**
 * Função agendada da Netlify: aciona o workflow "Publicar batch" na segunda.
 *
 * O cron do GitHub não é confiável (em 12/10/2026 não disparou; em 19/10
 * chegou cinco horas atrasado; em 26/10 não rodou até as 14:00), e uma
 * edição aprovada antes do meio-dia depende dele para sair. Esta função
 * dispara o workflow por `repository_dispatch` às 12:01, 13:01 e 14:01
 * (Brasília); depois que a edição sai, a triagem não acha nada e o
 * workflow termina sem publicar nem enviar de novo.
 *
 * O `repository_dispatch` aceita o token fine-grained do bot de aprovação
 * (`Contents: Read and write`). Sem ele (dev, staging), não faz nada.
 */
const REPO = 'daviccarneiro/introducing.news';

export default async () => {
  const token = process.env.GITHUB_CONTENTS_TOKEN;
  if (!token) return new Response(null, { status: 204 });

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'introducing.news-batch',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'publish-batch' }),
    });
    console.log(`[publish-batch] repository_dispatch: ${response.status} ${await response.text()}`);
    return new Response(null, { status: response.ok ? 200 : 502 });
  } catch (error) {
    console.error('[publish-batch] falha ao acionar o workflow:', error);
    return new Response(null, { status: 502 });
  }
};

// Segundas, 12:01, 13:01 e 14:01 em Brasília (UTC-3, sem horário de verão).
export const config = { schedule: '1 15-17 * * 1' };
