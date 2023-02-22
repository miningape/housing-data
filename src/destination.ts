import { PipelineMessage } from "./message";
import { Readable } from "stream";
import { writeFile } from "fs/promises";

export abstract class Destination {
  abstract set(message: PipelineMessage, stream: Readable): Promise<void>;
}

export class FileDestination implements Destination {
  async set(message: PipelineMessage, stream: Readable): Promise<void> {
    await writeFile(message.to.file, stream);
  }
}
