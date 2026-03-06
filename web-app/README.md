# Leitor Neural Pessoal

Leitor web em Next.js para abrir URLs, texto colado e PDFs, traduzir para portugues e reproduzir audio online com voz natural.

## Stack atual

- Frontend: Next.js App Router
- Extracao de artigo: `@mozilla/readability`
- Extracao de PDF: `pdfjs-dist` no navegador com fallback server-side via `unpdf`
- Traducao: endpoint compativel com LibreTranslate
- Voz online: `node-edge-tts`
- Rate limit opcional: Upstash Redis

## Ambiente

Copie os nomes abaixo para a Vercel ou para `.env.local`:

```env
LIBRETRANSLATE_URL=
LIBRETRANSLATE_API_KEY=
EDGE_TTS_VOICE_DEFAULT=pt-BR-FranciscaNeural
EDGE_TTS_TIMEOUT_MS=15000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Notas:

- `LIBRETRANSLATE_URL` e obrigatorio para a traducao funcionar.
- `LIBRETRANSLATE_API_KEY` e opcional, dependendo do provedor.
- `EDGE_TTS_VOICE_DEFAULT` e opcional. Se faltar, o app usa `pt-BR-FranciscaNeural`.
- `UPSTASH_*` e opcional. Sem isso, o rate limit fica desligado.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Diagnostico

Use:

- `/api/debug-env` para conferir se o deploy enxerga `translation`, `speech` e `ratelimit`
- `/api/translate` para a traducao server-side
- `/api/tts` para gerar audio MP3 no servidor

## Validacao local

Os fluxos abaixo foram validados neste workspace:

- `npx tsc --noEmit`
- `npm run build`
- `node-edge-tts` gerando MP3 em Node sem depender do navegador

O `npm run lint` global ainda acusa problemas antigos em `public/pdf.worker.min.mjs`, que e um arquivo gerado e nao faz parte desta migracao.
