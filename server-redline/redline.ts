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
import { ReviseDocument } from "revise";

interface Playbook {
  edits: { find: string; replace: string; comment?: string }[];
  flags: { text: string; comment: string }[];
}

const [input = "nda.docx", playbookPath = "playbook.json"] =
  process.argv.slice(2);
const playbook: Playbook = JSON.parse(await readFile(playbookPath, "utf8"));

// Word files open in suggesting mode, so every edit below is a tracked
// change. `author` signs them.
const doc = await ReviseDocument.open(input, { author: "Playbook" });

for (const { find, replace, comment } of playbook.edits) {
  const search = await doc.tools.call("search_document", {
    queries: [find],
    page: 0,
  });
  const searchResultId = search.ok ? search.value.data.search_result_id : null;
  if (!searchResultId) {
    console.log(`  skip  "${find}" (not found)`);
    continue;
  }
  // One call edits every block that matched, and attaches the comment to
  // each tracked change it creates.
  const edit = await doc.tools.call("replace", {
    search_result_id: searchResultId,
    replacements: [{ find, replace, comment, occurrence: "all" }],
  });
  if (!edit.ok) {
    console.log(`  fail  "${find}": ${edit.error.message}`);
    continue;
  }
  console.log(
    `  edit  "${find}" → "${replace}" (${edit.value.suggestionIds?.length ?? 0} tracked)`,
  );
}

for (const { text, comment } of playbook.flags) {
  const search = await doc.tools.call("search_document", {
    queries: [text],
    page: 0,
  });
  const blockId = search.ok ? search.value.data.matches[0]?.blockId : undefined;
  if (!blockId) {
    console.log(`  skip  "${text}" (not found)`);
    continue;
  }
  await doc.tools.call("leave_comment", {
    id: blockId,
    anchor: { text },
    comment,
  });
  console.log(`  flag  "${text}"`);
}

const output = `${basename(input, extname(input))}-redlined.docx`;
const { bytes } = await doc.export({ format: "docx" });
await writeFile(output, bytes);
console.log(`\n${(await doc.changes()).length} tracked changes → ${output}`);
doc.dispose();
