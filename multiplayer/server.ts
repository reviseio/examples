/**
 * The collaboration server: a Hocuspocus relay that also creates each room.
 *
 * Seeding here, rather than in the first browser to arrive, means two people
 * opening a brand-new room at once can never both import the document.
 * Rooms live in memory; add a Hocuspocus persistence extension to keep them.
 */
import { readFile } from "node:fs/promises";
import { Server } from "@hocuspocus/server";
import { seedYDoc } from "revise";

const proposal = {
  bytes: await readFile(new URL("./proposal.md", import.meta.url)),
  filename: "proposal.md",
};

Server.configure({
  port: 1234,
  async onLoadDocument({ document }) {
    // Writes only into an empty room, so this is safe on every load.
    await seedYDoc(document, proposal);
  },
}).listen();
