require('dotenv').config();
const fs = require("fs-extra");
const logger = require("./logger");
const { setupPuppeteer, setPageBlockers, setPageScripts } = require("./setup");
const { getLinks } = require("./pageFunctions");

const cleanLink = (url) => url.split("?")[0];

const scrape = async ({ url, limit }) => {

  logger.info(`Running bot in ${process.env.NODE_ENV}`);

  // Set up variables
  let unscraped = new Set([ url ]);
  let scraped = new Set();
  const { browser, page } = await setupPuppeteer();
  await setPageBlockers(page);

  // While there are still unscraped links, scrape the first one in the set!
  while(unscraped.size > 0){
    if(unscraped.size > limit){
      logger.info(`Unscraped size exceeds ${limit}-page limit.`); // Unless we have accumulated too many links.
      [ ...unscraped ].forEach(link => scraped.add(link));
      fs.writeFile(`${url}.json`, JSON.stringify([ ...scraped ]), function(err) {
        if(err) return logger.error('There was an error writing the file', err);
      });
      break;
    };
    
    let url = [...unscraped][0]; // Get first item in the array.
    unscraped = new Set([...unscraped].slice(1, unscraped.size)); // Remove it from the "unscraped" set.
    
    let originalLength = scraped.size;
    scraped.add(url);
    if(originalLength === scraped.size){ // If the two sets are the same size, it means the url was already in the scraped array, and we don't have to re-scrape it.
      break;
    }
    await page.goto(url, 0);
    await setPageScripts(page);
    let links = JSON.parse(await getLinks(page));
    links.forEach(link => unscraped.add(cleanLink(link)));
    logger.info(`Found ${links.length} links on ${url}; Unscraped: ${unscraped.size}; Scraped: ${scraped.size};`);  
  }

  fs.writeFile('data.json', JSON.stringify([ ...unscraped, ...scraped ]), function(err) {
    if(err) return logger.error('There was an error writing the file', err);
  });

  await browser.close();
  logger.info(`Browser closed.`);
  process.exit(0);

};

scrape({ url: 'https://www.nationaljournal.com/dashboard', limit: 100 });