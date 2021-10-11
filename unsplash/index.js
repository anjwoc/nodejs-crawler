const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

// directory name
fs.readdir("images", (err) => {
  if (err) {
    fs.mkdirSync("images");
  }
});

/**
 * @param {} count
 * count: 개수
 * 크롤링하는 이미지가 count 이상일 때까지 반복합니다.
 * 인피니티 스크롤링을 각 스크롤링을 할 때마다 몇 개의 이미지를 저장했는지 출력
 * 마지막 최종 이미지 개수 출력
 */

const crawler = async (count) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://unsplash.com");

    let result = [];
    let idx = 1;
    while (result.length <= count) {
      const images = await page.evaluate(() => {
        // evaluate 안에는 window와 document 즉 Dom을 사용이 가능하다.
        window.scrollTo(0, 0);
        let srcs = [];
        const imgSrcs = document.querySelectorAll("._2UGKr");
        if (imgSrcs.length) {
          // Array.from으로 변환을 시키지 않았을 때는 forEach로 사용 가능
          imgSrcs.forEach((v) => {
            const img = v.querySelector("._2UpQX");
            if (img && img.src) {
              srcs.push(img.src);
            }
            v.parentElement.removeChild(v);
          });
        }
        window.scrollBy(0, 200);
        setTimeout(() => {
          window.scrollBy(0, 300);
        }, 500);
        return srcs;
      });

      result = result.concat(images);
      await page.waitForSelector("._2UGKr"); // 해당 선택자를 기다린다.
      console.log(`scrolling # ${idx++} image: ${images.length}개`);
    }

    console.log(`${result.length}개의 이미지를 크롤링했습니다.`);

    result.forEach(async (src) => {
      const imgBuffer = await axios.get(src, {
        responseType: "arraybuffer",
      });
      // 원본 확장자는 따로 확인해야 하고 파일 이름은 수정해서 사용
      fs.writeFileSync(`images/${new Date().valueOf()}.jpeg`, imgBuffer.data);
    });

    await page.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
};

crawler(30);
