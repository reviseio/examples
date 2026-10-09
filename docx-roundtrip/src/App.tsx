import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReviseEditor, {
  createEmptyDocx,
  type ReviseEditorHandle,
} from "@reviseio/editor";
import "@reviseio/editor/style.css";
import { IndexeddbPersistence } from "y-indexeddb";
import sampleUrl from "./sample.docx?url";
import { useColorScheme } from "./useColorScheme";

/** The document on screen. Its id names the IndexedDB database it lives in. */
interface CurrentDocument {
  id: string;
  title: string;
}

const CURRENT_KEY = "revise-docx-roundtrip:current";

function loadCurrent(): CurrentDocument {
  try {
    const saved = localStorage.getItem(CURRENT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Storage unavailable: start fresh.
  }
  const first = { id: crypto.randomUUID(), title: "Mutual NDA" };
  saveCurrent(first);
  return first;
}

function saveCurrent(doc: CurrentDocument) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(doc));
  } catch {
    // Storage unavailable: the document still works, it just won't persist.
  }
}

async function sampleDocx(): Promise<Blob> {
  return (await fetch(sampleUrl)).blob();
}

export default function App() {
  const [current, setCurrent] = useState(loadCurrent);
  // The file to seed a new document from. Once a document is in IndexedDB,
  // its stored copy wins and this is ignored.
  const [source, setSource] = useState<Blob | null>(null);
  useEffect(() => {
    sampleDocx().then((blob) => setSource((current) => current ?? blob));
  }, []);
  const editor = useRef<ReviseEditorHandle | null>(null);
  const [dragging, setDragging] = useState(false);

  async function open(file: Blob, title: string) {
    indexedDB.deleteDatabase(current.id);
    const next = { id: crypto.randomUUID(), title };
    saveCurrent(next);
    setSource(file);
    setCurrent(next);
  }

  async function download(format: "docx" | "pdf") {
    if (!editor.current) return;
    const blob = await editor.current.tools.export({ format });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${editor.current.view.getState().title || "document"}.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) open(file, file.name.replace(/\.[^.]+$/, ""));
  }

  return (
    <div
      className="app"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <header>
        <strong>Word in, Word out</strong>
        <span className="hint">
          Drop a .docx anywhere. Edits are saved in this browser.
        </span>
        <div className="actions">
          <label className="button">
            Open…
            <input
              type="file"
              accept=".docx,.md,.txt,.html"
              hidden
              onChange={(event) => onFiles(event.target.files)}
            />
          </label>
          <button onClick={async () => open(await createEmptyDocx(), "Untitled")}>
            New
          </button>
          <button onClick={async () => open(await sampleDocx(), "Mutual NDA")}>
            Reset sample
          </button>
          <button className="primary" onClick={() => download("docx")}>
            Download .docx
          </button>
          <button onClick={() => download("pdf")}>PDF</button>
        </div>
      </header>
      <main>
        {source && (
          <PersistedEditor
            // A new id is a new document: remount with a fresh session.
            key={current.id}
            doc={current}
            source={source}
            onReady={(handle) => (editor.current = handle)}
            onTitleChange={(title) => saveCurrent({ ...current, title })}
          />
        )}
      </main>
      {dragging && <div className="drop">Drop to open</div>}
    </div>
  );
}

/**
 * An editor whose document lives in IndexedDB.
 *
 * Every Revise document is a Yjs document, so persistence is just a Yjs
 * provider: y-indexeddb stores each change as it happens and replays them on
 * the next visit. `connect` hands us the editor's Y.Doc to attach it to.
 */
function PersistedEditor({
  doc,
  source,
  onReady,
  onTitleChange,
}: {
  doc: CurrentDocument;
  source: Blob;
  onReady: (editor: ReviseEditorHandle) => void;
  onTitleChange: (title: string) => void;
}) {
  const theme = useColorScheme();
  const [synced, setSynced] = useState(false);

  // Keep `connect` stable: the editor opens one session per transport.
  const connect = useCallback(
    (ydoc: unknown) => {
      const persistence = new IndexeddbPersistence(doc.id, ydoc as never);
      persistence.whenSynced.then(() => setSynced(true));
      return persistence;
    },
    [doc.id],
  );

  const documents = useMemo(
    () => [
      {
        id: doc.id,
        title: doc.title,
        source,
        // Until IndexedDB has loaded, the editor waits. Then it either joins
        // the stored copy or, the first time, seeds it from `source`.
        collaboration: { connect, synced, awareness: null },
      },
    ],
    [doc.id, doc.title, source, connect, synced],
  );

  return (
    <ReviseEditor
      theme={theme}
      initialDocuments={documents}
      onReady={onReady}
      onDocumentTitleChange={(_, title) => onTitleChange(title)}
    />
  );
}
