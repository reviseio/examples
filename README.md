# Revise SDK examples

Six small apps built on [`@reviseio/editor`](https://www.npmjs.com/package/@reviseio/editor),
the Revise word processor for React (published as `revise` through 2.2).
Each one shows a single way of using the editor and keeps the important code
in one or two files.

| Example | What it shows | Live demo |
| --- | --- | --- |
| [**docx-roundtrip**](docx-roundtrip) | Open a `.docx`, edit it, download `.docx` or PDF. Autosaves to IndexedDB. | [Open](https://reviseio.github.io/examples/docx-roundtrip/) |
| [**custom-toolbar**](custom-toolbar) | No ribbon: your own toolbar, colors, and fonts around the page. | [Open](https://reviseio.github.io/examples/custom-toolbar/) |
| [**ai-redline**](ai-redline) | Claude edits the document through the SDK's tools as tracked changes you review. | [Open](https://reviseio.github.io/examples/ai-redline/) |
| [**multiplayer**](multiplayer) | Real-time editing with live carets over a Hocuspocus server. | Run locally |
| [**server-redline**](server-redline) | Redline a `.docx` in Node with `@reviseio/editor/server`. No browser, no model. | Run locally |
| [**review-portal**](review-portal) | Editor, suggester, and viewer roles with comments and a custom review panel. | [Open](https://reviseio.github.io/examples/review-portal/) |

## Run an example

Every example is a standalone project. Copy the folder, or:

```bash
git clone https://github.com/reviseio/examples.git
cd examples/docx-roundtrip
npm install
npm run dev
```

You need Node 18 or newer. The `@reviseio/editor` package is on the public
npm registry, so no account or token is needed.

## License

The example code in this repository is MIT licensed: copy it into your own
app. The `@reviseio/editor` package it depends on has its own
[license](https://revise.io/sdk/license): free for evaluation, personal
projects, and education. Production use by businesses, nonprofits, and
government requires a commercial license.

## Learn more

- [SDK documentation](https://revise.io/developer/docs/editor-sdk)
- [revise.io/sdk](https://revise.io/sdk)
- [A larger demo app](https://github.com/reviseio/sdk-demo) with every feature in one place
