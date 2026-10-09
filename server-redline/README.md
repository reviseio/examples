# Redline a contract in Node

Run a contract through a playbook on your server, with no browser and no
model. Each playbook edit becomes a tracked change with an explanatory
comment, and each flag becomes a comment. The output is a `.docx` that opens
in Word with the redlines ready to accept or reject.

```bash
npm install
npm start          # redlines nda.docx with playbook.json
```

```
  edit  "sole discretion" → "reasonable discretion" (1 tracked)
  edit  "five (5) years" → "two (2) years" (2 tracked)
  edit  "State of Delaware" → "State of New York" (1 tracked)
  edit  "courts located in Delaware" → "courts located in New York County, New York" (2 tracked)
  flag  "neither party will solicit for employment"

5 tracked changes → nda-redlined.docx
```

Open `nda-redlined.docx` in Word, Google Docs, or the
[`docx-roundtrip`](../docx-roundtrip) example, which uses this output as its
sample. Run it on your own files with `npx tsx redline.ts contract.docx
playbook.json`.

## Key code

[`revise`](https://www.npmjs.com/package/revise) runs the same editing tools
as the browser editor and its agent, so this is the same code an agent would
run ([`redline.ts`](redline.ts)):

```ts
import { ReviseDocument } from "revise";

// Word files open in suggesting mode: every edit is a tracked change.
const doc = await ReviseDocument.open(input, { author: "Playbook" });

const search = await doc.tools.call("search_document", {
  queries: [find],
  page: 0,
});
if (search.ok) {
  await doc.tools.call("replace", {
    search_result_id: search.value.data.search_result_id,
    replacements: [{ find, replace, comment, occurrence: "all" }],
  });
}

const { bytes } = await doc.export({ format: "docx" });
await writeFile(output, bytes);
```

Tool calls never throw for a bad edit: they return `{ ok: false, error }`.
Node 20 or newer.

## Where to take it

- Put a model in the loop: `agentTools(doc, { provider: "anthropic" })`
  gives you the tool definitions and a handler for the model's tool calls,
  in the Anthropic or OpenAI SDK's shapes. The
  [`ai-redline`](../ai-redline) example does this in the browser.
- Edit a live document: `ReviseDocument.fromYDoc(room)` works on the `Y.Doc`
  your collaboration server already holds, and the tracked changes show up
  in every open browser. See the [`multiplayer`](../multiplayer) example.
- Skip the code: `npx revise replace-text contract.docx "five (5) years" "two
  (2) years"` does the same from the command line.

## Learn more

- [`revise` documentation](https://revise.io/developer/docs/revise/introduction)
- [Agent tool reference](https://revise.io/developer/docs/editor-sdk/api/agent-tools)
- [Tracked changes](https://revise.io/developer/docs/editor-sdk/guides/tracked-changes)
