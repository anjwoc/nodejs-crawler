const puppeteer = require("puppeteer");

require("dotenv").config();

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      ignoreDefaultArguments: true,
      ignoreHTTPSErrors: true,
      args: [
        "--disable-web-security",
        "--user-data-dir",
        "--enable-usermedia-screen-capturing",
        "--allow-http-screen-capture",
        "--disable-infobars",
        "--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure",
      ],
      headless: false,
    });
    const page = await browser.newPage();
    const id = process.env.ID;
    const password = process.env.PASSWORD;

    await page.goto(process.env.URL);
    await page.waitForTimeout(2000);
    await page.evaluate(
      (ID, PASSWORD) => {
        const id = document.getElementById("ol_id");
        const password = document.getElementById("ol_pw");
        const loginBtn = password.nextElementSibling;
        id.value = ID;
        password.value = PASSWORD;
        loginBtn.click();
      },
      id,
      password
    );

    await page.waitForTimeout(2000);

    /**
     * 보안 경고 페이지 무시하기
     */
    await page.evaluate(() => {
      const isSecureForm = document.querySelector(".insecure-form");

      if (isSecureForm) {
        const proceedBtn = document.getElementById("proceed-button");
        proceedBtn.click();
      }
    });

    await page.waitForTimeout(3000);
    await page.goto(process.env.LOGIN_PAGE);
    await page.evaluate(() => {
      document.querySelector("td img").click();
    });
    await page.waitForTimeout(3000);

    await page.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
};

crawler();
