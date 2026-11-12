"use client";

import { memo, useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

import type { MeaningLanguage, TranslationLanguage, Translations, Word, WordLevel } from "./words";

const meaningLanguageNames: Record<MeaningLanguage, string> = {
  en: "English",
  uk: "Ukrainian",
  de: "German",
};

// Translations are split out of the main bundle (~55 KB gzipped) and fetched only when a learner picks that language.
const translationLoaders: Record<TranslationLanguage, () => Promise<Translations>> = {
  uk: () => import("./meanings-uk.json").then((module) => module.default as Translations),
  de: () => import("./meanings-de.json").then((module) => module.default as Translations),
};
// Example sentences for the full list (~49 KB gzipped) are also split out and fetched after first render.
const loadExamples = () => import("./examples-en.json").then((module) => module.default as Record<string, string>);
// American IPA for every word, written for this app (loaded after first render, like the example sentences).
const loadPronunciations = () => import("./pronunciations-us.json").then((module) => module.default as Record<string, string>);

// Headwords carry list markers ("bank (money)", "lead1", "a, an"); speak only the word itself.
function spokenForm(word: string) {
  return word.replace(/\s*\(.*?\)/g, "").replace(/\s*\d+$/, "").replace(/\s+\d+\b/, "").trim();
}

// "match (contest/correspond)" -> big "match" with a small "(contest/correspond)" note under it.
function headwordParts(word: string) {
  const match = word.match(/^(.*?)\s*(\(.*\))$/);
  return match ? { main: match[1], note: match[2] } : { main: word, note: "" };
}

function subscribeToNothing() {
  return () => {};
}

// Voice quality varies a lot between browsers. Rank what the device offers and take the most natural one:
// neural/premium voices (Edge "Natural", Chrome "Google", Apple "Premium"/"Enhanced") beat the basic built-ins.
const noveltyVoices = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|eddy|flo|reed|sandy|shelley)\b/i;

function voiceScore(voice: SpeechSynthesisVoice) {
  const name = voice.name;
  if (noveltyVoices.test(name)) return -1;
  let score = 0;
  // Chrome (desktop, Android): Google's voice always wins when the browser has it.
  if (/^google us english/i.test(name)) score += 1000;
  // Edge: Microsoft's neural "Natural" voices. Apple (Safari on Mac/iPhone): downloaded Premium, then Enhanced voices.
  if (/natural|neural/i.test(name)) score += 300;
  if (/premium/i.test(name)) score += 250;
  if (/enhanced|siri/i.test(name)) score += 200;
  // Among Apple's standard voices, the newer ones sound most natural.
  const apple = name.match(/\b(ava|zoe|evan|nathan|allison|susan|joelle|noelle|nicky|aaron|tom|samantha)\b/i)?.[1].toLowerCase();
  const appleRank: Record<string, number> = { ava: 40, zoe: 36, evan: 34, nathan: 32, allison: 30, susan: 28, joelle: 26, noelle: 26, nicky: 24, aaron: 22, tom: 21, samantha: 20 };
  if (apple) score += appleRank[apple];
  if (!voice.localService) score += 10; // online voices are usually higher quality
  if (voice.default) score += 1;
  return score;
}

function rankedAmericanVoices(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((voice) => voice.lang.replace("_", "-") === "en-US")
    .map((voice) => ({ voice, score: voiceScore(voice) }))
    .filter(({ score }) => score >= 0)
    .sort((left, right) => right.score - left.score)
    .map(({ voice }) => voice);
}

// Browsers fill the voice list asynchronously, and Chrome adds its online "Google" voices only after the local
// ones — so a non-empty list can still be missing the voice we want. Wait briefly for an online voice, but only
// once per visit: browsers without online voices (Safari, Firefox) must not pay the delay on every tap.
let voicesSettled = false;

function loadVoices(synth: SpeechSynthesis) {
  const hasOnlineVoice = () => synth.getVoices().some((voice) => !voice.localService);
  if (voicesSettled || hasOnlineVoice()) return Promise.resolve(synth.getVoices());
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const finish = () => {
      voicesSettled = true;
      synth.removeEventListener("voiceschanged", onChange);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const onChange = () => { if (hasOnlineVoice()) finish(); };
    const timer = setTimeout(finish, 700);
    synth.addEventListener("voiceschanged", onChange);
  });
}

function speakAmerican(text: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  void loadVoices(synth).then((voices) => {
    const ranked = rankedAmericanVoices(voices);
    const speakWith = (voice: SpeechSynthesisVoice | null) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.voice = voice;
      // A touch slower than normal speech, so a learner can hear each sound.
      utterance.rate = 0.88;
      // Online voices ("Google US English") need the network: if one fails, say it with the best voice on the device.
      utterance.addEventListener("error", (event) => {
        if (event.error === "interrupted" || event.error === "canceled" || !voice || voice.localService) return;
        speakWith(ranked.find((candidate) => candidate.localService) ?? null);
      });
      synth.speak(utterance);
    };
    speakWith(ranked[0] ?? null);
  });
}


const WordRow = memo(function WordRow({ item, itemIndex, selected, onSelect }: {
  item: Word;
  itemIndex: number;
  selected: boolean;
  onSelect: (itemIndex: number) => void;
}) {
  return (
    <button className={`word-row ${selected ? "selected" : ""}`} onClick={() => onSelect(itemIndex)}>
      <span className="word-row-name">{item.word}<small>{item.supplemental ? "Supplemental · " : ""}{item.senses.map((sense) => sense.part).join(", ")}</small></span>
      <span className={`row-level level-${item.levels[0].toLowerCase()}`}>{item.levels.join("/")}</span>
    </button>
  );
});

const wordRowHeight = 48;
const wordListOverscan = 8;

// Renders only the rows in (and just around) the scroll viewport, so the DOM stays
// small even though the deck holds ~5,000 words.
function WordList({ deck, total, currentIndex, onSelect, resetKey }: {
  deck: Word[];
  /** Rows the scroll area represents (the full deck size while the full list is still loading). */
  total: number;
  currentIndex: number;
  onSelect: (itemIndex: number) => void;
  resetKey: string;
}) {
  const listRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(360);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => setViewportHeight(list.clientHeight));
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Scrolling to the top fires a scroll event, which resets scrollTop state.
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [resetKey]);

  const start = Math.min(deck.length, Math.max(0, Math.floor(scrollTop / wordRowHeight) - wordListOverscan));
  const end = Math.min(deck.length, Math.ceil((scrollTop + viewportHeight) / wordRowHeight) + wordListOverscan);

  return (
    <nav ref={listRef} className="word-list" aria-label="Words in this deck" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      {deck.length ? (
        <div className="word-list-spacer" style={{ height: total * wordRowHeight }}>
          <div className="word-list-window" style={{ transform: `translateY(${start * wordRowHeight}px)` }}>
            {deck.slice(start, end).map((item, offset) => (
              <WordRow key={item.word} item={item} itemIndex={start + offset} selected={start + offset === currentIndex} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ) : <p className="empty-list">No words found. Try another level or search.</p>}
    </nav>
  );
}

const levels: WordLevel[] = ["A1", "A2", "B1", "B2", "C1"];
type LevelFilter = "All" | WordLevel;
const partsOfSpeech = ["Noun", "Verb", "Adj", "Adv", "Other"] as const;
type PartOfSpeech = (typeof partsOfSpeech)[number];
type PartFilter = "All" | PartOfSpeech;


function partGroups(part: string): Set<PartOfSpeech> {
  const groups = new Set<PartOfSpeech>();
  for (const piece of part.toLowerCase().split(/[,/]/)) {
    const label = piece.trim();
    if (!label) continue;
    if (/^(n|noun)\.?$/.test(label) || label === "noun") groups.add("Noun");
    else if (/(^|\s)v\.?$|verb/.test(label)) groups.add("Verb");
    else if (/^adj/.test(label)) groups.add("Adj");
    else if (/^adv/.test(label)) groups.add("Adv");
    else groups.add("Other");
  }
  return groups;
}

// Part-of-speech labels repeat a lot ("n.", "v."…): parse each distinct label once.
const partGroupCache = new Map<string, Set<PartOfSpeech>>();
function groupsForPart(part: string) {
  let groups = partGroupCache.get(part);
  if (!groups) partGroupCache.set(part, (groups = partGroups(part)));
  return groups;
}

// Lowercased search text per word, built on first use (works for both the initial and the full word list).
const searchTextCache = new WeakMap<Word, string>();
function searchText(item: Word) {
  let text = searchTextCache.get(item);
  if (text === undefined) {
    text = `${item.word} ${item.senses.map((sense) => sense.part).join(" ")} ${item.meaning}`.toLowerCase();
    searchTextCache.set(item, text);
  }
  return text;
}

// The full deck is a separate chunk: the server prerenders the first card from `initialWords`, and the
// client fetches the rest on idle or on the first interaction (whichever comes first), off the critical path.
const loadAllWords = () => import("./words").then((module) => module.words);

function matchesFilters(item: Word, level: LevelFilter, part: PartFilter) {
  if (part === "All") return level === "All" || item.levels.includes(level);
  return item.senses.some((sense) => (
    (level === "All" || sense.level === level) && groupsForPart(sense.part).has(part)
  ));
}
// const contactEmail = "mock@mail.com";
const savedWordsKey = "wordwell-saved";
const savedWordsEvent = "wordwell:saved-words";

function subscribeToSavedWords(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(savedWordsEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(savedWordsEvent, onChange);
  };
}

function getSavedWordsSnapshot() {
  return window.localStorage.getItem(savedWordsKey) ?? "[]";
}

function getServerSavedWordsSnapshot() {
  return "[]";
}

export default function Home({ initialWords, totalWords }: {
  /** The first words of the deck, enough for the first card and the visible list rows. */
  initialWords: Word[];
  /** Size of the full deck, shown before the full list has loaded. */
  totalWords: number;
}) {
  const [allWords, setAllWords] = useState<Word[] | null>(null);
  const [level, setLevel] = useState<LevelFilter>("All");
  const [part, setPart] = useState<PartFilter>("All");
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [meaningLanguage, setMeaningLanguage] = useState<MeaningLanguage>("en");
  const [loadedTranslations, setLoadedTranslations] = useState<Partial<Record<TranslationLanguage, Translations>>>({});
  const [examples, setExamples] = useState<Record<string, string>>({});
  const [pronunciations, setPronunciations] = useState<Record<string, string>>({});
  const [examplesLoaded, setExamplesLoaded] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<TranslationLanguage | null>(null);
  // The language the learner asked for most recently; a slower earlier request must not win.
  const requestedLanguage = useRef<MeaningLanguage>("en");
  const canSpeak = useSyncExternalStore(subscribeToNothing, () => "speechSynthesis" in window, () => false);
  const savedSnapshot = useSyncExternalStore(subscribeToSavedWords, getSavedWordsSnapshot, getServerSavedWordsSnapshot);
  const saved = useMemo(() => JSON.parse(savedSnapshot) as string[], [savedSnapshot]);
  const [showSaved, setShowSaved] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const deferredQuery = useDeferredValue(query);
  const deck = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const savedSet = new Set(saved);
    return (allWords ?? initialWords).filter((item) => (
      matchesFilters(item, level, part)
      && (!needle || searchText(item).includes(needle))
      && (!showSaved || savedSet.has(item.word))
    ));
  }, [allWords, initialWords, deferredQuery, level, part, saved, showSaved]);
  // Until the full list arrives, the unfiltered deck shows the real total (nothing jumps when it loads).
  const filtering = level !== "All" || part !== "All" || deferredQuery.trim() !== "" || showSaved;
  const deckSize = allWords || filtering ? deck.length : totalWords;
  // Browsing counts against the full deck even before it has loaded; until then, a position beyond the first
  // words shows the last loaded one, and the right card appears as soon as the full list arrives.
  const currentIndex = !deck.length ? 0
    : index < deck.length ? index
    : allWords || filtering ? index % deck.length
    : deck.length - 1;
  const current = deck[currentIndex];
  const translatedMeaning = current && meaningLanguage !== "en"
    ? current.translations?.[meaningLanguage] ?? loadedTranslations[meaningLanguage]?.[current.word]
    : undefined;
  // Falls back to English while a translation file is loading or if a word has no translation.
  const activeMeaningLanguage: MeaningLanguage = translatedMeaning ? meaningLanguage : "en";
  const meaningText = translatedMeaning ?? current?.meaning;
  const exampleText = current && (current.example ?? examples[current.word]);
  const pronunciation = current && pronunciations[current.word];

  useEffect(() => {
    // Not needed for first paint, so wait for idle time; but the first touch, click or key press is a strong
    // hint the learner is about to flip, so start right away then. import() caches, so this runs only once.
    let started = false;
    let active = true;
    const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const;
    const load = () => {
      if (started) return;
      started = true;
      interactionEvents.forEach((type) => window.removeEventListener(type, load));
      // The first words came with the page; the full deck (browsing, search, filters) follows here.
      loadAllWords().then((loaded) => { if (active) setAllWords(loaded); }, () => {});
      loadPronunciations().then(setPronunciations, () => {});
      loadExamples().then((loaded) => { setExamples(loaded); setExamplesLoaded(true); }, () => setExamplesLoaded(true));
      // Ask for the voice list early: Chrome only starts fetching its online voices once someone asks.
      if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    };
    interactionEvents.forEach((type) => window.addEventListener(type, load, { once: true, passive: true }));
    // Safari has no requestIdleCallback.
    const hasIdle = "requestIdleCallback" in window;
    const idleId = hasIdle ? window.requestIdleCallback(load, { timeout: 2000 }) : 0;
    const timer = hasIdle ? undefined : setTimeout(load, 300);
    return () => {
      active = false;
      if (hasIdle) window.cancelIdleCallback(idleId);
      clearTimeout(timer);
      interactionEvents.forEach((type) => window.removeEventListener(type, load));
    };
  }, []);

  function chooseMeaningLanguage(language: MeaningLanguage) {
    requestedLanguage.current = language;
    if (language === "en" || loadedTranslations[language]) {
      setPendingLanguage(null);
      setMeaningLanguage(language);
      return;
    }
    // Swap only once the translation has arrived, so the card never flashes English in between.
    setPendingLanguage(language);
    translationLoaders[language]().then(
      (translations) => {
        setLoadedTranslations((loaded) => ({ ...loaded, [language]: translations }));
        if (requestedLanguage.current !== language) return;
        setPendingLanguage(null);
        setMeaningLanguage(language);
      },
      () => {
        if (requestedLanguage.current === language) setPendingLanguage(null);
      },
    );
  }

  const selectCard = useCallback((itemIndex: number) => {
    setIndex(itemIndex);
    setFlipped(false);
  }, []);

  function speakCurrent() {
    if (current && canSpeak) speakAmerican(spokenForm(current.word));
  }

  function flipCard(showMeaning: boolean) {
    setFlipped(showMeaning);
  }

  function moveCard(direction: -1 | 1) {
    if (!deck.length) return;
    // Keep the side the learner is studying (word or meaning) while browsing.
    setIndex((currentIndex) => (currentIndex + direction + deckSize) % deckSize);
  }

  // Used by the save button, which is commented out in the controls for now; keep it for when the button returns.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function toggleSaved(word: string) {
    const next = saved.includes(word)
      ? saved.filter((item) => item !== word)
      : [...saved, word];
    window.localStorage.setItem(savedWordsKey, JSON.stringify(next));
    window.dispatchEvent(new Event(savedWordsEvent));
  }

  function handleStageClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!current || (event.target as Element).closest(".card-face, .card-empty")) return;
    flipCard(!flipped);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < 48) return;

    event.preventDefault();
    moveCard(distance < 0 ? 1 : -1);
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement) return;
    // Space/Enter on a focused button (listen, filters…) should press that button, not flip the card.
    if (event.target instanceof HTMLButtonElement && (event.code === "Space" || event.key === "Enter")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCard(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCard(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.code === "Space") {
      event.preventDefault();
      flipCard(!flipped);
    } else if ((event.key === "p" || event.key === "P") && !event.metaKey && !event.ctrlKey && !event.altKey) {
      speakCurrent();
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleKeyDown(event);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link
          className="brand"
          href="/"
          aria-label="WordWell home"
          // Already home: go all the way to the top (Next only scrolls the page segment into view). Modified clicks (new tab) are left alone.
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}
        >
          <span className="brand-mark">w.</span>
          <span>Wordwell</span>
        </Link>
        <div className="topbar-right">
          <span className="daily-note"><span className="status-dot" /> A good day to learn a word</span>
          <Link className="source-link whats-new-link" href="/changelog">What&apos;s new</Link>
          <div className="language-toggle" role="group" aria-label="Meaning language">
            {(["en", "uk", "de"] as const).map((language) => (
              <button
                key={language}
                type="button"
                lang={language}
                aria-label={`Show meaning in ${meaningLanguageNames[language]}`}
                aria-pressed={meaningLanguage === language}
                aria-busy={pendingLanguage === language || undefined}
                className={pendingLanguage === language ? "is-loading" : undefined}
                title={`Show meaning in ${meaningLanguageNames[language]}`}
                // Warm the translation chunk on hover/focus; import() caches, so the click reuses it.
                onPointerEnter={language === "en" ? undefined : () => void translationLoaders[language]().catch(() => {})}
                onFocus={language === "en" ? undefined : () => void translationLoaders[language]().catch(() => {})}
                onClick={() => chooseMeaningLanguage(language)}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          {/* <a className="source-link" href="https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000" target="_blank" rel="noreferrer">Oxford 3000 / 5000 <span aria-hidden="true">↗</span></a> */}
        </div>
      </header>

      <section className="workspace">
        <aside className="deck-sidebar">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">YOUR STUDY DECK</p>
              <h1>Word garden</h1>
            </div>
            <span className="deck-count">{deckSize.toString().padStart(2, "0")}</span>
          </div>

          <div className="level-filters" aria-label="Filter by CEFR level">
            {levels.map((item) => (
              <button className={`level-chip ${level === item ? "active" : ""}`} key={item} onClick={() => setLevel((selected) => (selected === item ? "All" : item))} aria-pressed={level === item}>{item}</button>
            ))}
          </div>

          <div className="level-filters part-filters" aria-label="Filter by part of speech">
            {partsOfSpeech.map((item) => (
              <button className={`level-chip ${part === item ? "active" : ""}`} key={item} onClick={() => setPart((selected) => (selected === item ? "All" : item))} aria-pressed={part === item}>{item}</button>
            ))}
          </div>

          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a word..." aria-label="Find a word" />
            <kbd>/</kbd>
          </label>

          <div className="list-toolbar">
            <span>{showSaved ? "SAVED WORDS" : "IN THIS DECK"}</span>
            <button className={`saved-filter ${showSaved ? "active" : ""}`} onClick={() => setShowSaved((value) => !value)} aria-label={showSaved ? "Show all words" : "Show saved words"} title={showSaved ? "Show all words" : "Show saved words"}>{showSaved ? "★" : "☆"}</button>
          </div>

          <WordList deck={deck} total={deckSize} currentIndex={currentIndex} onSelect={selectCard} resetKey={`${level}|${deferredQuery}|${showSaved}`} />

          {/* <a className="oxford-card-link" href="https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000" target="_blank" rel="noreferrer">
            <span className="oxford-link-mark">O</span>
            <span><strong>Explore the full list</strong><small>Oxford Learner&apos;s Dictionaries</small></span>
            <span className="link-arrow" aria-hidden="true">↗</span>
          </a> */}
        </aside>

        <section className="study-area" aria-label="Flashcard study area">
          <div className="study-heading">
            <div>
              <p className="eyebrow">A MOMENT FOR YOUR VOCABULARY</p>
              <h2>Small words. <em>Big world.</em></h2>
            </div>
            <div className="progress-wrap">
              <span>{deck.length ? `${String(currentIndex + 1).padStart(2, "0")} / ${String(deckSize).padStart(2, "0")}` : "00 / 00"}</span>
              <div className="progress-track"><i style={{ width: `${deck.length ? ((currentIndex + 1) / deckSize) * 100 : 0}%` }} /></div>
            </div>
          </div>

          {/* Clicks that miss the card faces (the ledge, or the gap while the card is mid-rotation) still flip it.
              Card clicks are a mouse/touch shortcut only: keyboard users flip with the Reveal button, Space and the
              arrow keys (window-level handler), so the stage and faces deliberately have no key handlers or role. */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mouse/touch shortcut; see comment above */}
          <div className="card-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={handleStageClick}>
            <div className="card-shadow card-shadow-back" />
            <div className={`flashcard ${flipped ? "is-flipped" : ""}`}>
              {current ? <>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mouse/touch shortcut; keyboard flips via Reveal/Space/arrows */}
                <div className="card-face card-front" onClick={() => flipCard(true)} aria-hidden={flipped} inert={flipped}>
                  <span className="card-topline"><span>{current.supplemental ? "SUPPLEMENTAL WORD" : `WORD № ${current.number}`}</span><span className={`level-tag level-${current.levels[0].toLowerCase()}`}>{current.levels.join(" / ")}</span></span>
                  <span className="word-display">{headwordParts(current.word).main}{headwordParts(current.word).note && <small className="word-note">{headwordParts(current.word).note}</small>}</span>
                  <span className="word-meta"><i /> {Array.from(new Set(current.senses.map((sense) => sense.part))).join(", ")} {pronunciation && <span className="pronunciation" title="American pronunciation">{pronunciation}</span>}
                    {canSpeak && <button type="button" className="speak-button card-speak" onClick={(event) => { event.stopPropagation(); speakCurrent(); }} aria-label={`Hear ${spokenForm(current.word)} in American English`} title="Hear American pronunciation (P)"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg></button>}
                  </span>
                  <span className="card-bottomline"><span>Take a guess, then turn the card</span><span className="turn-icon" aria-hidden="true">↻</span></span>
                  <span className="card-ornament" aria-hidden="true" />
                </div>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mouse/touch shortcut; keyboard flips via Reveal/Space/arrows */}
                <div className="card-face card-back" onClick={() => flipCard(false)} aria-hidden={!flipped} inert={!flipped}>
                  <span className="card-topline"><span>THE MEANING</span><span className={`level-tag level-${current.levels[0].toLowerCase()}`}>{current.levels.join(" / ")}</span></span>
                  {/* <span className="meaning-label">{current.word}</span> */}
                  <span className="meaning-text" lang={activeMeaningLanguage}>
                    {meaningText}
                  </span>
                  {exampleText
                    ? <span className="example-block"><span>IN A SENTENCE</span><span className="example-text">“{exampleText}”</span></span>
                    : !examplesLoaded && <span className="example-block is-loading" aria-hidden="true"><span>IN A SENTENCE</span><span className="example-skeleton"><i /><i /></span></span>}
                  <span className="card-bottomline"><span>Turn back to the word</span><span className="turn-icon" aria-hidden="true">↻</span></span>
                </div>
              </> : <div className="card-empty"><span /><p>{showSaved ? "Save a word to start your collection." : "No words in this view."}</p><button onClick={() => { setShowSaved(false); setQuery(""); setLevel("All"); setPart("All"); }}>Back to the deck</button></div>}
            </div>
          </div>

          <div className="study-controls">
            <button className="icon-button" onClick={() => moveCard(-1)} aria-label="Previous word" title="Previous word (left arrow)"><span aria-hidden="true">←</span></button>
            <button className="reveal-button" onClick={() => current && flipCard(!flipped)} disabled={!current}>{flipped ? "Show word" : "Reveal meaning"}<span aria-hidden="true" /></button>
            <button className="icon-button" onClick={() => moveCard(1)} aria-label="Next word" title="Next word (right arrow)"><span aria-hidden="true">→</span></button>
            {/* <button className={`save-button ${current && saved.includes(current.word) ? "is-saved" : ""}`} onClick={() => current && toggleSaved(current.word)} disabled={!current} aria-label={current && saved.includes(current.word) ? "Remove saved word" : "Save word"} title="Save word"><span aria-hidden="true">{current && saved.includes(current.word) ? "★" : "☆"}</span></button> */}
          </div>

          <div className="keyboard-hint desktop-hint"><span>←</span><span>→</span> browse <b>·</b> <span>↑</span><span>↓</span> flip <b>·</b> <kbd>space</kbd> flip{canSpeak && <> <b>·</b> <kbd>P</kbd> listen</>}</div>
          <div className="keyboard-hint mobile-hint">Swipe to browse <b>·</b> Tap a card to flip</div>
        </section>
      </section>
      <footer className="page-footer"><span>ONE WORD AT A TIME</span><span className="footer-meta"><span className="footer-changelog"><Link className="changelog-link" href="/changelog">What&apos;s new</Link> <i>·</i> </span>Built for Anastasiia 😎 <i />
        {/* <a className="contact-link" href={`mailto:${contactEmail}`} aria-label={`Email ${contactEmail}`} title={contactEmail}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>
        </a> */}
      </span></footer>
    </main>
  );
}
