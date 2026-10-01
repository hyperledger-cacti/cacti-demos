import { Writable } from "stream";

/**
 * Minimal readable-stream contract used by the aggregate helpers: anything
 * that emits "data" chunks, "error" and "end" events. Accepts both Node.js
 * streams and the streamx-based streams emitted by tar-stream v3's "entry"
 * events, whose types are structurally incompatible with Node's Stream.
 */
export interface AggregatableStream {
  on(event: "data", listener: (chunk: unknown) => void): unknown;
  on(event: "error", listener: (err: unknown) => void): unknown;
  on(event: "end", listener: () => void): unknown;
}

export class Streams {
  /**
   * A writable stream that discards everything written to it. Useful as the
   * output stream of `dockerode.run()` when container output is not needed:
   * passing an empty array there makes dockerode demultiplex the attached
   * stdio stream into `undefined` streams, crashing docker-modem as soon as
   * the container produces output.
   */
  public static noopWritable(): NodeJS.WritableStream {
    return new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
  }

  public static aggregate<T>(
    stream: AggregatableStream,
    encoding:
      | "ascii"
      | "utf8"
      | "utf-8"
      | "utf16le"
      | "ucs2"
      | "ucs-2"
      | "base64"
      | "latin1"
      | "binary"
      | "hex"
      | undefined = "utf-8",
  ): Promise<T[]> {
    const data: T[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: unknown) => {
        if (!Buffer.isBuffer(chunk)) {
          reject(
            new Error(
              `Streams#aggregate() expected Buffer chunks but got: ${typeof chunk}`,
            ),
          );
          return;
        }
        const item = chunk.toString(encoding) as unknown as T;
        data.push(item);
      });

      stream.on("error", (err: unknown) => {
        if (err instanceof Error) {
          reject(err);
        } else if (typeof err === "string") {
          reject(
            new Error(
              `Streams#aggregate() stream failed internally with: ${err}`,
            ),
          );
        } else {
          reject(
            new Error(
              `Streams#aggregate() stream failed internally with: ${JSON.stringify(
                err,
              )}`,
            ),
          );
        }
      });

      stream.on("end", () => {
        resolve(data);
      });
    });
  }

  public static aggregateToBuffer(
    stream: AggregatableStream,
  ): Promise<Buffer[]> {
    const fnTag = `Streams#aggregateToBuffer()`;
    const data: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: unknown) => {
        if (!Buffer.isBuffer(chunk)) {
          reject(
            new Error(
              `${fnTag} expected Buffer chunks but got: ${typeof chunk}`,
            ),
          );
          return;
        }
        data.push(chunk);
      });

      stream.on("error", (err: unknown) => {
        if (err instanceof Error) {
          reject(err);
        } else if (typeof err === "string") {
          reject(new Error(`${fnTag} stream failed with: ${err}`));
        } else {
          reject(
            new Error(`${fnTag} stream failed with: ${JSON.stringify(err)}`),
          );
        }
      });

      stream.on("end", () => {
        resolve(data);
      });
    });
  }
}
