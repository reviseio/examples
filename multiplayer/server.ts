/**
 * The collaboration server: a Hocuspocus relay that also creates each room.
 *
 * Seeding here, rather than in the first browser to arrive, means two people
 * opening a brand-new room at once can never both import the document.
 * Rooms live in memory; add a Hocuspocus persistence extension to keep them.
 */
import { readFile } from "node:fs/promises";
import { Server } from "@hocuspocus/server";
import { seedYDocFromFile } from "@reviseio/editor/server";

const proposal = await readFile(new URL("./proposal.md", import.meta.url));

Server.configure({
  port: 1234,
  async onLoadDocument({ document }) {
    // Writes only into an empty room, so this is safe on every load.
    await seedYDocFromFile(document, proposal, "proposal.md");
  },
}).listen();
