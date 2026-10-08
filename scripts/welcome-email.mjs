#!/usr/bin/env node
/**
 * E-mail de boas-vindas — enviado 5 minutos após a inscrição, uma única vez.
 *
 * O layout é o mesmo do e-mail da edição (`templateHtml`, em
 * `scripts/email-template.mjs`); o que muda são os valores das variáveis.
 * Este arquivo é a fonte de verdade do texto.
 *
 * `scripts/resend-welcome.mjs` publica o template e cria a automação no Resend:
 * evento `newsletter.subscribed` → espera 5 minutos → envia este template.
 */
import { readFileSync } from 'node:fs';
import { SERIF, TAGLINE, avatarHtml } from './email-template.mjs';

export const WELCOME_TEMPLATE_NAME = 'introducing.news · boas-vindas';
export const WELCOME_TEMPLATE_ALIAS = 'introducing-news-boas-vindas';
export const WELCOME_TEMPLATE_SUBJECT = 'Obrigado por assinar a introducing.news';
export const WELCOME_EVENT_NAME = 'newsletter.subscribed';
export const WELCOME_AUTOMATION_NAME = 'introducing.news · boas-vindas';
export const WELCOME_FROM = 'introducing.news <oi@introducing.news>';
export const WELCOME_DELAY = '5 minutes';

const SITE = 'https://introducing.news';

const author = JSON.parse(
  readFileSync(new URL('../src/content/authors/davi-carneiro.json', import.meta.url), 'utf8'),
);

const paragraph = (html) =>
  `<p style="margin:0 0 16px 0;font-family:${SERIF};font-size:18px;line-height:1.7;color:#0B0B0C;">${html}</p>`;

const letterHtml = [
  paragraph(
    'Todo dia aparece uma ferramenta nova, um modelo novo e uma discussão nova. Acompanhar tudo isso sozinho toma tempo, e boa parte do que circula é raso ou simplesmente errado.',
  ),
  paragraph(
    'A introducing.news existe para resolver isso: um grupo de <strong style="font-weight:600;">profissionais de tecnologia de várias frentes, de programadores e product managers a CEOs, e de professores e pesquisadores</strong>, todos com mais de cinco anos de experiência na área. Não é uma pessoa opinando sobre tudo, é curadoria com cuidado, edição a edição.',
  ),
  paragraph(
    'A presença de professores e pesquisadores é o que garante o rigor: eles testam as ferramentas a fundo, não de forma rasa, e checam cada informação antes de compartilhar. O foco não está nas ferramentas, e sim na informação: que ela seja verdadeira, útil no dia a dia e que de fato importe.',
  ),
  paragraph(
    'Toda segunda você recebe os destaques da semana, o contexto que costuma faltar e as fontes para conferir. Direto ao ponto, sem hype.',
  ),
  paragraph('Se tiver uma sugestão, é só responder este e-mail.'),
].join('');

/** Valores de fallback do template no Resend (o preview do painel usa estes). */
export const welcomeVariables = {
  LANG: 'pt-BR',
  TAGLINE,
  DATE: 'Boas-vindas',
  TITLE: 'Que bom ter você aqui',
  DESCRIPTION: 'Obrigado por assinar. Antes da próxima edição, um pouco sobre por que a introducing.news existe.',
  BODY: letterHtml,
  CTA_LABEL: 'Ler a última edição',
  CTA_URL: `${SITE}/arquivo/`,
  SIGN_OFF: 'Um abraço,',
  SIGNATURE_AVATAR: avatarHtml(author, SITE),
  SIGNATURE_NAME: author.name,
  SIGNATURE_ROLE_LINE: author.role
    ? `<p style="margin:2px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#9A9AA4;">${author.role}</p>`
    : '',
  FOOT_MESSAGE: 'Você recebe este e-mail porque se inscreveu na introducing.news.',
  UNSUBSCRIBE_LABEL: 'cancelar inscrição',
  UNSUBSCRIBE_URL: '{{{RESEND_UNSUBSCRIBE_URL}}}',
  SITE_URL: SITE,
};

export const welcomeTemplateVariables = Object.entries(welcomeVariables).map(
  ([key, fallback_value]) => ({ key, type: 'string', fallback_value }),
);
