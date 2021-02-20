const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

fs.readdir('novel', (err) => {
  if (err) {
    fs.mkdirSync('novel');
  }
});

const cralwer = async () => {
  try {
    const options = {
      width: 1920,
      height: 1080,
    };
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      args: [`--window-size=${options.width},${options.height}`],
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 783,
      height: 600,
    });
    await page.goto(process.env.URL);

    const ID = process.env.ID;
    const PASSWORD = process.env.PASSWORD;

    // 외부 함수 페이지의 윈도우에 바인딩
    await page.exposeFunction('timeDelay', (time) => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
      });
    });
    await page.waitForTimeout(2000);
    const loginStatus = await page.evaluate(
      async (ID, PASSWORD) => {
        const id = document.querySelector('#fname');
        const password = document.querySelector('#mb_password');
        const loginBtn = await document
          .querySelectorAll('tbody tr')[2]
          .querySelector('td button');

        console.log(loginBtn);
        id.value = ID;
        password.value = PASSWORD;
        loginBtn.click();

        return true;
      },
      ID,
      PASSWORD,
    );

    await page.waitForTimeout(2000);
    await page.goto(process.env.REDIRECT_PAGE);
    await page.waitForTimeout(2000);
    const pageNodes = await page.evaluate(() => {
      // document.body.scrollHeight - 200 => 최하단에서 200만큼 위로 올라온 위치
      window.scrollBy(0, document.body.scrollHeight - 200);
      const pageTabs = Array.from(document.querySelectorAll('.pagination li'));
      const pages = pageTabs.slice(2, pageTabs.length - 2);
      console.log(pages);
      return pages.map(
        (page) => page.childNodes[0].href || page.childNodes[0].baseURI,
      );
    });

    // * pageNodes수 만큼의 페이지를 만들어서 동시에 작업하는 부분 구현 예정
    console.log(pageNodes);
    // await page.close();
    // await browser.close();
  } catch (err) {
    console.error(err);
  }
};

cralwer();
