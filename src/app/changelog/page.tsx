import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog | WordWell",
  description: "What's new in WordWell.",
};

type Release = { date: string; label: string; changes: string[] };

// Newest first. Dates are ISO (YYYY-MM-DD); `label` is how the date is shown.
const releases: Release[] = [
  {
    date: "2026-11-10",
    label: "November 10, 2026",
    changes: [
      "The listen button moved onto the card, right next to the pronunciation. Tap it to hear the word without flipping the card.",
      "The listen button is now just the speaker icon, with the same large tap area as the arrow buttons.",
      "The arrow buttons have the same rounded shape on desktop and on phones.",
      "On phones, the top bar stays in place while you scroll, so the language switch is always within reach.",
      "The “Word garden” and “Small words. Big world.” headings now line up exactly.",
      "Better for screen readers and keyboards: the hidden side of the card is no longer read aloud, and Space or Enter presses the focused button.",
    ],
  },
  {
    date: "2026-11-09",
    label: "November 9, 2026",
    changes: [
      "A new “w.” icon in the browser tab and on the iPhone home screen.",
      "A more natural pronunciation voice: WordWell now picks the best American English voice your browser offers.",
    ],
  },
  {
    date: "2026-11-06",
    label: "November 6, 2026",
    changes: [
      "5,005 words: the full American Oxford 5000, including the new C1 level, plus everyday American words marked “Supplemental”.",
      "An example sentence for every word, shown under “In a sentence”.",
      "American pronunciation (IPA) on every card, and a listen button. Press P to hear the word.",
      "Filter by part of speech (noun, verb, adjective…). Tap an active filter again to clear it.",
      "Spelling and wording switched to American English.",
      "Faster loading and smoother card flips: the example sentence no longer pops in late.",
      "Larger, easier-to-read text on phones.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="app-shell changelog-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="WordWell home">
          <span className="brand-mark" aria-hidden="true">w.</span>
          <span>Wordwell</span>
        </Link>
        <Link className="changelog-back" href="/">← Back to the deck</Link>
      </header>

      <section className="changelog">
        <p className="eyebrow">WHAT&apos;S NEW</p>
        <h1>Changelog</h1>

        <ol className="changelog-list">
          {releases.map((release) => (
            <li className="changelog-release" key={release.date}>
              <h2><time dateTime={release.date}>{release.label}</time></h2>
              <ul>
                {release.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
