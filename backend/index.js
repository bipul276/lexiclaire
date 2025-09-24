// backend/index.js
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const axios     = require('axios');
const formidable= require('formidable');
const fs        = require('fs');
const FormData  = require('form-data');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const http      = require('http');
const https     = require('https');
const { performance } = require('perf_hooks');

const app = express();

/* =========================
   Basic Middleware & Health
   ========================= */
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* =========================
   MongoDB
   ========================= */
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment.');
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/* =========================
   Schemas & Models
   ========================= */
const documentSchema = new mongoose.Schema({
  title: String,
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['analyzed', 'analyzing', 'failed'], default: 'analyzing' },
  riskLevel: { type: String, enum: ['high', 'medium', 'low', null], default: null },
  tags: [String],
  size: String,
  type: String, // 'pdf' | 'docx' | 'txt'
  // userId: String, // add later if you scope by user
});
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
});
const Document = mongoose.model('Document', documentSchema);
const User     = mongoose.model('User', userSchema);

/* =========================
   AI client (hardened)
   ========================= */
const AI_BASE    = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const httpAgent  = new http.Agent({ keepAlive: true, maxSockets: 50, timeout: 0, family: 4 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50, timeout: 0, family: 4 });

const aiHttp = axios.create({
  baseURL: AI_BASE,
  timeout: 360_000,             // 6 minutes ceiling (large PDFs, cold starts)
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  decompress: true,
  httpAgent,
  httpsAgent,
  validateStatus: (s) => s >= 200 && s < 300,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isTransient(err) {
  const code = err?.code?.toUpperCase?.();
  const status = err?.response?.status;
  return (
    ['ECONNABORTED','ECONNRESET','ENOTFOUND','ETIMEDOUT','EAI_AGAIN','EPIPE'].includes(code) ||
    [502,503,504,522,524,408].includes(status)
  );
}

/** POST to AI with small backoff & timing logs */
async function aiPost(path, data, headers, { timeoutMs = 360_000 } = {}) {
  const delays = [0, 2000, 5000]; // initial, +2s, +5s
  let lastErr;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) {
      console.warn(`[AI] retrying ${path} in ${delays[i]}ms...`);
      await sleep(delays[i]);
    }
    const t0 = performance.now();
    try {
      const res = await aiHttp.post(path, data, { headers, timeout: timeoutMs });
      const ms = Math.round(performance.now() - t0);
      console.log(`[AI] ${path} OK in ${ms}ms (status ${res.status})`);
      return res;
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      console.warn(`[AI] ${path} attempt ${i + 1} failed after ${ms}ms:`, e.response?.status || e.code || e.message);
      lastErr = e;
      if (!isTransient(e)) break;
    }
  }
  throw lastErr;
}

/* =========================
   Auth
   ========================= */
app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'An account with this email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ firstName, lastName, email, password: hashed });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, firstName, lastName, email } });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });

    const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

/* =========================
   Documents (history)
   ========================= */
app.get('/api/documents', async (_req, res) => {
  try {
    const documents = await Document.find({}).sort({ uploadDate: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to retrieve document history.' });
  }
});

/* =========================
   Analyze (proxy to FastAPI) — buffer + content-length
   ========================= */
app.post("/api/analyze", (req, res) => {
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

    // 1) Read the temp file fully into memory (avoids read stream aborts)
    let buffer;
    try {
      buffer = fs.readFileSync(f.filepath);
    } catch (readErr) {
      console.error("[Analyze] Failed to read temp file:", readErr);
      return res.status(400).json({ message: "Could not read uploaded file." });
    }

    // 2) Build multipart with a Buffer and compute Content-Length
    const fd = new FormData();
    const filename = f.originalFilename || "document";
    const contentType = f.mimetype || "application/octet-stream";
    fd.append("document", buffer, { filename, contentType });

    let headers = fd.getHeaders();
    try {
      const length = await new Promise((resolve, reject) =>
        fd.getLength((leErr, len) => (leErr ? reject(leErr) : resolve(len)))
      );
      headers = { ...headers, "Content-Length": length };
    } catch (lenErr) {
      // Not fatal, but log it. Axios will fallback to chunked.
      console.warn("[Analyze] Could not compute multipart length:", lenErr?.message || lenErr);
    }

    try {
      console.log(`[Analyze] -> ${AI_BASE}/analyze  (${filename})`);
      const started = Date.now();
      const resp = await aiPost("/analyze", fd, headers);
      console.log(`[AI] /analyze OK in ${Date.now() - started}ms (status ${resp.status})`);

      // Best-effort history save
      try {
        await Document.create({
          title: filename,
          status: "analyzed",
          riskLevel: resp.data?.riskLevel ?? null,
          tags: Array.isArray(resp.data?.tags) ? resp.data.tags.slice(0, 10) : [],
          size: resp.data?.size || `${Math.round((buffer.length || 0) / 1024)} KB`,
          type: resp.data?.type || "txt",
        });
      } catch (dbErr) {
        console.warn("[Analyze] History save warning:", dbErr?.message || dbErr);
      }

      return res.status(200).json(resp.data);
    } catch (e) {
      // Axios stream aborts/CF early closes typically show here
      const status = e?.response?.status;
      const code = e?.code;
      const detail = e?.response?.data || e?.message || code || "unknown error";
      console.error("[Analyze] AI call failed:", status, detail);

      const msg = status
        ? `AI service error (${status}). Please try again.`
        : "AI service is waking up or temporarily unreachable. Please retry.";
      return res.status(502).json({ message: msg });
    } finally {
      // Clean up temp file
      try { fs.unlinkSync(f.filepath); } catch {}
      // Drop the buffer reference
      buffer = null;
    }
  });
});

/* =========================
   Chat (proxy to AI)
   ========================= */
app.post('/api/chat', async (req, res) => {
  try {
    // quick warm-up (non-blocking)
    aiHttp.get('/', { timeout: 5000 }).catch(() => {});
    const r = await aiPost('/chat', req.body, { 'Content-Type': 'application/json' }, { timeoutMs: 180_000 });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const detail = err.response?.data || err.message || 'AI service chat failed.';
    console.error('[Chat] AI call failed:', status, detail);
    res.status(status).json({ message: 'Our AI service is waking up. Please try again in a few seconds.' });
  }
});

/* =========================
   Compare (proxy to AI)
   ========================= */
app.post('/api/compare', (req, res) => {
  const form = new formidable.IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('[Compare] form error:', err);
      return res.status(400).json({ message: err.message || 'Error parsing uploads.' });
    }

    const fileA = Array.isArray(files.fileA) ? files.fileA[0] : files.fileA;
    const fileB = Array.isArray(files.fileB) ? files.fileB[0] : files.fileB;
    if (!fileA || !fileB) {
      return res.status(400).json({ message: 'Both document versions are required for comparison.' });
    }

    const fd = new FormData();
    fd.append('fileA', fs.createReadStream(fileA.filepath), {
      filename: fileA.originalFilename || 'fileA',
      contentType: fileA.mimetype || 'application/octet-stream',
    });
    fd.append('fileB', fs.createReadStream(fileB.filepath), {
      filename: fileB.originalFilename || 'fileB',
      contentType: fileB.mimetype || 'application/octet-stream',
    });

    try {
      aiHttp.get('/', { timeout: 5000 }).catch(() => {});
      console.log(`[Compare] -> ${AI_BASE}/compare (${fileA.originalFilename} vs ${fileB.originalFilename})`);
      const resp = await aiPost('/compare', fd, fd.getHeaders(), { timeoutMs: 360_000 });
      return res.status(200).json(resp.data);
    } catch (error) {
      const status = error?.response?.status || 502;
      const detail = error?.response?.data || error.message || 'Compare failed.';
      console.error('[Compare] AI call failed:', status, detail);
      return res.status(status).json({ message: 'Our AI service is waking up. Please try again in a few seconds.' });
    } finally {
      try { if (fileA) fs.unlinkSync(fileA.filepath); } catch {}
      try { if (fileB) fs.unlinkSync(fileB.filepath); } catch {}
    }
  });
});

/* =========================
   Optional: Wake endpoint
   ========================= */
app.get('/api/_wake', async (_req, res) => {
  try {
    await aiHttp.get('/', { timeout: 5000 });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Wake] failed:', e.code || e.message);
    res.status(502).json({ ok: false });
  }
});

/* =========================
   Start
   ========================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server is live and running on port ${PORT}`));
