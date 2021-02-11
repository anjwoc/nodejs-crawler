const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

function delay(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}

/**
 * tcafe 자동 출석기
 */
const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const id = process.env.ID;
    const password = process.env.PASSWORD;

    await page.goto(process.env.URL);
    await page.waitForTimeout(2000);
    await page.evaluate(
      (ID, PASSWORD) => {
        const id = document.querySelector('#ol_id');
        const password = document.querySelector('#ol_pw');
        const loginBtn = password.nextElementSibling;
        id.value = ID;
        password.value = PASSWORD;
        loginBtn.click();
      },
      id,
      password,
    );

    await page.waitForTimeout(2000);
    await page.goto(process.env.LOGIN_PAGE);
    await page.evaluate(() => {
      document.querySelector('td img').click();
    });

    await page.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
};

crawler();
