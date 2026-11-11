# WordWell

A flashcard app for learning English vocabulary, one word at a time.

- **5,005 words**, A1–C1: the full American Oxford 3000 and 5000, plus everyday American words labeled "Supplemental".
- **Front of the card:** the word, part of speech, American pronunciation (IPA) and a listen button (or press **P**).
- **Back of the card:** the meaning in English, Ukrainian or German, and an example sentence.
- Filter by CEFR level and part of speech, search, browse with arrow keys or swipes.
- All content uses American English. What changed and when: the in-app **What's new** page (`/changelog`).

Built with Next.js 16 (App Router), React 19 and the React Compiler; deployed on Vercel with Speed Insights.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build (use this, not `dev`, for Lighthouse) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

## Project layout

- `src/app/page.tsx` — the app (a single client component)
- `src/app/globals.css` — all styles
- `src/app/changelog/page.tsx` — the "What's new" page
- `src/app/*.json` — word data (below)

## Word data

All files are in `src/app/` and keyed by the headword.

| File | Contents |
|---|---|
| `american-oxford-3000-words.json` | Oxford 3000 words with part of speech, CEFR level and English meaning |
| `american-oxford-5000-extra-words.json` | The Oxford 5000's additional B2/C1 words |
| `supplemental-words.json` | Everyday American words not on the Oxford lists |
| `examples-en.json` | An example sentence for each word |
| `pronunciations-us.json` | American IPA for each word |
| `meanings-uk.json`, `meanings-de.json` | Ukrainian and German meanings |

**Where it comes from:** the word list and CEFR levels follow Oxford's Oxford 3000/5000 lists, with British spellings and words converted to American English. The meanings, translations, example sentences and IPA were written for WordWell; no third-party dictionary data is included.
