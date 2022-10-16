const { chromium } = require("playwright");
const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs");

const userDataDir = "/tmp/test-user-data-dir";
const extensionPath =
  "/Users/jcjeong/Library/Application Support/Google/Chrome/Default/Extensions/lmjnegcaeklhafolokijcfjliaokphfk/7.6.3.3_0";

const viewport = {
  width: 1920,
  height: 1080,
};

const app = async () => {
  // rimraf(userDataDir, () => {
  //   console.log("deleted");
  // });

  const context = await chromium.launchPersistentContext(extensionPath, {
    headless: false,
    defaultViewport: viewport,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  let [backgroundPage] = context.backgroundPages();
  if (!backgroundPage) {
    backgroundPage = await context.waitForEvent("backgroundpage");
  }

  const page = await context.newPage();
  await page.goto("https://fastcampus.app/");

  await page.bringToFront();

  // await page.click(".btn--md");

  await page.waitForTimeout(2000);

  await page.click(".curation-list-header__view-all");

  // await page.waitForTimeout(3000);

  // await context.close();
  // await page.close();
  // await browser.close();
};

app().then(() => console.log("Start"));
