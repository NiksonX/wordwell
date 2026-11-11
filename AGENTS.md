<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Changelog (required)

Every change a WordWell user can notice must be added to the changelog in the same piece of work — don't wait to be asked.

- File: `src/app/changelog/releases.ts`, the `releases` array (newest first). Shown at `/changelog` ("What's new"); the newest date also becomes the sitemap's `lastmod`.
- Today's date already has an entry → add a bullet to it; otherwise add a new entry at the top with `date: "YYYY-MM-DD"` (ISO; the page displays it as DD/MM/YYYY).
- Write for learners, not developers: one plain sentence per change, describing what they'll see or can do ("The listen button moved onto the card…"), not how it was implemented. American English.
- Skip changes users can't notice (refactors, lint fixes, comments, tooling, docs such as this file).

## Lighthouse 100 (required)

WordWell scores **100 / 100 / 100 / 100** in Lighthouse (desktop) — Performance, Accessibility, Best Practices and SEO. Every change must keep all four at the top level:

- **Performance** — keep each metric in the green: Speed Index (SI), First Contentful Paint (FCP), Largest Contentful Paint (LCP), Total Blocking Time (TBT) and Cumulative Layout Shift (CLS).
- **Accessibility** — contrast, labels, focus states, `aria-*`/`inert` on the hidden card face.
- **Best Practices** — no console errors, no deprecated APIs.
- **SEO** — metadata, `robots.txt`, `sitemap.xml`, valid links.

Measure the **production build**, not `npm run dev` (dev mode adds devtools, unminified code and a WebSocket that Lighthouse flags):

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000 --preset=desktop --view   # also run once without --preset for mobile
```

A localhost run may show a lower simulated mobile LCP than real devices; compare with the deployed site (https://word-well.vercel.app) before treating it as a regression. The one expected local console error is the 404 for `/_vercel/speed-insights/script.js` (it only exists on Vercel).
