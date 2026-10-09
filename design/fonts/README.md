# Fontes da marca

Arquivos variáveis (TrueType) das famílias usadas no site, no Figma e nos e-mails.
Todas são licenciadas sob a **SIL Open Font License 1.1** (uso livre, inclusive comercial; mantidas as licenças).

| Arquivo | Família | Uso | Origem |
| --- | --- | --- | --- |
| `SourceSerif4[opsz,wght].ttf` | Source Serif 4 | Títulos e leitura longa | [google/fonts · ofl/sourceserif4](https://github.com/google/fonts/tree/main/ofl/sourceserif4) |
| `SourceSerif4-Italic[opsz,wght].ttf` | Source Serif 4 Italic | Citações | idem |
| `Geist[wght].ttf` | Geist | Interface e textos curtos | [google/fonts · ofl/geist](https://github.com/google/fonts/tree/main/ofl/geist) |
| `GeistMono[wght].ttf` | Geist Mono | Código | [google/fonts · ofl/geistmono](https://github.com/google/fonts/tree/main/ofl/geistmono) |
| `JetBrainsMono[wght].ttf` | JetBrains Mono | Rótulos e numerais | [google/fonts · ofl/jetbrainsmono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono) |
| `Inter[opsz,wght].ttf` | Inter | Apenas o logotipo (600) | [google/fonts · ofl/inter](https://github.com/google/fonts/tree/main/ofl/inter) |

Pesos usados pelo site: Source Serif 4 400/600 (+ itálico 400), Geist 400/500/600, JetBrains Mono 400/500, Geist Mono 400, Inter 600.

Os textos de licença de cada família estão nesta pasta: `OFL-SourceSerif4.txt`, `OFL-Geist.txt`, `OFL-GeistMono.txt`, `OFL-JetBrainsMono.txt` e `OFL-Inter.txt`.

No site as fontes são carregadas via Google Fonts (`src/layouts/Base.astro`). No Figma, as mesmas famílias estão disponíveis no seletor de fontes. Para renderizar localmente (ex.: gerar imagens ou PDFs), instale os TTFs desta pasta ou aponte a ferramenta para eles.
