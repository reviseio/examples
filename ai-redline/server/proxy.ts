/**
 * Optional: keep the API key off the client. Run with
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx server/proxy.ts
 * and create the client with
 *   new Anthropic({ apiKey: "unused", baseURL: "http://localhost:8787", dangerouslyAllowBrowser: true })
 * A real deployment would also authenticate your own users here.
 */
import http from "node:http";

http
  .createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "*");
    if (request.method === "OPTIONS") return response.end();
    const body: Buffer[] = [];
    for await (const chunk of request) body.push(chunk as Buffer);
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "anthropic-version": String(request.headers["anthropic-version"] ?? "2023-06-01"),
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    };
    const beta = request.headers["anthropic-beta"];
    if (beta) headers["anthropic-beta"] = String(beta);
    const upstream = await fetch(`https://api.anthropic.com${request.url}`, {
      method: request.method,
      headers,
      body: request.method === "POST" ? Buffer.concat(body) : undefined,
    });
    response.writeHead(upstream.status, { "content-type": "application/json" });
    response.end(Buffer.from(await upstream.arrayBuffer()));
  })
  .listen(8787, () => console.log("Proxy on http://localhost:8787"));
