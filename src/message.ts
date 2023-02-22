import { WebCrawlerBindings } from "./source";

export interface WebCrawlerMessage {
  type: keyof typeof WebCrawlerBindings;
  startUri: string;
}

export interface WebCrawlerPipelineMessage {
  webcrawler: WebCrawlerMessage;
}

export interface FilePipelineMessage {
  file: string;
}

export interface PipelineMessage<
  F extends WebCrawlerPipelineMessage | FilePipelineMessage =
    | WebCrawlerPipelineMessage
    | FilePipelineMessage,
  T extends FilePipelineMessage = FilePipelineMessage
> {
  from: F;
  to: T;
}
