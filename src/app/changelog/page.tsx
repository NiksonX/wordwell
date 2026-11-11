import type { Metadata } from "next";
import Link from "next/link";
import { releases } from "./releases";

export const metadata: Metadata = {
  title: "Changelog | WordWell",
  description: "What's new in WordWell.",
};

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

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
              <h2><time dateTime={release.date}>{formatDate(release.date)}</time></h2>
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
