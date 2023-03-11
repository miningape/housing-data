import { Destination, FileDestination } from "./destination";
import { PipelineMessage } from "./message";
import { getWebCrawler, Source } from "./source";

async function start(args: PipelineMessage[]) {
  await Promise.all(
    args.map(async (message) => {
      const source = await getSource(message);
      const destination = await getDestination(message);

      const stream = source.get(message);
      await destination.set(message, stream);
    })
  );
}

function getSource(message: PipelineMessage): Source {
  const from = message.from;

  if ("webcrawler" in from) {
    return getWebCrawler(from.webcrawler);
  }

  throw new Error("Could not match: " + Object.keys(from));
}

function getDestination(message: PipelineMessage): Destination {
  const to = message.to;

  if ("file" in to) {
    return new FileDestination();
  }

  throw new Error("Could not match: " + Object.keys(to).join(", "));
}

start([
  {
    from: {
      webcrawler: {
        type: "bolig-portal",
        startUri:
          "/rental-apartments,rental-houses/k%C3%B8benhavn/?min_rental_period=12",
      },
    },
    to: {
      file: "out.nljson.dump",
    },
  },
]);
