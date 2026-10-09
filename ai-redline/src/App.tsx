import Anthropic from "@anthropic-ai/sdk";
import { useEffect, useRef, useState } from "react";
import ReviseEditor, { type ReviseEditorHandle } from "@reviseio/editor";
import "@reviseio/editor/style.css";
import { runAgent, type AgentEvent } from "./agent";
import ndaUrl from "./nda.docx?url";
import { useColorScheme } from "./useColorScheme";

const KEY_STORAGE = "revise-ai-redline:anthropic-key";

const EXAMPLES = [
  "Make the term and governing law provisions more favorable to Halcyon",
  "Tighten the wording of section 3",
  "Flag anything unusual with comments",
];

function readKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export default function App() {
  const theme = useColorScheme();
  const editor = useRef<ReviseEditorHandle | null>(null);
  const [nda, setNda] = useState<Blob | null>(null);
  const [apiKey, setApiKey] = useState(readKey);
  const [instruction, setInstruction] = useState(EXAMPLES[0]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string[]>([]);

  useEffect(() => {
    fetch(ndaUrl)
      .then((response) => response.blob())
      .then(setNda);
  }, []);

  function saveKey(value: string) {
    setApiKey(value);
    try {
      localStorage.setItem(KEY_STORAGE, value);
    } catch {
      // Storage unavailable: the key lasts for this page only.
    }
  }

  async function run() {
    if (!editor.current || !apiKey || !instruction.trim()) return;
    setRunning(true);
    setError(null);
    setLog([]);
    try {
      // Demo only: the key goes from this browser straight to Anthropic.
      // In production, keep it on your server and pass `baseURL` instead.
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const ids = await runAgent({
        client,
        editor: editor.current,
        instruction,
        onEvent: (event) => setLog((current) => [...current, event]),
      });
      setPending(ids);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRunning(false);
    }
  }

  function resolve(accept: boolean) {
    const review = editor.current?.review;
    if (!review) return;
    if (accept) review.acceptSuggestions(pending);
    else review.rejectSuggestions(pending);
    setPending([]);
  }

  return (
    <div className="app">
      <main>
        {nda && (
          <ReviseEditor
            theme={theme}
            initialDocuments={[{ id: "nda", title: "Mutual NDA", source: nda }]}
            // Every edit, from the user or from Claude, is a tracked change.
            defaultDocumentMode="suggesting"
            currentUser={{ id: "you", name: "You" }}
            agent={{ name: "Claude" }}
            // Fit the page to the width instead of reserving room for the
            // comments column. Claude's comments still show beside the text.
            defaultCommentsOpen={false}
            onReady={(handle) => (editor.current = handle)}
          />
        )}
      </main>

      <aside>
        <h1>AI redline</h1>
        <p className="muted">
          Claude edits the contract through the editor's tools. Every change
          lands as a tracked change for you to accept or reject.
        </p>

        <label>
          Anthropic API key
          <input
            type="password"
            value={apiKey}
            placeholder="sk-ant-…"
            autoComplete="off"
            onChange={(event) => saveKey(event.target.value)}
          />
        </label>
        <p className="note">
          Stored in this browser and sent only to api.anthropic.com. Fine for a
          demo; in production, call Anthropic from your server.
        </p>

        <label>
          Instruction
          <textarea
            rows={3}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
          />
        </label>
        <div className="chips">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              className="chip"
              onClick={() => setInstruction(example)}
            >
              {example}
            </button>
          ))}
        </div>
        <button
          className="primary"
          disabled={running || !apiKey || !nda}
          onClick={run}
        >
          {running ? "Claude is editing…" : "Run"}
        </button>

        {error && <p className="error">{error}</p>}

        {pending.length > 0 && !running && (
          <div className="review">
            <span>Changes from this run</span>
            <button onClick={() => resolve(true)}>Accept</button>
            <button onClick={() => resolve(false)}>Reject</button>
          </div>
        )}

        {log.length > 0 && (
          <ol className="log">
            {log.map((event, index) =>
              event.type === "tool" ? (
                <li key={index} className={event.ok ? "tool" : "tool failed"}>
                  <code>{event.name}</code>
                  {event.detail && <span>{event.detail}</span>}
                </li>
              ) : (
                <li key={index} className="text">
                  {/* Claude may answer in Markdown; this log shows plain text. */}
                  {event.text.replace(/\*\*/g, "")}
                </li>
              ),
            )}
          </ol>
        )}
      </aside>
    </div>
  );
}
