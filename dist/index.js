var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import puppeteer from "puppeteer";
import fs from "fs/promises";
import { Readable, Transform } from "stream";
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    });
}
function dataExtractionFromPage(elems) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = elems;
        // Get info for each listing
        // 0 -> div <rooms, (house / apt), size m3> div <region>
        // 1 -> Desc
        // 2 -> span <time since posted> div <price>
        const info = (yield Promise.all(elems.map((elem) => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield elem.$eval("div > a", (e) => e.href);
                const specs = yield elem.$$("div > a > div > div:nth-child(3) > div > div > *");
                return { url, specs };
            }
            catch (e) {
                return { url: "", specs: [] };
            }
        })))).filter((e) => e.specs.length === 3);
        const objects = yield Promise.all(info.map(({ specs, url }) => __awaiter(this, void 0, void 0, function* () {
            yield specs[0].waitForSelector("> *");
            yield specs[2].waitForSelector("> div > span");
            const obj = {
                url,
                desc: yield specs[0].$$eval("> *", (divs) => divs.map((div) => div.innerHTML)),
                price: yield specs[2].$eval("> div > span", (elem) => elem.innerHTML),
            };
            yield Promise.all(specs.map((e) => e.dispose()));
            return obj;
        })));
        return objects.map(({ desc, price, url }) => ({
            url,
            loc: desc[1].split("<!-- -->")[0],
            rooms: Number.parseInt(desc[0].split(" ")[0]),
            size: Number.parseFloat(desc[0].split(" ")[5]),
            price_1k: Number.parseFloat(price.split("&")[0]),
        }));
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer.launch({ headless: false });
    const page = yield browser.newPage();
    //   await page.setViewport({ width: 1080, height: 1024 });
    yield page.goto("https://www.boligportal.dk/en/rental-apartments,rental-houses/k%C3%B8benhavn/?min_rental_period=12");
    // Accept cookies
    yield page.waitForSelector("#coiPage-1 > div.coi-banner__page-footer > div > button.coi-banner__accept");
    yield page.click("#coiPage-1 > div.coi-banner__page-footer > div > button.coi-banner__accept");
    const x = Readable.from((function getAllData() {
        return __asyncGenerator(this, arguments, function* getAllData_1() {
            while (true) {
                // Select all listings
                yield __await(page.waitForSelector("#app > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(2) > div:nth-child(9) > div > div"));
                const elems = yield __await(page.$$("#app > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(2) > div:nth-child(9) > div > div"));
                const data = yield __await(dataExtractionFromPage(elems));
                yield __await(yield* __asyncDelegator(__asyncValues(data)));
                yield __await(Promise.all(elems.map((e) => e.dispose())));
                const nextButton = yield __await(page.waitForSelector("#app > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(2) > div:last-child > div > div > button:last-child"));
                if (!nextButton) {
                    throw new Error("No next button");
                }
                const isDisabled = yield __await((yield __await(nextButton.getProperty("disabled"))).jsonValue());
                if (isDisabled) {
                    break;
                }
                yield __await(Promise.all([
                    page.waitForNavigation({
                        waitUntil: "networkidle0",
                    }),
                    nextButton.click(),
                ]));
                yield __await(nextButton.dispose());
            }
        });
    })());
    //   const texts = await Promise.all(
    //     names.map((elem) => elem?.$$eval("div", (el) => el.map((e) => e.innerHTML)))
    //   );
    yield fs.writeFile("out.json", x.pipe(new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            callback(null, JSON.stringify(chunk) + "\n");
        },
    })));
    yield browser.close();
    //   console.log(names);
}))();
//# sourceMappingURL=index.js.map