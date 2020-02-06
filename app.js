require('dotenv').config();
const logger = require("./logger");
const { setupPuppeteer, setPageBlockers, setPageScripts } = require("./setup");
const { asyncForEach } = require("./util");

const getLinks = async (page) => {
  logger.info(`Performing work...`);
  await setPageScripts(page);
  let links = await page.evaluate(_ => {
    let urlChecker = new RegExp("^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$");
    let links = makeArrayFromDocument("a")
      .filter(x => x.href.match(urlChecker)) // Get rid of non-links...
      .map(x => {
        let noHashNoQuery = x.href.split("#")[0].split("?")[0];
        let cleanedUrlObject = new URL(noHashNoQuery);
        return cleanedUrlObject;
      }) // Turn into URLs..
      .filter(x => !x.href.endsWith('pdf')) // Remove PDFs...
      .filter(x => x.host === new URL(window.location.href).host && x.href !== window.location.href) // Where host is the same, but not entire URL...
      .reduce((agg, item) => agg.some(x => x.href === item.href) ? agg : [ ...agg, item ], []); // Remove duplicates...
    return JSON.stringify(links);
  });
  return links;
};

const round = async (round, links, page) => {
  logger.info('Running round ' + round);
  await asyncForEach(links, async (url) => {
    await page.goto(url, 0);
    let stringLinks = await getLinks(page);
    links = [ ...links, ...JSON.parse(stringLinks) ].reduce((agg, item) => agg.some(x => x === item) ? agg : [ ...agg, item ], []);  
  });
  return links;
};

const scrape = async (url) => {
  logger.info(`Running bot in ${process.env.NODE_ENV}`);
  const { browser, page } = await setupPuppeteer();

  try {
    await setPageBlockers(page);
    await page.goto(url, 0);
    let stringLinks = await getLinks(page);
    
    let links = JSON.parse(stringLinks);
    links = await round(1, links, page);
    links = await round(2, links, page);
    console.log(`Links: ${links} \n\n Total Links ${links.length}`);
  } catch (err) {
    logger.error(`There was an error with the bot: `, err);
    process.exit(1);
  };

  await browser.close();
  logger.info(`Browser closed.`);
  process.exit(0);

};

scrape('https://www.nationaljournal.com');