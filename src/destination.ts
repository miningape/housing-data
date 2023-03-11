import { PipelineMessage } from "./message";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";

export abstract class Destination {
  abstract set(message: PipelineMessage, stream: Readable): Promise<void>;
}

export class FileDestination implements Destination {
  async set(message: PipelineMessage, dataStream: Readable): Promise<void> {
    await pipeline(
      dataStream,
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          callback(null, JSON.stringify(chunk) + "\n");
        },
      }),
      createWriteStream(message.to.file)
    );
  }
}
