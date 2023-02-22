import puppeteer, { Page } from "puppeteer";
import { Readable } from "stream";
import { BoligPortalWebCrawler } from "./bolig-portal/bolig-portal.webcrawler";
import { PipelineMessage, WebCrawlerMessage } from "./message";

export abstract class Source {
  abstract get(message: PipelineMessage): Readable;
}

export abstract class WebCrawler extends Source {}

export const WebCrawlerBindings = {
  "bolig-portal": BoligPortalWebCrawler,
} as const;

export function getWebCrawler(message: WebCrawlerMessage) {
  const binding = WebCrawlerBindings[message.type];
  return new binding();
}
