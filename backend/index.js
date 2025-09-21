// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const formidable = require("formidable");
const fs = require("fs");
const FormData = require("form-data");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

/* =========================
   Basic Middleware & Health
   ========================= */
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* =========================
   MongoDB
   ========================= */
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("FATAL ERROR: MONGO_URI is not defined in environment.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* =========================
   Schemas & Models
   ========================= */
const documentSchema = new mongoose.Schema({
  title: String,
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["analyzed", "analyzing", "failed"], default: "analyzing" },
  riskLevel: { type: String, enum: ["high", "medium", "low", null], default: null },
  tags: [String],
  size: String,
  type: String, // "pdf" | "docx" | "txt"
  // userId: String // (optional) for multi-user scoping later
});
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
});

const Document = mongoose.model("Document", documentSchema);
const User = mongoose.model("User", userSchema);

/* =========================
   Helpers (AI client + retry)
   ========================= */
const AI_BASE = process.env.AI_SERVICE_URL || "http://localhost:8001";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const aiHttp = axios.create({
  baseURL: AI_BASE,
  timeout: 120_000,            // allow for cold starts
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function shouldRetry(err) {
  const code = err?.code?.toUpperCase?.();
  const status = err?.response?.status;
  if (["ECONNABORTED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) return true;
  if ([502, 503, 504, 522, 524, 408].includes(status)) return true;
  return false;
}

async function aiPost(path, data, headers) {
  try {
    return await aiHttp.post(path, data, { headers });
  } catch (e) {
    if (shouldRetry(e)) {
      console.warn(`[AI] ${path} failed once (${e.code || e.response?.status}); retrying in 2s...`);
      await wait(2000);
      return await aiHttp.post(path, data, { headers });
    }
    throw e;
  }
}

/* =========================
   Auth
   ========================= */
app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "An account with this email already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ firstName, lastName, email, password: hashed });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, firstName, lastName, email } });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ message: "Server error during registration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials. Please check your email and password." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials. Please check your email and password." });

    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error during login." });
  }
});

/* =========================
   Documents (history)
   ========================= */
app.get("/api/documents", async (_req, res) => {
  try {
    const documents = await Document.find({}).sort({ uploadDate: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to retrieve document history." });
  }
});

/* =========================
   Analyze (proxy to FastAPI)
   ========================= */
app.post("/api/analyze", (req, res) => {
  // Create a fresh parser per request (no global instances)
  const form = new formidable.IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error("[Analyze] Form parse error:", err);
      return res.status(400).json({ message: "Invalid upload." });
    }

    const f = Array.isArray(files.document) ? files.document[0] : files.document;
    if (!f) return res.status(400).json({ message: "No document file was uploaded." });

    const fd = new FormData();
    fd.append("document", fs.createReadStream(f.filepath), {
      filename: f.originalFilename || "document",
      contentType: f.mimetype || "application/octet-stream",
    });

    try {
      console.log(`[Analyze] -> ${AI_BASE}/analyze  (${f.originalFilename || "document"})`);
      const resp = await aiPost("/analyze", fd, fd.getHeaders());

      // best-effort history save
      try {
        await Document.create({
          title: f.originalFilename || "document",
          status: "analyzed",
          riskLevel: resp.data?.riskLevel ?? null,
          tags: Array.isArray(resp.data?.tags) ? resp.data.tags.slice(0, 10) : [],
          size: resp.data?.size || `${Math.round((f.size || 0) / 1024)} KB`,
          type: resp.data?.type || "txt",
        });
      } catch (dbErr) {
        console.warn("[Analyze] History save warning:", dbErr?.message || dbErr);
      }

      return res.status(200).json(resp.data);
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data || e.message || e.code;
      console.error("[Analyze] AI call failed:", status, detail);

      const msg = status
        ? `AI service error (${status}). Please try again.`
        : "AI service is waking up. Please retry in a moment.";
      return res.status(502).json({ message: msg });
    } finally {
      try { fs.unlinkSync(f.filepath); } catch {}
    }
  });
});

/* =========================
   Chat (proxy to FastAPI)
   ========================= */
app.post("/api/chat", async (req, res) => {
  try {
    const r = await aiPost("/chat", req.body, { "Content-Type": "application/json" });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const detail = err.response?.data || err.message || "AI service chat failed.";
    console.error("[Chat] AI call failed:", status, detail);
    res.status(status).json({ message: "AI service is waking up. Please try again." });
  }
});

/* =========================
   Compare (proxy to FastAPI)
   ========================= */
app.post("/api/compare", (req, res) => {
  const form = new formidable.IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error("[Compare] Form parse error:", err);
      return res.status(400).json({ message: err.message || "Error parsing uploads." });
    }

    const fileA = Array.isArray(files.fileA) ? files.fileA[0] : files.fileA;
    const fileB = Array.isArray(files.fileB) ? files.fileB[0] : files.fileB;
    if (!fileA || !fileB) {
      return res.status(400).json({ message: "Both document versions are required for comparison." });
    }

    const fd = new FormData();
    fd.append("fileA", fs.createReadStream(fileA.filepath), {
      filename: fileA.originalFilename || "fileA",
      contentType: fileA.mimetype || "application/octet-stream",
    });
    fd.append("fileB", fs.createReadStream(fileB.filepath), {
      filename: fileB.originalFilename || "fileB",
      contentType: fileB.mimetype || "application/octet-stream",
    });

    try {
      console.log(`[Compare] -> ${AI_BASE}/compare  (${fileA.originalFilename} vs ${fileB.originalFilename})`);
      const resp = await aiPost("/compare", fd, fd.getHeaders());
      return res.status(200).json(resp.data);
    } catch (error) {
      const status = error?.response?.status || 502;
      const detail = error?.response?.data || error.message || "Compare failed.";
      console.error("[Compare] AI call failed:", status, detail);
      return res.status(status).json({ message: "AI service error. Please try again." });
    } finally {
      try { if (fileA) fs.unlinkSync(fileA.filepath); } catch {}
      try { if (fileB) fs.unlinkSync(fileB.filepath); } catch {}
    }
  });
});

/* =========================
   Optional: Wake AI endpoint
   ========================= */
app.get("/api/_wake", async (_req, res) => {
  try {
    const r = await aiHttp.get("/");
    res.json({ ok: true, ai: r.data });
  } catch (e) {
    console.error("[Wake] failed:", e.message || e.code);
    res.status(502).json({ ok: false });
  }
});

/* =========================
   Start
   ========================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server is live and running on port ${PORT}`));
