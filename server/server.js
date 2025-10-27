import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { brotliDecompress } from "zlib";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();

// Rate limit for /decompress (5 requests per minute)
const decompressLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many decompression requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.static(path.join(__dirname, "dist")));

app.post("/decompress", decompressLimiter, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: "No file uploaded" });

    const buffer = req.file.buffer;
    const name = req.file.originalname;
    const ext = name.split(".").pop().toLowerCase();

    if (ext === "citb") {
      // Remove last 4 bytes otherwise we get invalid JSON. Data added by Unity?
      const trimmed = buffer.subarray(0, buffer.length - 4);

      // Decompress using brotli.
      brotliDecompress(trimmed, (err, decompressed) => {
        if (err) {
          console.error("Decompression error:", err);
          return res.json({ success: false, error: err.message });
        }

        try {
          const text = decompressed.toString("utf8");
          const json = JSON.parse(text);
          res.json({ data: json, success: true });
        } catch (parseErr) {
          console.error("Parsing error:", parseErr);
          res.json({ success: false, error: "Invalid JSON after decompression" });
        }
      });
    } else if (ext === "cit") {
      // cit files are just JSON.
      try {
        const text = buffer.toString("utf8");
        const json = JSON.parse(text);
        res.json({ data: json, success: true });
      } catch (parseErr) {
        console.error("Parsing error:", parseErr);
        res.json({ success: false, error: "Invalid JSON file" });
      }
    } else {
      res.json({ success: false, error: "Invalid file type" });
    }
  } catch (err) {
    console.error("Request error:", err);
    res.json({ success: false, error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});