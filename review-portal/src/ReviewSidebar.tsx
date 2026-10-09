import { useEffect, useRef, useState } from "react";
import {
  rolePolicy,
  type ReviseDocumentRole,
  type ReviseEditorHandle,
  type ReviseReviewState,
  type ReviseSelectionCapture,
  type ReviseTrackedChange,
} from "@reviseio/editor";

function verb(change: ReviseTrackedChange): string {
  if (change.kind === "move") return "moved";
  if (change.kind === "format") return "reformatted";
  if (change.deletedText && change.insertedText) return "replaced";
  return change.kind === "delete" ? "deleted" : "added";
}

export default function ReviewSidebar({
  editor,
  role,
}: {
  editor: ReviseEditorHandle;
  role: ReviseDocumentRole;
}) {
  const policy = rolePolicy(role);
  const [review, setReview] = useState<ReviseReviewState | null>(null);
  const [changes, setChanges] = useState<ReviseTrackedChange[]>([]);

  // listChanges() is not a subscription: re-read it whenever review state moves.
  useEffect(
    () =>
      editor.review.subscribe((state) => {
        setReview(state);
        setChanges(editor.review.listChanges());
      }),
    [editor],
  );

  const threads = (review?.commentThreads ?? []).filter((t) => !t.root.resolved);

  return (
    <aside>
      <section>
        <h2>Changes · {changes.length}</h2>
        {changes.length === 0 && <p className="empty">No pending changes.</p>}
        <ul>
          {changes.map((change) => (
            <li key={change.id} onClick={() => editor.review.navigateToSuggestion(change.id)}>
              <div>
                <b>{change.author}</b> {verb(change)}{" "}
                {change.deletedText && <del>{change.deletedText}</del>}{" "}
                {change.insertedText && <ins>{change.insertedText}</ins>}
              </div>
              {policy.canResolveSuggestions && (
                <div className="row" onClick={(event) => event.stopPropagation()}>
                  <button onClick={() => editor.review.acceptSuggestions([change.id])}>Accept</button>
                  <button onClick={() => editor.review.rejectSuggestions([change.id])}>Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Comments · {threads.length}</h2>
        {policy.canComment && <NewComment editor={editor} />}
        <ul>
          {threads.map((thread) => (
            <li key={thread.root.id} onClick={() => editor.review.selectComment(thread.root.id)}>
              {[thread.root, ...thread.replies].map((comment) => (
                <p key={comment.id}>
                  <b>{comment.author}</b> {comment.bodyMd}
                </p>
              ))}
              {policy.canComment && (
                <Reply
                  onSubmit={(text) => editor.review.replyToComment(thread.root.id, text)}
                  onResolve={() => editor.review.setCommentResolved(thread.root.id, true)}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

/**
 * Typing into this box moves focus out of the editor, which clears its
 * selection. Capture the selection before focus moves, and restore it
 * just before adding the comment.
 */
function NewComment({ editor }: { editor: ReviseEditorHandle }) {
  const capture = useRef<ReviseSelectionCapture | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const restored = capture.current && editor.selection.restore(capture.current);
    const id = restored?.success ? editor.review.addCommentAtSelection(text) : null;
    if (!id) {
      setError("Select some text in the document first.");
      return;
    }
    setText("");
    setError("");
  }

  return (
    <div className="new-comment">
      <textarea
        placeholder="Select text, then comment on it…"
        value={text}
        onMouseDown={() => (capture.current = editor.selection.capture())}
        onChange={(event) => setText(event.target.value)}
      />
      <button className="primary" disabled={!text.trim()} onClick={submit}>
        Comment on selection
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function Reply({
  onSubmit,
  onResolve,
}: {
  onSubmit: (text: string) => void;
  onResolve: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="row" onClick={(event) => event.stopPropagation()}>
      <input placeholder="Reply…" value={text} onChange={(event) => setText(event.target.value)} />
      <button
        disabled={!text.trim()}
        onClick={() => {
          onSubmit(text);
          setText("");
        }}
      >
        Reply
      </button>
      <button onClick={onResolve}>Resolve</button>
    </div>
  );
}
