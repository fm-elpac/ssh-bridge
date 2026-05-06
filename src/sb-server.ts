// sb-server.js
import { formatMessage, getSocketPath, parseLine, readLines } from "./util.ts";

const connections = new Set<Deno.Conn>();

async function handleConnection(conn: Deno.Conn) {
  connections.add(conn);
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(conn.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;

      const outputLine = formatMessage(msg.channel, msg.data);
      const buf = encoder.encode(outputLine);

      for (const writer of connections) {
        try {
          // NO `await` here, do not block !
          writer.write(buf);
        } catch (e) {
          // ignore
          console.error(e);
        }
      }
    }
  } catch (e) {
    // ignore
    console.error(e);
  }

  // clean up
  connections.delete(conn);
  try {
    conn.close();
  } catch (e) {
    // ignore
    console.error(e);
  }
}

async function main() {
  const [socketPath, dir] = getSocketPath();

  await Deno.mkdir(dir, { recursive: true });
  try {
    await Deno.remove(socketPath);
  } catch (e) {
    // ignore
    console.error(e);
  }

  const listener = Deno.listen({ path: socketPath, transport: "unix" });
  console.log(`Listening on ${socketPath}`);

  for await (const conn of listener) {
    handleConnection(conn);
  }
}

await main();
