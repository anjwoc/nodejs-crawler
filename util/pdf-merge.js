const path = require("path");
const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");

require("dotenv").config({ path: path.resolve(process.cwd(), "EBook-Generator", ".env") });

const merge = async () => {
  const mergeDir = process.env.MergeDir;
  const pdfFiles = fs
    .readdirSync(path.resolve(process.cwd(), "EBook-Generator", mergeDir))
    .map((file) => file)
    .sort((a, b) => a - b);

  const mergedPdf = await PDFDocument.create();

  const pdfs = await Promise.all(
    pdfFiles.map(async (pdf, idx) => {
      const filePath = path.resolve(process.cwd(), "EBook-Generator", mergeDir, pdf);
      return { [idx]: await PDFDocument.load(fs.readFileSync(filePath)) };
    })
  );

  await Promise.all(
    pdfs.map(async (obj, idx) => {
      const pdf = obj[idx];
      const copyPage = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      const pageNumber = Object.keys(obj)[0];

      copyPage.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = 15;

        page.drawText(pageNumber, {
          x: width - 30,
          y: 20,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        mergedPdf.addPage(page);
      });
    })
  );

  const result = await mergedPdf.save();

  fs.writeFileSync(`merged_${mergeDir}.pdf`, result);
};

merge().then(() => console.log("Done"));

module.exports = merge;
