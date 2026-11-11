"use client";

import { memo, useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import oxfordWordData from "./american-oxford-3000-words.json";
import oxfordExtraWordData from "./american-oxford-5000-extra-words.json";
// Everyday American words that are not on the Oxford lists; shown with a "Supplemental" label.
import supplementalWordData from "./supplemental-words.json";

type WordLevel = "A1" | "A2" | "B1" | "B2" | "C1";
type WordSense = { part: string; level: WordLevel };
type MeaningLanguage = "en" | "uk" | "de";
type TranslationLanguage = Exclude<MeaningLanguage, "en">;
type Meaning = Record<MeaningLanguage, string>;
type Translations = Record<string, string>;
type Word = {
  word: string;
  levels: WordLevel[];
  senses: WordSense[];
  /** English meaning; translations for the full list are loaded on demand. */
  meaning: string;
  /** Curated words ship their own translations inline. */
  translations?: Record<TranslationLanguage, string>;
  example?: string;
  supplemental?: boolean;
};
type CuratedWord = {
  word: string;
  level: WordLevel;
  part: string;
  pronunciation: string;
  meaning: Meaning;
  example: string;
};

const curatedWords: CuratedWord[] = [
  { word: "curious", level: "A2", part: "adjective", pronunciation: "/\u02c8kjʊəriəs/", meaning: { en: "Wanting to know or learn about something.", uk: "Бажає знати або дізнатися про щось.", de: "Wissbegierig und darauf aus, etwas zu erfahren oder zu lernen." }, example: "The curious student stayed after class to ask one more question." },
  { word: "achieve", level: "A2", part: "verb", pronunciation: "/ə\u02c8tʃiːv/", meaning: { en: "To succeed in doing or reaching something through effort.", uk: "Успішно зробити або досягти чогось завдяки зусиллям.", de: "Etwas durch Anstrengung erfolgreich tun oder erreichen." }, example: "A little practice each day can help you achieve your goal." },
  { word: "reliable", level: "B1", part: "adjective", pronunciation: "/rɪ\u02c8laɪəbl/", meaning: { en: "That you can trust or depend on.", uk: "Такий, кому можна довіряти або на кого можна покластися.", de: "So, dass man jemandem oder etwas vertrauen kann." }, example: "We need a reliable source before we share the information." },
  { word: "notice", level: "A2", part: "verb", pronunciation: "/\u02c8nəʊtɪs/", meaning: { en: "To see or become aware of something.", uk: "Помітити або усвідомити когось чи щось.", de: "Jemanden oder etwas sehen oder bemerken." }, example: "Did you notice how the final paragraph changes the tone?" },
  { word: "approach", level: "B2", part: "noun", pronunciation: "/ə\u02c8prəʊtʃ/", meaning: { en: "A way of dealing with a person or situation.", uk: "Спосіб дій або підхід до роботи з людиною чи ситуацією.", de: "Eine Art, mit einer Person oder Situation umzugehen." }, example: "Her calm approach made the difficult conversation easier." },
  { word: "benefit", level: "B1", part: "noun", pronunciation: "/\u02c8benɪfɪt/", meaning: { en: "An advantage or helpful result.", uk: "Перевага або корисний результат.", de: "Ein Vorteil oder ein hilfreiches Ergebnis." }, example: "One benefit of reading widely is a stronger vocabulary." },
  { word: "gather", level: "B1", part: "verb", pronunciation: "/\u02c8ɡæðə(r)/", meaning: { en: "To bring things together or collect information.", uk: "Зібрати разом або отримати інформацію.", de: "Dinge zusammenbringen oder Informationen sammeln." }, example: "The researchers gathered responses from local residents." },
  { word: "ordinary", level: "A2", part: "adjective", pronunciation: "/\u02c8ɔːdnri/", meaning: { en: "Normal or not especially different.", uk: "Звичайний, нічим особливо не відмінний.", de: "Normal und nicht besonders oder außergewöhnlich." }, example: "It was an ordinary morning until the phone rang." },
  { word: "aware", level: "B1", part: "adjective", pronunciation: "/ə\u02c8weə(r)/", meaning: { en: "Knowing that something exists or is happening.", uk: "Такий, що знає про існування чогось або про те, що відбувається.", de: "Wissen, dass etwas existiert oder geschieht." }, example: "Are you aware of the new library opening hours?" },
  { word: "efficient", level: "B2", part: "adjective", pronunciation: "/ɪ\u02c8fɪʃnt/", meaning: { en: "Working well without wasting time or resources.", uk: "Такий, що працює добре, не марнуючи часу чи ресурсів.", de: "Wirksam, ohne Zeit oder Ressourcen zu verschwenden." }, example: "A clear plan is an efficient way to begin the project." },
  { word: "journey", level: "A1", part: "noun", pronunciation: "/\u02c8dʒɜːni/", meaning: { en: "The act of traveling from one place to another.", uk: "Подорож з одного місця до іншого.", de: "Eine Reise von einem Ort zu einem anderen." }, example: "The train journey through the hills took two hours." },
  { word: "improve", level: "A1", part: "verb", pronunciation: "/ɪm\u02c8pruːv/", meaning: { en: "To become better, or to make something better.", uk: "Ставати кращим або робити щось кращим.", de: "Besser werden oder etwas besser machen." }, example: "She listens to podcasts to improve her English." },
  { word: "consider", level: "A2", part: "verb", pronunciation: "/kən\u02c8sɪdə(r)/", meaning: { en: "To think carefully about something before deciding.", uk: "Ретельно обмірковувати щось перед ухваленням рішення.", de: "Etwas sorgfältig durchdenken, bevor man sich entscheidet." }, example: "We should consider every option before we choose." },
  { word: "evidence", level: "A2", part: "noun", pronunciation: "/\u02c8evɪdəns/", meaning: { en: "Facts or information that show whether something is true.", uk: "Факти або інформація, що підтверджують правдивість чогось.", de: "Tatsachen oder Informationen, die zeigen, ob etwas wahr ist." }, example: "The report includes evidence from several studies." },
  { word: "maintain", level: "B2", part: "verb", pronunciation: "/meɪn\u02c8teɪn/", meaning: { en: "To keep something at the same level or in good condition.", uk: "Підтримувати щось на тому самому рівні або в належному стані.", de: "Etwas auf demselben Niveau oder in gutem Zustand halten." }, example: "It takes effort to maintain a healthy work-life balance." },
  { word: "generous", level: "B1", part: "adjective", pronunciation: "/\u02c8dʒenərəs/", meaning: { en: "Willing to give or share more than is expected.", uk: "Готовий віддавати чи ділитися більше, ніж очікується.", de: "Bereit, mehr zu geben oder zu teilen als erwartet." }, example: "It was generous of him to offer us a place to stay." },
  { word: "environment", level: "A2", part: "noun", pronunciation: "/ɪn\u02c8vaɪrənmənt/", meaning: { en: "The natural world, or the conditions around someone.", uk: "Природний світ або умови, що оточують когось.", de: "Die natürliche Welt oder die Bedingungen, die jemanden umgeben." }, example: "Small choices can have an impact on the environment." },
  { word: "significant", level: "B2", part: "adjective", pronunciation: "/sɪɡ\u02c8nɪfɪkənt/", meaning: { en: "Large or important enough to be noticed.", uk: "Достатньо великий або важливий, щоб його помітили.", de: "Groß oder wichtig genug, um bemerkt zu werden." }, example: "The study found a significant change in reading habits." },
  { word: "support", level: "A2", part: "verb", pronunciation: "/sə\u02c8pɔːt/", meaning: { en: "To help or encourage someone or something.", uk: "Допомагати комусь або чомусь чи заохочувати їх.", de: "Jemandem oder etwas helfen oder Mut machen." }, example: "Good feedback can support learners as they grow." },
  { word: "opportunity", level: "A2", part: "noun", pronunciation: "/ˌɒpə\u02c8tjuːnəti/", meaning: { en: "A situation that makes it possible to do something.", uk: "Ситуація, що дає змогу щось зробити.", de: "Eine Situation, die es ermöglicht, etwas zu tun." }, example: "The exchange program was a great opportunity to travel." },
];

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
  if (/natural|neural|premium|enhanced|siri/i.test(name)) score += 100;
  if (/^google us english/i.test(name)) score += 80;
  if (/\b(ava|samantha|allison|susan|zoe|nicky|evan|nathan|aaron|joelle|noelle|tom)\b/i.test(name)) score += 20;
  if (!voice.localService) score += 10; // online voices are usually higher quality
  if (voice.default) score += 1;
  return score;
}

function bestAmericanVoice(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((voice) => voice.lang.replace("_", "-") === "en-US")
    .map((voice) => ({ voice, score: voiceScore(voice) }))
    .filter(({ score }) => score >= 0)
    .sort((left, right) => right.score - left.score)[0]?.voice ?? null;
}

// Browsers fill the voice list asynchronously; wait briefly so the first word isn't spoken by the fallback voice.
function loadVoices(synth: SpeechSynthesis) {
  const voices = synth.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 600);
  });
}

function speakAmerican(text: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  void loadVoices(synth).then((voices) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.voice = bestAmericanVoice(voices);
    // A touch slower than normal speech, so a learner can hear each sound.
    utterance.rate = 0.88;
    synth.speak(utterance);
  });
}

type OxfordWordRecord = { word: string; levels: string[]; senses: { part: string; level: string }[]; meaning: string; supplemental?: boolean };
// Curated entries keep their own (British) IPA in the source data, but the card shows the American IPA file instead.
const curatedByWord = new Map(curatedWords.map(({ word, level, part, meaning, example }) => [
  word.toLocaleLowerCase("en-US"),
  { level, part, meaning, example },
]));
const words: Word[] = [
  ...oxfordWordData,
  ...oxfordExtraWordData,
  ...supplementalWordData.map((record) => ({ ...record, supplemental: true })),
].map((sourceWord: OxfordWordRecord) => {
  const curated = curatedByWord.get(sourceWord.word.toLocaleLowerCase("en-US"));
  return {
    word: sourceWord.word,
    levels: sourceWord.levels as WordLevel[],
    senses: sourceWord.senses.map((sense) => ({ part: sense.part, level: sense.level as WordLevel })),
    meaning: curated?.meaning.en ?? sourceWord.meaning,
    translations: curated && { uk: curated.meaning.uk, de: curated.meaning.de },
    example: curated?.example,
    supplemental: sourceWord.supplemental,
  };
});
const officialHeadwords = new Set(words.map((item) => item.word.toLocaleLowerCase("en-US")));
for (const curated of curatedWords) {
  if (officialHeadwords.has(curated.word.toLocaleLowerCase("en-US"))) continue;
  words.push({
    word: curated.word,
    levels: [curated.level],
    senses: [{ part: curated.part, level: curated.level }],
    meaning: curated.meaning.en,
    translations: { uk: curated.meaning.uk, de: curated.meaning.de },
    example: curated.example,
    supplemental: true,
  });
}
// One shared collator: String#localeCompare with options builds a new collator per comparison (~25x slower).
const wordCollator = new Intl.Collator("en-US", { sensitivity: "base", numeric: true });
words.sort((left, right) => wordCollator.compare(left.word, right.word));
const searchIndex = new Map(words.map((item) => [
  item,
  `${item.word} ${item.senses.map((sense) => sense.part).join(" ")} ${item.meaning}`.toLowerCase(),
]));
const wordNumbers = new Map(words.map((item, itemIndex) => [item, itemIndex + 1]));

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
// small even though the deck holds ~3,000 words.
function WordList({ deck, currentIndex, onSelect, resetKey }: {
  deck: Word[];
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
        <div className="word-list-spacer" style={{ height: deck.length * wordRowHeight }}>
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

const senseGroups = new Map<WordSense, Set<PartOfSpeech>>(
  words.flatMap((item) => item.senses.map((sense) => [sense, partGroups(sense.part)] as const)),
);

function matchesFilters(item: Word, level: LevelFilter, part: PartFilter) {
  if (part === "All") return level === "All" || item.levels.includes(level);
  return item.senses.some((sense) => (
    (level === "All" || sense.level === level) && senseGroups.get(sense)!.has(part)
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

export default function Home() {
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
    return words.filter((item) => (
      matchesFilters(item, level, part)
      && (!needle || searchIndex.get(item)!.includes(needle))
      && (!showSaved || savedSet.has(item.word))
    ));
  }, [deferredQuery, level, part, saved, showSaved]);
  const currentIndex = deck.length ? index % deck.length : 0;
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
    const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const;
    const load = () => {
      if (started) return;
      started = true;
      interactionEvents.forEach((type) => window.removeEventListener(type, load));
      loadPronunciations().then(setPronunciations, () => {});
      loadExamples().then((loaded) => { setExamples(loaded); setExamplesLoaded(true); }, () => setExamplesLoaded(true));
    };
    interactionEvents.forEach((type) => window.addEventListener(type, load, { once: true, passive: true }));
    // Safari has no requestIdleCallback.
    const hasIdle = "requestIdleCallback" in window;
    const idleId = hasIdle ? window.requestIdleCallback(load, { timeout: 2000 }) : 0;
    const timer = hasIdle ? undefined : setTimeout(load, 300);
    return () => {
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
    setIndex((currentIndex) => (currentIndex + direction + deck.length) % deck.length);
  }

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
        <a className="brand" href="#home" aria-label="wordWell home">
          <span className="brand-mark">w.</span>
          <span>Wordwell</span>
        </a>
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

      <section className="workspace" id="home">
        <aside className="deck-sidebar">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">YOUR STUDY DECK</p>
              <h1>Word garden</h1>
            </div>
            <span className="deck-count">{deck.length.toString().padStart(2, "0")}</span>
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

          <WordList deck={deck} currentIndex={currentIndex} onSelect={selectCard} resetKey={`${level}|${deferredQuery}|${showSaved}`} />

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
              <span>{deck.length ? `${String(currentIndex + 1).padStart(2, "0")} / ${String(deck.length).padStart(2, "0")}` : "00 / 00"}</span>
              <div className="progress-track"><i style={{ width: `${deck.length ? ((currentIndex + 1) / deck.length) * 100 : 0}%` }} /></div>
            </div>
          </div>

          {/* Clicks that miss the card faces (the ledge, or the gap while the card is mid-rotation) still flip it.
              Keyboard users flip via the card buttons and the reveal button. */}
          <div className="card-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={handleStageClick}>
            <div className="card-shadow card-shadow-back" />
            <div className={`flashcard ${flipped ? "is-flipped" : ""}`}>
              {current ? <>
                <div className="card-face card-front" onClick={() => flipCard(true)} aria-hidden={flipped} inert={flipped}>
                  <span className="card-topline"><span>{current.supplemental ? "SUPPLEMENTAL WORD" : `WORD № ${wordNumbers.get(current)}`}</span><span className={`level-tag level-${current.levels[0].toLowerCase()}`}>{current.levels.join(" / ")}</span></span>
                  <span className="word-display">{headwordParts(current.word).main}{headwordParts(current.word).note && <small className="word-note">{headwordParts(current.word).note}</small>}</span>
                  <span className="word-meta"><i /> {Array.from(new Set(current.senses.map((sense) => sense.part))).join(", ")} {pronunciation && <span className="pronunciation" title="American pronunciation">{pronunciation}</span>}
                    {canSpeak && <button type="button" className="speak-button card-speak" onClick={(event) => { event.stopPropagation(); speakCurrent(); }} aria-label={`Hear ${spokenForm(current.word)} in American English`} title="Hear American pronunciation (P)"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg></button>}
                  </span>
                  <span className="card-bottomline"><span>Take a guess, then turn the card</span><span className="turn-icon" aria-hidden="true">↻</span></span>
                  <span className="card-ornament" aria-hidden="true"></span>
                </div>
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
              </> : <div className="card-empty"><span></span><p>{showSaved ? "Save a word to start your collection." : "No words in this view."}</p><button onClick={() => { setShowSaved(false); setQuery(""); setLevel("All"); setPart("All"); }}>Back to the deck</button></div>}
            </div>
          </div>

          <div className="study-controls">
            <button className="icon-button" onClick={() => moveCard(-1)} aria-label="Previous word" title="Previous word (left arrow)"><span aria-hidden="true">←</span></button>
            <button className="reveal-button" onClick={() => current && flipCard(!flipped)} disabled={!current}>{flipped ? "Show word" : "Reveal meaning"}<span aria-hidden="true"></span></button>
            <button className="icon-button" onClick={() => moveCard(1)} aria-label="Next word" title="Next word (right arrow)"><span aria-hidden="true">→</span></button>
            {/* <button className={`save-button ${current && saved.includes(current.word) ? "is-saved" : ""}`} onClick={() => current && toggleSaved(current.word)} disabled={!current} aria-label={current && saved.includes(current.word) ? "Remove saved word" : "Save word"} title="Save word"><span aria-hidden="true">{current && saved.includes(current.word) ? "★" : "☆"}</span></button> */}
          </div>

          <div className="keyboard-hint desktop-hint"><span>←</span><span>→</span> browse <b>·</b> <span>↑</span><span>↓</span> flip <b>·</b> <kbd>space</kbd> flip{canSpeak && <> <b>·</b> <kbd>P</kbd> listen</>}</div>
          <div className="keyboard-hint mobile-hint">Swipe to browse <b>·</b> Tap a card to flip</div>
        </section>
      </section>
      <footer className="page-footer"><span>ONE WORD AT A TIME</span><span className="footer-meta"><span className="footer-changelog"><Link className="changelog-link" href="/changelog">What&apos;s new</Link> <i>·</i> </span>Built for Anastasiia 😎 <i></i>
        {/* <a className="contact-link" href={`mailto:${contactEmail}`} aria-label={`Email ${contactEmail}`} title={contactEmail}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>
        </a> */}
      </span></footer>
    </main>
  );
}
