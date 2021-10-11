const puppeteer = require("puppeteer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const scrollToElement = async (page, selector) => {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
};

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

const crawler = async () => {
  try {
    const options = {
      width: 1920,
      height: 1080,
    };

    const browser = await puppeteer.launch({
      dumpio: true,
      ignoreDefaultArguments: true,
      ignoreHTTPSErrors: true,
      headless: true,
      args: [
        `--window-size=${options.width},${options.height}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-dev-shm-usage",
        "--user-data-dir",
        "--enable-usermedia-screen-capturing",
        "--allow-http-screen-capture",
        "--disable-infobars",
        "--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure",
      ],
    });

    const page = await browser.newPage();
    await page.goto("", { waitUntil: "networkidle0" });
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    await page.waitForTimeout(2000);
    const items = await page.evaluate(() => {
      const contents = document.getElementById("toc");
      const hrefs = Array.from(contents.querySelectorAll("a"));
      const items = hrefs.map((item) => {
        return {
          title: item.textContent,
          link: item.href,
        };
      });

      return items;
    });

    const dirPath = path.resolve(process.cwd(), "java");
    const isExists = fs.existsSync(dirPath);

    if (!isExists) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const promises = items.map(async (item) => {
      const linkPage = await browser.newPage();
      const fileName = `${item.title}.pdf`.replace(/[\{\}\[\]\/?,;:|\)*~`!^\+<>@\#$%&\\\=\(\'\"]/gi, "");

      await linkPage.goto(item.link, { waitUntil: "networkidle0" });
      await linkPage.setViewport({
        width: 1200,
        height: 800,
      });
      await linkPage.waitForTimeout(3000);

      const fullPath = path.resolve(dirPath, fileName);
      await linkPage.pdf({ path: fullPath, format: "A4" });

      const body = await linkPage.evaluate(() => {
        const pageContent = document.getElementById("page_content").outerHTML;
        const body = document.querySelector("body");
        body.innerHTML = pageContent;

        return body;
      });
      await linkPage.waitForTimeout(2000);

      const height = await linkPage.evaluate(() => document.documentElement.offsetHeight);
      await linkPage.pdf({ path: fullPath, format: "A4", printBackground: true, margin: "none", height: height + "px" });
      await linkPage.close();
    });

    await Promise.all(promises);

    await page.close();
    await browser.close();
  } catch (err) {
    console.log(`Failed to convert URL to PDF ( ${err.name} - ${err.message})`);
    console.log(err);
  }
};

crawler().then(() => console.log("Done"));
