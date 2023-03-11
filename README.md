# Housing Price Analysis

- 🕵️‍♂️ Scrapes housing data from online sources (fx. [boligportal](https://www.boligportal.dk/en))
- 👨‍🔧 Data pipelines built using Puppeteer and TypeScript
- 🧐 Analysis done in Dash, Plotly and Python to find houses that are especially cheap for a given size / location

## Usage

To start the pipeline and collect data run:

```bash
yarn start
```

This will append the collected housing data to the `out.nljson.dump` file.

To visualise this data run:

```bash
yarn graph
```

and navigate to `http://127.0.0.1:8050/` to view and interact with the data.

## How it works?

1. We collect data using Puppeteer.js to navigate to different webpages and scrape data from them, and then continue to the next page.
1. This data is turned into a stream which is then processed to clean up each record - making it both more easily readable and more easily consumable.
1. The stream of JSON records is then piped to `out.nljson.dump` and each record is separated by newlines (both source and destination behaviours can be modified inside `src/index.ts`)
1. We then use pandas dataframes to further clean the data (mostly eliminating data not needed for the visualisation, and removing duplicate records). Then we use Plotly to display this data in a quick/simple way - followed by using Dash to add interactivity (i.e. creating links to the original posting)
