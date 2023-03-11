import { PipelineMessage, WebCrawlerPipelineMessage } from "../message";
import { WebCrawler } from "../source";
import { Readable } from "stream";
import puppeteer, { ElementHandle, Page } from "puppeteer";

export class BoligPortalWebCrawler implements WebCrawler {
  private readonly baseUrl = "https://www.boligportal.dk";

  get(message: PipelineMessage<WebCrawlerPipelineMessage>): Readable {
    const iter = this.getHousingData(message);
    return Readable.from(iter);
  }

  private async *getHousingData(
    message: PipelineMessage<WebCrawlerPipelineMessage>
  ) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(this.baseUrl + message.from.webcrawler.startUri);
    await this.acceptCookies(page);

    while (true) {
      const listings = await this.getAllListingElements(page);
      const listingDetails = (
        await Promise.all(
          listings.map((listing) => this.getUrlAndDataInListing(listing))
        )
      ).filter(({ specs }) => specs.length === 3);
      const data = await Promise.all(
        listingDetails.map((detail) => this.extractDataInListing(detail))
      );

      yield* data.map(({ desc, price, url }) => ({
        url,
        loc: desc[1].split("<!-- -->")[0],
        rooms: Number.parseInt(desc[0].split(" ")[0]),
        size: Number.parseFloat(desc[0].split(" ")[5]),
        price_1k: Number.parseFloat(price.split("&")[0]),
      }));

      await Promise.all(listings.map((e) => e.dispose()));
      await Promise.all(
        listingDetails.flatMap((e) => e.specs.map((e2) => e2.dispose()))
      );

      const nextButton = await page.waitForSelector(
        "#app > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(2) > div:last-child > div > div > button:last-child"
      );

      if (!nextButton) {
        throw new Error("No next button");
      }

      const isDisabled = await (
        await nextButton.getProperty("disabled")
      ).jsonValue();

      if (isDisabled) {
        browser.close();
        break;
      }

      await Promise.all([
        page.waitForNavigation({
          waitUntil: "networkidle0",
        }),
        nextButton.click(),
      ]);
      await nextButton.dispose();
    }
  }

  private async getAllListingElements(page: Page) {
    const rentalListingSelector =
      "#app > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(2) > div:nth-child(9) > div > div";
    await page.waitForSelector(rentalListingSelector);
    return page.$$(rentalListingSelector);
  }

  private async acceptCookies(page: Page) {
    const cookiesAcceptSelector =
      "#coiPage-1 > div.coi-banner__page-footer > div > button.coi-banner__accept";
    await page.waitForSelector(cookiesAcceptSelector);
    await page.click(cookiesAcceptSelector);
  }

  private async getUrlAndDataInListing(listing: ElementHandle<HTMLDivElement>) {
    try {
      const url = await listing.$eval("div > a", (e) => e.href);
      const specs = await listing.$$(
        "div > a > div > div:nth-child(3) > div > div > *"
      );

      return { url, specs };
    } catch (e) {
      return { url: "", specs: [] };
    }
  }

  private async extractDataInListing({
    url,
    specs,
  }: {
    url: string;
    specs: ElementHandle<Element>[];
  }) {
    await specs[0].waitForSelector("> *");
    await specs[2].waitForSelector("> div > span");

    const obj = {
      url,
      desc: await specs[0].$$eval("> *", (divs) =>
        divs.map((div) => div.innerHTML)
      ),
      price: await specs[2].$eval("> div > span", (elem) => elem.innerHTML),
    };

    // await Promise.all(specs.map((e) => e.dispose()));

    return obj;
  }
}

// async function dataExtractionFromPage(elems: ElementHandle<HTMLDivElement>[]) {
//   // Get info for each listing
//   // 0 -> div <rooms, (house / apt), size m3> div <region>
//   // 1 -> Desc
//   // 2 -> span <time since posted> div <price>

//   // Extract URL
//   const info = (
//     await Promise.all(
//       elems.map(async (elem) => {
//         try {
//           const url = await elem.$eval("div > a", (e) => e.href);
//           const specs = await elem.$$(
//             "div > a > div > div:nth-child(3) > div > div > *"
//           );

//           return { url, specs };
//         } catch (e) {
//           return { url: "", specs: [] };
//         }
//       })
//     )
//   )
//     .filter((e) => e.specs.length === 3)
//     .map(async ({ specs, url }) => {
//       await specs[0].waitForSelector("> *");
//       await specs[2].waitForSelector("> div > span");

//       const obj = {
//         url,
//         desc: await specs[0].$$eval("> *", (divs) =>
//           divs.map((div) => div.innerHTML)
//         ),
//         price: await specs[2].$eval("> div > span", (elem) => elem.innerHTML),
//       };

//       await Promise.all(specs.map((e) => e.dispose()));

//       return obj;
//     });

//   const objects = await Promise.all(info.map());

//   return objects.map(({ desc, price, url }) => ({
//     url,
//     loc: desc[1].split("<!-- -->")[0],
//     rooms: Number.parseInt(desc[0].split(" ")[0]),
//     size: Number.parseFloat(desc[0].split(" ")[5]),
//     price_1k: Number.parseFloat(price.split("&")[0]),
//   }));
// }
