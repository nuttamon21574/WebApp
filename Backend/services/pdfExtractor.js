const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function extractPdfRows(fileBuffer, password) {
  const data = new Uint8Array(fileBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    password
  });

  const pdf = await loadingTask.promise;

  let rows = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const lines = {};

    content.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];

      if (!lines[y]) lines[y] = [];
      lines[y].push({ x, text: item.str });
    });

    const sortedY = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a);

    sortedY.forEach(y => {
      const line = lines[y]
        .sort((a, b) => a.x - b.x)
        .map(item => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (line) rows.push(line);
    });
  }

  return rows;
}

module.exports = extractPdfRows;