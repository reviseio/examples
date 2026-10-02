/**
 * Redline a contract against a playbook, with no browser and no model.
 *
 *   npx tsx redline.ts nda.docx playbook.json
 *
 * Every edit becomes a tracked change and every flag becomes a comment, so
 * the output opens in Word ready for review.
 */
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import {
  createServerDocumentSession,
  fileToYDoc,
  ydocToDocx,
} from "revise/server";

interface Playbook {
  edits: { find: string; replace: string; comment?: string }[];
  flags: { text: string; comment: string }[];
}

const [input = "nda.docx", playbookPath = "playbook.json"] =
  process.argv.slice(2);
const playbook: Playbook = JSON.parse(await readFile(playbookPath, "utf8"));

// Load the file into a Yjs document and open a tool session on it. Sessions
// start in suggesting mode, so every edit below is a tracked change.
const ydoc = await fileToYDoc(await readFile(input), basename(input));
const session = await createServerDocumentSession(ydoc, {
  documentId: "contract",
});

for (const { find, replace, comment } of playbook.edits) {
  const search = await session.tools.call("search_document", {
    queries: [find],
    page: 0,
  });
  const searchResultId = search.data.search_result_id;
  if (!searchResultId) {
    console.log(`  skip  "${find}" (not found)`);
    continue;
  }
  // One call edits every block that matched, and attaches the comment to
  // each tracked change it creates.
  const edit = await session.tools.call("replace", {
    search_result_id: searchResultId,
    replacements: [{ find, replace, comment, occurrence: "all" }],
  });
  console.log(
    `  edit  "${find}" → "${replace}" (${edit.suggestionIds?.length ?? 0} tracked)`,
  );
}

for (const { text, comment } of playbook.flags) {
  const search = await session.tools.call("search_document", {
    queries: [text],
    page: 0,
  });
  const blockId = search.data.matches[0]?.blockId;
  if (!blockId) {
    console.log(`  skip  "${text}" (not found)`);
    continue;
  }
  await session.tools.call("leave_comment", {
    id: blockId,
    anchor: { text },
    comment,
  });
  console.log(`  flag  "${text}"`);
}

const output = `${basename(input, extname(input))}-redlined.docx`;
await writeFile(output, await ydocToDocx(ydoc));
console.log(
  `\n${session.listSuggestions().length} tracked changes → ${output}`,
);
session.dispose();
