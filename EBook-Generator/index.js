const playwright = require("playwright");
const path = require("path");
const fs = require("fs");
const merge = require("../util/pdf-merge");

require("dotenv").config();

const scrollToElement = async (page, selector) => {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
};

const autoScroll = async (page) => {
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
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
    const viewport = {
      width: 1920,
      height: 1080,
    };

    const browser = await playwright.chromium.launch({
      dumpio: true,
      ignoreDefaultArguments: true,
      ignoreHTTPSErrors: true,
      headless: true,
      defaultViewport: viewport,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = process.env.URL;
    await page.goto(url, { waitUntil: "networkidle0" });

    await page.waitForTimeout(2000);

    // 첫 번째 목차 링크
    const firstChapterPath = "#toc > li:nth-child(1) > a";
    const firstChapter = await page.$(firstChapterPath);
    firstChapter.click();

    let idx = 1;
    // 마지막 페이지에 도달할 때 까지 pdf로 변환
    while (true) {
      // 컨텐츠가 로딩되길 기다림
      await page.waitForSelector("#page_content");
      await page.waitForSelector("#page_banner");
      await page.waitForSelector(".thebook-content");
      // await autoScroll(page);
      await page.waitForTimeout(1500);

      const dirPath = path.resolve(process.cwd(), process.env.DIRECTORY);
      const isExists = fs.existsSync(dirPath);

      if (!isExists) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const body = await page.$("body");
      const pageContent = await page.$("#page_content");

      const chapterTitleContent = await (await page.$("head title")).textContent();
      const chapterTitle = chapterTitleContent
        .replace(/\n/g, "")
        .replace(/&nbsp;/g, "")
        .replace(/\t/g, " ")
        .replace(/    /g, " ");

      const fileName = `${idx} ${chapterTitle}.pdf`.replace(/[\{\}\[\]\/?,;:|\)*~`!^\+<>@\#$%&\\\=\(\'\"]/gi, "").replace(/\n/g, "");
      const fullPath = path.resolve(dirPath, fileName);
      const height = await page.evaluate(() => document.documentElement.offsetHeight);

      await page.evaluateHandle(() => {
        const btnGroupsPath = '//*[@id="thebook-main"]/section[4]';
        const btnGroups = document.evaluate(btnGroupsPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const header = document.querySelector("header");
        const footer = document.querySelector("footer");
        const embedSignup = document.getElementById("mc_embed_signup");
        const pageBanner = document.getElementById("page_banner");
        btnGroups.style.display = "none";
        header.parentNode.removeChild(header);
        footer.parentNode.removeChild(footer);
        pageBanner.parentNode.removeChild(pageBanner);
        embedSignup.parentNode.removeChild(embedSignup);
      });

      await page.pdf({ path: fullPath, format: "A4", printBackground: true, margin: "none", height: height + "px" });

      idx += 1;
      const nextPageBtn = await page.$("#next-page");
      if (!nextPageBtn) break;

      const nextUrl = await nextPageBtn.getAttribute("href");
      await page.goto(nextUrl);
    }

    console.log("created pdf files.");
    console.log("start merge pdf files.");
    await page.close();
    await browser.close();

    merge()
      .then(() => console.log("Done"))
      .catch(() => console.log("Fail"));
  } catch (err) {
    console.error(err);
  }
};

crawler().then(() => console.log("Done"));
