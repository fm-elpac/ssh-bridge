import * as path from "@std/path";
import { TextLineStream } from "@std/streams/text-line-stream";

export interface Message {
  channel: string;
  data: unknown;
}

export function parseLine(line: string): Message | undefined {
  try {
    // first `:`
    const i = line.indexOf(":");
    if (i > 0) {
      const channel = line.slice(0, i);
      const jsonStr = line.slice(i + 1);
      return {
        channel,
        data: JSON.parse(jsonStr),
      };
    }
  } catch (e) {
    // ignore
    console.error("bad line", line);
    console.log(e);
  }
}

export function formatMessage(channel: string, data: unknown): string {
  const jsonStr = JSON.stringify(data);
  return `${channel}: ${jsonStr}\n`;
}

// UNIX socket: $XDG_RUNTIME_DIR/ssh-bridge/server
export function getSocketPath(): [string, string] {
  const runtimeDir = Deno.env.get("XDG_RUNTIME_DIR");
  if (!runtimeDir) {
    console.error("XDG_RUNTIME_DIR environment variable is not set");
    Deno.exit(1);
  }

  const dir = path.join(runtimeDir, "ssh-bridge");
  const socketPath = path.join(dir, "server");

  return [socketPath, dir];
}

export async function* readLines(
  readable: ReadableStream<Uint8Array<ArrayBuffer>>,
): AsyncGenerator<string> {
  const s = readable.pipeThrough<string>(new TextDecoderStream()).pipeThrough<
    string
  >(new TextLineStream());
  for await (const i of s) {
    yield i;
  }
}
