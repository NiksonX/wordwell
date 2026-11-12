import Home from "./home";
import { words } from "./words";

// How many words the server sends with the page: the first card plus the visible word-list rows and some
// scroll/arrow-key headroom. The client loads the full deck as a separate chunk right after it starts.
const initialWordCount = 24;

export default function Page() {
  return <Home initialWords={words.slice(0, initialWordCount)} totalWords={words.length} />;
}
