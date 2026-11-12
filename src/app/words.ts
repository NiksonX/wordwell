// The full word deck (~5,000 entries). Imported by the server page (to prerender the first card) and
// lazy-loaded by the client, so it stays out of the main client script.
import oxfordWordData from "./american-oxford-3000-words.json";
import oxfordExtraWordData from "./american-oxford-5000-extra-words.json";
// Everyday American words that are not on the Oxford lists; shown with a "Supplemental" label.
import supplementalWordData from "./supplemental-words.json";

export type WordLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type WordSense = { part: string; level: WordLevel };
export type MeaningLanguage = "en" | "uk" | "de";
export type TranslationLanguage = Exclude<MeaningLanguage, "en">;
type Meaning = Record<MeaningLanguage, string>;
export type Translations = Record<string, string>;
export type Word = {
  word: string;
  /** Position in the full alphabetical deck (shown as "WORD № …"). */
  number: number;
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

type OxfordWordRecord = { word: string; levels: string[]; senses: { part: string; level: string }[]; meaning: string; supplemental?: boolean };
// Curated entries keep their own (British) IPA in the source data, but the card shows the American IPA file instead.
const curatedByWord = new Map(curatedWords.map(({ word, level, part, meaning, example }) => [
  word.toLocaleLowerCase("en-US"),
  { level, part, meaning, example },
]));
const merged: Omit<Word, "number">[] = [
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
const officialHeadwords = new Set(merged.map((item) => item.word.toLocaleLowerCase("en-US")));
for (const curated of curatedWords) {
  if (officialHeadwords.has(curated.word.toLocaleLowerCase("en-US"))) continue;
  merged.push({
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
merged.sort((left, right) => wordCollator.compare(left.word, right.word));

export const words: Word[] = merged.map((item, itemIndex) => ({ ...item, number: itemIndex + 1 }));
