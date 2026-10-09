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

The browser editor and `@reviseio/editor/server` share one tool contract, so this is
the same code an agent would run in the browser ([`redline.ts`](redline.ts)):

```ts
const ydoc = await fileToYDoc(await readFile(input), basename(input));
const session = await createServerDocumentSession(ydoc, {
  documentId: "contract",
}); // suggesting mode by default: every edit is a tracked change

const search = await session.tools.call("search_document", {
  queries: [find],
  page: 0,
});
await session.tools.call("replace", {
  search_result_id: search.data.search_result_id,
  replacements: [{ find, replace, comment, occurrence: "all" }],
});

await writeFile(output, await ydocToDocx(ydoc));
```

`@reviseio/editor/server` needs `jsdom` (the converters parse XML with DOM APIs) and
Node 18 or newer.

## Where to take it

- Put a model in the loop: give it `session.tools.getDefinitions()` and run
  its tool calls with `session.tools.executeDynamic()`. The
  [`ai-redline`](../ai-redline) example does this in the browser.
- Edit a live document: bind a session to the `Y.Doc` your collaboration
  server already holds, and the tracked changes show up in every open
  browser. See the [`multiplayer`](../multiplayer) example and the
  [collaboration guide](https://revise.io/developer/docs/editor-sdk/guides/collaboration#server-editing).

## Learn more

- [Backend reference](https://revise.io/developer/docs/editor-sdk/api/backend)
- [Agent tool reference](https://revise.io/developer/docs/editor-sdk/api/agent-tools)
- [Tracked changes](https://revise.io/developer/docs/editor-sdk/guides/tracked-changes)
