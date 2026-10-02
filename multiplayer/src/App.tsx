import { useCallback, useEffect, useMemo, useState } from "react";
import ReviseEditor, {
  type ReviseEditorHandle,
  type RevisePeer,
} from "revise/editor";
import "revise/style.css";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useColorScheme } from "./useColorScheme";

const SERVER_URL = `ws://${location.hostname}:1234`;
const ROOM = "community-tool-library";

const NAMES = ["Ada", "Grace", "Linus", "Margaret", "Alan", "Hedy", "Dennis", "Barbara"];
const COLORS = ["#e5484d", "#f76b15", "#30a46c", "#0090ff", "#8e4ec6", "#d6409f"];
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// A random identity per tab. In your app, this is the signed-in user.
const me = {
  id: crypto.randomUUID(),
  name: pick(NAMES),
  color: pick(COLORS),
};

type Status = "connecting" | "connected" | "disconnected";

export default function App() {
  const theme = useColorScheme();
  const [editor, setEditor] = useState<ReviseEditorHandle | null>(null);
  const [synced, setSynced] = useState(false);
  const [status, setStatus] = useState<Status>("connecting");
  const [peers, setPeers] = useState<RevisePeer[]>([]);

  // The editor builds the Y.Doc and awareness; we attach a transport to them.
  // Keep this stable: the editor opens one session per `connect`.
  const connect = useCallback((document: unknown, awareness: unknown) => {
    const provider = new HocuspocusProvider({
      url: SERVER_URL,
      name: ROOM,
      document: document as never,
      awareness: awareness as never,
      onSynced: () => setSynced(true),
      onStatus: ({ status }) => setStatus(status as Status),
    });
    return provider;
  }, []);

  const documents = useMemo(
    () => [
      {
        id: ROOM,
        title: "Tool library proposal",
        // The server seeds the room, so clients only ever join it.
        collaboration: { connect, synced, seed: "never" as const },
      },
    ],
    [connect, synced],
  );

  // The roster: everyone in the room, in the colors their carets use.
  useEffect(() => {
    if (!editor) return;
    return editor.collaboration.subscribe((state) => setPeers(state.peers));
  }, [editor]);

  return (
    <div className="app">
      <header>
        <strong>Multiplayer</strong>
        <span className={`status ${status}`} title={status} />
        <span className="hint">
          {status === "connected"
            ? "Open a second window and type in both."
            : status === "connecting"
              ? `Connecting to ${SERVER_URL}…`
              : `Can't reach ${SERVER_URL}. Is the server running?`}
        </span>
        <div className="actions">
          <ul className="roster">
            {peers.map((peer) => (
              <li
                key={peer.clientId}
                style={{ background: peer.color }}
                title={peer.isLocal ? `${peer.name} (you)` : peer.name}
                className={peer.isLocal ? "local" : undefined}
              >
                {peer.name?.slice(0, 1)}
              </li>
            ))}
          </ul>
          <button
            onClick={() =>
              window.open(location.href, "_blank", "popup,width=1000,height=800")
            }
          >
            Open another window
          </button>
        </div>
      </header>
      <main>
        <ReviseEditor
          theme={theme}
          currentUser={me}
          initialDocuments={documents}
          onReady={setEditor}
          // This demo has no comments, so give the page the full width.
          defaultCommentsOpen={false}
        />
      </main>
    </div>
  );
}
