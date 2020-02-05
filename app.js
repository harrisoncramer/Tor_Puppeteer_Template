require('dotenv').config();
const logger = require("./logger");
const { setupPuppeteer, setPageBlockers, setPageScripts } = require("./setup");

const getLinks = async (page) => {
  logger.info(`Performing work...`);
  await setPageScripts(page);
  let links = await page.evaluate(_ => {
    let urlChecker = new RegExp("^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$");
    let links = makeArrayFromDocument("a")
      .filter(x => x.href.match(urlChecker)) // Get rid of non-links...
      .map(x => new URL(x.href)) // Turn into URLs..
      .filter(x => x.host === "www.nationaljournal.com" && x.href !== window.location.href) // Where host is the same, but not entire URL.
      .reduce((agg, item) => agg.some(x => x.href === item.href) ? agg : [ ...agg, item ], []); // Remove duplicates...
    return JSON.stringify(links);
  });
  return links;
};

const scrape = async (url) => {
  
  const { browser, page } = await setupPuppeteer();

  try {
    await setPageBlockers(page);
    await page.goto(url, 0);
    let stringLinks = await getLinks(page);
    let links = JSON.parse(stringLinks);
    console.log(links.length, links);
  } catch (err) {
    logger.error(`There was an error with the bot: `, err);
    process.exit(1);
  };

  await browser.close();
  logger.info(`Browser closed.`);
  process.exit(0);

};

scrape('https://www.nationaljournal.com/dashboard');

