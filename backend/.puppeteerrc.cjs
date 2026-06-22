const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer so it's copied to Render's runtime container
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
