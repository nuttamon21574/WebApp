const express = require("express");
const router = express.Router();
const extractPdfRows = require("../services/pdfExtractor");
const parseLoanData = require("../services/parser");

router.get("/", (req, res) => {
  res.send("Upload API is working. Use POST method.");
});

router.post("/", async (req, res) => {
  try {

    // 🔥 เช็คว่ามีไฟล์ไหม
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const pdfFile = req.files.pdf;

    // 🔥 เช็คว่าเป็น pdf จริงไหม
    if (pdfFile.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF allowed" });
    }

    // 🔥 เช็ครหัสผ่าน
    const password = (req.body.password || "").trim();
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    // 🔥 ส่ง buffer เข้า extractor
    const rows = await extractPdfRows(pdfFile.data, password);

    const parsedData = parseLoanData(rows);

    return res.json({
      success: true,
      data: parsedData
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Failed to process PDF" });
  }
});

module.exports = router;