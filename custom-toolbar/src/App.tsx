import { useEffect, useRef, useState } from "react";
import ReviseEditor, {
  type ReviseEditorHandle,
  type ReviseToolbarState,
} from "@reviseio/editor";
import "@reviseio/editor/style.css";
import essayUrl from "./essay.docx?url";
import { BulletsIcon, LinkIcon, NumbersIcon, RedoIcon, UndoIcon } from "./icons";

// The SDK draws the page on a canvas, so its colors come from props.
const PALETTES = {
  light: { canvas: "#efe9df", page: "#fbf8f2", border: "#e2d9ca" },
  dark: { canvas: "#151412", page: "#1f1d1a", border: "#2c2925" },
};

// Newsreader is loaded from Google Fonts in index.html. Registering it maps
// the family name stored in the document to the font the browser renders.
const FONTS = [{ family: "Newsreader", cssFamily: '"Newsreader", Georgia, serif' }];

export default function App() {
  const editor = useRef<ReviseEditorHandle | null>(null);
  const [toolbar, setToolbar] = useState<ReviseToolbarState | null>(null);
  const [essay, setEssay] = useState<Blob | null>(null);
  const [title, setTitle] = useState("On Revision");
  const [words, setWords] = useState(0);
  const scheme = useColorScheme();
  const palette = PALETTES[scheme];

  useEffect(() => {
    // Wait for the web font too, so the first paint isn't a fallback face.
    Promise.all([
      fetch(essayUrl).then((response) => response.blob()),
      document.fonts.load('16px "Newsreader"'),
    ]).then(([blob]) => setEssay(blob));
  }, []);

  // Recount after the user pauses. getStatistics() skips layout, so it's cheap.
  const countTimer = useRef<number>();
  function recount() {
    clearTimeout(countTimer.current);
    countTimer.current = window.setTimeout(() => {
      setWords(editor.current?.getStatistics().wordCount ?? 0);
    }, 300);
  }

  const run = (command: (t: ReviseEditorHandle["toolbar"]) => unknown) => () => {
    if (editor.current) command(editor.current.toolbar);
  };
  const list = toolbar?.blockType?.type === "list" ? toolbar.blockType.variant : null;

  return (
    <div className="app">
      {/* preventDefault keeps focus, and the selection, in the document. */}
      <header className="toolbar" onMouseDown={(e) => e.preventDefault()}>
        <select
          aria-label="Paragraph style"
          disabled={!toolbar?.ready}
          value={toolbar?.heading ?? 0}
          onChange={(e) => {
            const level = Number(e.target.value) as 0 | 1 | 2 | 3;
            editor.current?.toolbar.setHeading(level || undefined);
          }}
        >
          <option value={0}>Body</option>
          <option value={1}>Title</option>
          <option value={2}>Heading</option>
          <option value={3}>Subheading</option>
        </select>
        <span className="divider" />
        <Button label="Bold" pressed={toolbar?.formatting.bold} onClick={run((t) => t.toggleBold())}>
          <b>B</b>
        </Button>
        <Button label="Italic" pressed={toolbar?.formatting.italic} onClick={run((t) => t.toggleItalic())}>
          <i>I</i>
        </Button>
        <Button label="Underline" pressed={toolbar?.formatting.underline} onClick={run((t) => t.toggleUnderline())}>
          <u>U</u>
        </Button>
        <span className="divider" />
        <Button label="Bulleted list" pressed={list === "unordered"} onClick={run((t) => t.toggleList("unordered"))}>
          <BulletsIcon />
        </Button>
        <Button label="Numbered list" pressed={list === "ordered"} onClick={run((t) => t.toggleList("ordered"))}>
          <NumbersIcon />
        </Button>
        <Button label="Link" disabled={!toolbar?.hasSelection} onClick={run((t) => t.createLink())}>
          <LinkIcon />
        </Button>
        <span className="spacer" />
        <Button label="Undo" disabled={!toolbar?.canUndo} onClick={run((t) => t.undo())}>
          <UndoIcon />
        </Button>
        <Button label="Redo" disabled={!toolbar?.canRedo} onClick={run((t) => t.redo())}>
          <RedoIcon />
        </Button>
      </header>

      <input
        className="title"
        aria-label="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          editor.current?.view.setTitle(e.target.value);
        }}
      />

      <main>
        {essay && (
          <ReviseEditor
            initialDocuments={[{ id: "essay", title, source: essay }]}
            toolbarMode="none"
            showTitleBar={false}
            defaultCommentsOpen={false}
            theme={scheme}
            canvasBackground={palette.canvas}
            pageBackground={palette.page}
            pageBorderColor={palette.border}
            fonts={FONTS}
            onReady={(handle) => {
              editor.current = handle;
              handle.toolbar.subscribe(setToolbar);
            }}
            onDocumentReady={recount}
            onChange={recount}
          />
        )}
      </main>

      <footer>{words.toLocaleString()} words</footer>
    </div>
  );
}

function Button(props: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.pressed ?? false}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

/** Follows the OS setting, so the editor and the page switch together. */
function useColorScheme(): "light" | "dark" {
  const [query] = useState(() => window.matchMedia("(prefers-color-scheme: dark)"));
  const [dark, setDark] = useState(query.matches);
  useEffect(() => {
    const onChange = () => setDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);
  return dark ? "dark" : "light";
}
