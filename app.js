require('dotenv').config();
const logger = require("./logger");
const { setupPuppeteer, setPageBlockers, setPageScripts } = require("./setup");
const work = async (page) => {
  logger.info(`Performing work...`);
};

const scrape = async (url) => {
  
  const { browser, page } = await setupPuppeteer();

  try {
    await setPageBlockers(page);
    await setPageScripts(page);
    await page.goto(url, 0);
    await work(page);
  } catch (err) {
    logger.error(`There was an error with the bot: `, err);
    process.exit(1);
  };

  await browser.close();
  logger.info(`Browser closed.`);
  process.exit(0);

};

scrape('https://www.nationaljournal.com/dashboard');

