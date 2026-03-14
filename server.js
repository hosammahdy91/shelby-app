// ============================================================
// server.js — خادم Express يتعامل مع Shelby SDK
// ============================================================
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── إنشاء عميل Shelby ──
function getClient() {
  const apiKey = process.env.APTOS_API_KEY;
  if (!apiKey) throw new Error("APTOS_API_KEY غير موجود في .env");
  return new ShelbyNodeClient({
    network: Network.TESTNET,
    apiKey,
  });
}

// ============================================================
// POST /api/upload — رفع ملف إلى Shelby
// ============================================================
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "لم يتم إرسال أي ملف" });
    const client = getClient();
    const blobName = "files/" + req.file.originalname.replace(/\s+/g, "_");
    const result = await client.upload({
      name: blobName,
      data: req.file.buffer,
      durationDays: 30,
    });
    res.json({ success: true, blobName, merkleRoot: result.merkleRoot, txHash: result.txHash });
  } catch (err) {
    console.error("خطأ في الرفع:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/download/* — تحميل ملف من Shelby
// ============================================================
app.get("/api/download/*", async (req, res) => {
  try {
    const blobName = req.params[0];
    const client = getClient();
    const data = await client.download({ name: blobName });
    const filename = blobName.split("/").pop();
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(data));
  } catch (err) {
    console.error("خطأ في التحميل:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/list — عرض قائمة الملفات
// ============================================================
app.get("/api/list", async (req, res) => {
  try {
    const client = getClient();
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: "يرجى توفير عنوان الحساب" });
    const blobs = await client.list({ account: address });
    res.json({ success: true, blobs });
  } catch (err) {
    console.error("خطأ في القائمة:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// تشغيل الخادم
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ التطبيق يعمل على: http://localhost:${PORT}\n`);
});