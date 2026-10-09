# Revise SDK examples

Six small apps built on Revise. In the browser they use
[`@reviseio/editor`](https://www.npmjs.com/package/@reviseio/editor), the
Revise word processor for React; on the server they use
[`revise`](https://www.npmjs.com/package/revise), the MIT library and CLI for
reading, editing, and redlining documents. Each one shows a single way of
using them and keeps the important code in one or two files.

| Example | What it shows | Live demo |
| --- | --- | --- |
| [**docx-roundtrip**](docx-roundtrip) | Open a `.docx`, edit it, download `.docx` or PDF. Autosaves to IndexedDB. | [Open](https://reviseio.github.io/examples/docx-roundtrip/) |
| [**custom-toolbar**](custom-toolbar) | No ribbon: your own toolbar, colors, and fonts around the page. | [Open](https://reviseio.github.io/examples/custom-toolbar/) |
| [**ai-redline**](ai-redline) | Claude edits the document through the SDK's tools as tracked changes you review. | [Open](https://reviseio.github.io/examples/ai-redline/) |
| [**multiplayer**](multiplayer) | Real-time editing with live carets over a Hocuspocus server. | Run locally |
| [**server-redline**](server-redline) | Redline a `.docx` in Node with `revise`. No browser, no model. | Run locally |
| [**review-portal**](review-portal) | Editor, suggester, and viewer roles with comments and a custom review panel. | [Open](https://reviseio.github.io/examples/review-portal/) |

## Run an example

Every example is a standalone project. Copy the folder, or:

```bash
git clone https://github.com/reviseio/examples.git
cd examples/docx-roundtrip
npm install
npm run dev
```

You need Node 20 or newer. Both packages are on the public npm registry, so
no account or token is needed.

## License

The example code in this repository is MIT licensed: copy it into your own
app. `revise` is MIT too, and runs on `@reviseio/engine`, which is free for
any use under its own license. The `@reviseio/editor` package has its own
[license](https://revise.io/sdk/license): free for evaluation, personal
projects, and education. Production use by businesses, nonprofits, and
government requires a commercial license.

## Learn more

- [Editor documentation](https://revise.io/developer/docs/editor-sdk/introduction)
- [`revise` documentation](https://revise.io/developer/docs/revise/introduction)
- [revise.io/sdk](https://revise.io/sdk)
- [A larger demo app](https://github.com/reviseio/sdk-demo) with every feature in one place
