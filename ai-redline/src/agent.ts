import Anthropic from "@anthropic-ai/sdk";
import type { ReviseEditorHandle } from "@reviseio/editor";

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; ok: boolean; detail: string };

const SYSTEM = `You edit the document open in the user's editor, using the tools provided.
Read the document before you change it. Every edit you make becomes a tracked
change the user will accept or reject, so keep each edit small and targeted.
Use leave_comment for feedback that is not a text change.
When you are done, reply in two or three plain sentences (no Markdown)
describing what you changed.`;

/**
 * The whole Revise ↔ Claude contract: send the editor's tool schemas, run
 * each tool call against the editor, return the results, repeat.
 * Returns the IDs of the tracked changes the run created.
 */
export async function runAgent(options: {
  client: Anthropic;
  editor: ReviseEditorHandle;
  instruction: string;
  onEvent: (event: AgentEvent) => void;
}): Promise<string[]> {
  const { client, editor, instruction, onEvent } = options;
  const tools = editor.tools.getDefinitions().map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
  }));
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: instruction },
  ];
  const suggestionIds: string[] = [];

  for (let turn = 0; turn < 20; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 16000,
      system: SYSTEM,
      tools,
      messages,
      output_config: { effort: "medium" },
    });
    messages.push({ role: "assistant", content: response.content });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        onEvent({ type: "text", text: block.text });
      }
    }
    if (response.stop_reason === "refusal") throw new Error("Claude declined this request.");
    if (response.stop_reason !== "tool_use") return suggestionIds;

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      // executeDynamic validates untrusted model input and never throws for
      // an expected failure: it returns { ok: false, error } instead.
      const result = await editor.tools.executeDynamic(
        block.name,
        block.input as Record<string, unknown>,
      );
      if (result.ok) {
        suggestionIds.push(...(result.value.suggestionIds ?? []));
        // Reads return the document itself, with block IDs, in context.html.
        const content = [result.value.message, result.value.context?.html]
          .filter(Boolean)
          .join("\n\n");
        results.push({ type: "tool_result", tool_use_id: block.id, content: content || "Done." });
        onEvent({ type: "tool", name: block.name, ok: true, detail: result.value.message ?? "" });
      } else {
        const content = `${result.error.code}: ${result.error.message}`;
        results.push({ type: "tool_result", tool_use_id: block.id, content, is_error: true });
        onEvent({ type: "tool", name: block.name, ok: false, detail: content });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return suggestionIds;
}
