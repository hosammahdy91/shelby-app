// ============================================================
// server.js — خادم Express يتعامل مع Shelby SDK
// ============================================================
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ShelbyClient } from "@shelby-protocol/sdk/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// إنشاء عميل Shelby — إذا كان PRIVATE_KEY موجود نستخدمه، وإلا عميل بدون حساب
function getClient() {
  const rpcUrl = process.env.SHELBY_RPC || "https://api.shelbynet.shelby.xyz/v1";
  if (process.env.PRIVATE_KEY) {
    const privateKey = new Ed25519PrivateKey(process.env.PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });
    return new ShelbyClient({ rpcUrl, account, network: Network.DEVNET });
  }
  return new ShelbyClient({ rpcUrl, network: Network.DEVNET });
}

// POST /api/upload
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

// GET /api/download/*
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

// GET /api/list
app.get("/api/list", async (req, res) => {
  try {
    const client = getClient();
    const address = req.query.address || process.env.ACCOUNT_ADDRESS;
    if (!address) return res.status(400).json({ error: "يرجى توفير عنوان الحساب" });
    const blobs = await client.list({ account: address });
    res.json({ success: true, blobs });
  } catch (err) {
    console.error("خطأ في القائمة:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ التطبيق يعمل على: http://localhost:${PORT}\n`);
});