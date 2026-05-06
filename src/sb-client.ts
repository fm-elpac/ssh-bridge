// sb-client.js
import { formatMessage, getSocketPath, parseLine, readLines } from "./util.ts";

// TODO --version --help
// --pub XXX --sub AAA --sub BBB
function parseArgs() {
  const args = Deno.args;
  const pub = new Set<string>();
  const sub = new Set<string>();
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    if (("--pub" == arg) && (i + 1 < args.length)) {
      pub.add(args[i + 1]);
      i += 2;
    } else if (("--sub" == arg) && (i + 1 < args.length)) {
      sub.add(args[i + 1]);
      i += 2;
    } else {
      console.error("ERROR: bad CLI arg: " + arg);
      Deno.exit(1);
    }
  }

  if (pub.size < 1) {
    pub.add("default");
  }

  return { pub, sub };
}

async function stdinToServer(conn: Deno.Conn, pub: Set<string>) {
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(Deno.stdin.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;
      if (!pub.has(msg.channel)) continue;

      await conn.write(encoder.encode(formatMessage(msg.channel, msg.data)));
    }
  } catch (e) {
    // ignore
    console.error(e);
  } finally {
    conn.closeWrite();
  }
}

async function serverToStdout(conn: Deno.Conn, sub: Set<string>) {
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(conn.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;

      if (sub.size > 0 && !sub.has(msg.channel)) {
        continue;
      }

      await Deno.stdout.write(
        encoder.encode(formatMessage(msg.channel, msg.data)),
      );
    }
  } finally {
    conn.close();
  }
}

async function main() {
  const { pub, sub } = parseArgs();

  const [socketPath] = getSocketPath();

  const conn = await Deno.connect({ path: socketPath, transport: "unix" });

  await Promise.all([
    stdinToServer(conn, pub),
    serverToStdout(conn, sub),
  ]);
}

await main();
