import { useEffect, useState } from "react";
import ReviseEditor, {
  rolePolicy,
  type ReviseDocumentRole,
  type ReviseEditorHandle,
} from "revise/editor";
import "revise/style.css";
import ReviewSidebar from "./ReviewSidebar";
import ndaUrl from "./nda.docx?url";
import { useColorScheme } from "./useColorScheme";

interface Persona {
  key: string;
  label: string;
  role: ReviseDocumentRole;
  user: { id: string; name: string; color: string };
}

const PERSONAS: Persona[] = [
  {
    key: "author",
    label: "Author",
    role: "editor",
    user: { id: "u-avery", name: "Avery (Author)", color: "#1f6feb" },
  },
  {
    key: "client",
    label: "Client",
    role: "suggester",
    user: { id: "u-casey", name: "Casey (Client)", color: "#c2410c" },
  },
  {
    key: "viewer",
    label: "Viewer",
    role: "viewer",
    user: { id: "u-val", name: "Val (Viewer)", color: "#6b7280" },
  },
];

function describe(role: ReviseDocumentRole): string {
  const policy = rolePolicy(role);
  if (!policy.canEdit) return "Read-only. Can read the document and its comments.";
  const parts = [
    policy.canEditDirectly ? "Edits directly" : "Edits become tracked suggestions",
    policy.canResolveSuggestions ? "accepts or rejects changes" : "cannot accept or reject",
    policy.canComment ? "can comment" : "cannot comment",
  ];
  return `${parts.join(", ")}.`;
}

export default function App() {
  const theme = useColorScheme();
  const [persona, setPersona] = useState(PERSONAS[1]);
  const [source, setSource] = useState<Blob | null>(null);
  const [editor, setEditor] = useState<ReviseEditorHandle | null>(null);

  useEffect(() => {
    fetch(ndaUrl)
      .then((response) => response.blob())
      .then(setSource);
  }, []);

  return (
    <div className="app">
      <header>
        <strong>Review portal</strong>
        <div className="personas" role="tablist">
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={p.key === persona.key}
              onClick={() => setPersona(p)}
            >
              <span className="dot" style={{ background: p.user.color }} />
              {p.label}
            </button>
          ))}
        </div>
        <span className="banner">
          <b>{persona.user.name}</b> · {persona.role} · {describe(persona.role)}
        </span>
      </header>
      <main>
        <div className="editor">
          {source && (
            // One editor for every persona. `role` and `currentUser` are live
            // props: switching persona keeps the document and its history,
            // and changes who is acting and what they may do. In a real app
            // each person has their own editor, joined over a shared room.
            <ReviseEditor
              theme={theme}
              initialDocuments={[{ id: "nda", title: "Mutual NDA", source }]}
              role={persona.role}
              currentUser={persona.user}
              settings={{
                trackedChanges: { markupStyle: "word", showRemovalsInReview: true },
              }}
              defaultCommentsOpen={false}
              onReady={setEditor}
            />
          )}
        </div>
        {editor && <ReviewSidebar editor={editor} role={persona.role} />}
      </main>
    </div>
  );
}
