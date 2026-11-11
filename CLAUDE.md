# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@README.md

**Required:** every user-visible change must also be added to the changelog (`src/app/changelog/releases.ts`) — see "Changelog (required)" in AGENTS.md for the format.

## Verifying changes

There is no test suite; `npm run build` plus a type check is the baseline. Verify UI changes in a real browser at several widths (at least 1306, 390 and 320px) — layouts change at the 760px, 420px and 360px breakpoints and by viewport height (card height uses container queries). `npm run lint` reports one known warning (unused `toggleSaved` — the save button is commented out in the controls).

## Architecture internals

- `page.tsx` holds `Home` plus helpers in the same file: data merging, part-of-speech filtering, the virtualized word list (`WordList`, fixed `wordRowHeight = 48`), speech synthesis, keyboard/swipe handling. Saved words live in `localStorage` via `useSyncExternalStore`.
- `globals.css` is plain CSS with tokens on `:root` (`--green`, `--coral`, `--ink`, `--paper`…); Tailwind is imported but JSX class names are semantic, not utilities. Font sizes are in `rem`.
- Icons use Next file conventions (`icon.png`, `apple-icon.png`); there is intentionally no `favicon.ico`.
- `robots.ts` and `sitemap.ts` are generated metadata routes; the production URL lives in `site.ts` (`siteUrl`). The sitemap's `lastModified` is the newest date in `changelog/releases.ts`.

### Word data internals

- The three word-list JSONs are in the main bundle; `examples-en.json` and `pronunciations-us.json` are lazy-loaded; `meanings-uk/de.json` load on language switch. Supplemental words are merged with `supplemental: true`.
- Keys are the exact headword string, including list markers: `"bank (money)"`, `"lead1"`, `"a, an"`. A new word needs an entry in every keyed file. `spokenForm()` / `headwordParts()` strip the markers for speech and display.
- `curatedWords` in `page.tsx` (~20 hand-written entries) override meaning/translations/example inline; their British IPA field is not displayed.
- Levels are A1–C1 (`WordLevel`); level tag colors are `.level-a1` … `.level-c1`.
- Lazy files load on idle **or** on the first pointer/key interaction (effect in `Home`); the back of the card renders a same-size placeholder until `examplesLoaded`, and a language switch keeps the current language until the new file has arrived (`pendingLanguage`). Preserve these — they prevent layout jumps and an "English flash".
- Keep content original: don't import third-party dictionary data (e.g. CMU dict) that would require shipping a license notice.

## Gotchas

- **Card faces are `<div>`s, not buttons**, so the listen button (`.card-speak`) can live inside the front face next to the IPA. Its click calls `stopPropagation()` so it doesn't flip the card. The face turned away gets `aria-hidden` + `inert`. Keyboard flipping is via the Reveal button, Space and arrow keys; `P` speaks. Space/Enter on a focused button is left to that button.
- **Speech** uses the browser's `speechSynthesis`; `bestAmericanVoice()` ranks voices (natural/premium/Google first, novelty voices excluded). No audio files ship with the app.
- **iOS Safari 3D card**: see the comment above `.card-face` in CSS — don't give card-face children their own z-index/compositing layers.
- **LCP**: the `card-arrive` animation must not start from `opacity: 0`. `experimental.inlineCss` is on in `next.config.ts`.
- **Shared sizing**: `.card-speak` follows `.icon-button` sizing at every breakpoint (ghost/icon-only variant); the two filter chip rows share one 5-column grid; the list toolbar's right padding equals the word list's scrollbar lane (12px) + row padding (10px). Change these together.
