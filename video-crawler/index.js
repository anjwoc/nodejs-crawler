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

  // await page.waitForTimeout(3000);

  // await context.close();
  // await page.close();
  // await browser.close();
};

app().then(() => console.log("Start"));
