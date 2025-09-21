// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const formidable = require('formidable');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
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
  type: String, // "pdf" | "docx" | "txt"
  // userId: String // add later for multi-user scoping
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
});

const Document = mongoose.model('Document', documentSchema);
const User = mongoose.model('User', userSchema);

/* =========================
   Helpers
   ========================= */
const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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
   Analyze (proxy to FastAPI)
   ========================= */
const analyzeForm = new (require('formidable').IncomingForm)({
  multiples: false,
  keepExtensions: true,
  maxFileSize: 25 * 1024 * 1024, // 25 MB
  allowEmptyFiles: false,
});

app.post('/api/analyze', (req, res) => {
  analyzeForm.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('Formidable parse error (/api/analyze):', err);
      const msg = err?.message || 'Error parsing the file upload.';
      return res.status(400).json({ message: msg });
    }

    try {
      // Handle both v2/v3 shapes: single file or array
      const f =
        (Array.isArray(files.document) ? files.document[0] : files.document) ||
        (Array.isArray(files.file) ? files.file[0] : files.file);
      if (!f) {
        return res.status(400).json({ message: "No document file was uploaded (expected field 'document')." });
      }

      const stream = fs.createReadStream(f.filepath);
      const formData = new (require('form-data'))();
      formData.append('document', stream, {
        filename: f.originalFilename || 'document',
        contentType: f.mimetype || 'application/octet-stream',
      });

      console.log(`Forwarding analysis to: ${AI_BASE}/analyze`);

      const ai = await axios.post(`${AI_BASE}/analyze`, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      });

      // Best-effort persistence (don’t block the response if this fails)
      try {
        await Document.create({
          title: f.originalFilename || 'document',
          status: 'analyzed',
          riskLevel: ai.data?.riskLevel ?? null,
          tags: Array.isArray(ai.data?.tags) ? ai.data.tags.slice(0, 10) : [],
          size: ai.data?.size || `${Math.round((f.size || 0) / 1024)} KB`,
          type: ai.data?.type || 'txt',
        });
      } catch (dbErr) {
        console.warn('Could not save document entry:', dbErr?.message || dbErr);
      }

      try { fs.unlinkSync(f.filepath); } catch {}

      return res.status(ai.status).json(ai.data);
    } catch (error) {
      // Forward the AI service error status & message
      const status = error?.response?.status || 500;
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'The AI service failed to analyze the document.';
      console.error('AI /analyze error:', status, detail, error?.response?.data);

      // Attempt to persist a failed record with minimal info (non-blocking)
      try {
        const ff =
          (Array.isArray(files.document) ? files.document[0] : files.document) ||
          (Array.isArray(files.file) ? files.file[0] : files.file);
        if (ff) {
          await Document.create({
            title: ff.originalFilename || 'document',
            status: 'failed',
            riskLevel: null,
            tags: [],
            size: `${Math.round((ff.size || 0) / 1024)} KB`,
            type: 'unknown',
          });
          try { fs.unlinkSync(ff.filepath); } catch {}
        }
      } catch {}

      return res.status(status).json({ message: detail });
    }
  });
});


/* =========================
   Chat (proxy to FastAPI)
   ========================= */
app.post('/api/chat', async (req, res) => {
  try {
    const r = await axios.post(`${AI_BASE}/chat`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000,
    });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || err.message || 'AI service chat failed.';
    console.error('Chat proxy error:', detail);
    res.status(status).json({ detail });
  }
});

/* =========================
   Compare (proxy to FastAPI)
   ========================= */

const compareForm = new (require('formidable').IncomingForm)({
  multiples: false,
  keepExtensions: true,
  maxFileSize: 25 * 1024 * 1024,
  allowEmptyFiles: false,
});

app.post('/api/compare', (req, res) => {
  compareForm.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('Formidable parse error (/api/compare):', err);
      const msg = err?.message || 'Error parsing the file uploads.';
      return res.status(400).json({ message: msg });
    }

    try {
      const fileA =
        (Array.isArray(files.fileA) ? files.fileA[0] : files.fileA);
      const fileB =
        (Array.isArray(files.fileB) ? files.fileB[0] : files.fileB);

      if (!fileA || !fileB) {
        return res.status(400).json({ message: 'Both document versions are required for comparison.' });
      }

      const fd = new (require('form-data'))();
      fd.append('fileA', fs.createReadStream(fileA.filepath), {
        filename: fileA.originalFilename || 'fileA',
        contentType: fileA.mimetype || 'application/octet-stream',
      });
      fd.append('fileB', fs.createReadStream(fileB.filepath), {
        filename: fileB.originalFilename || 'fileB',
        contentType: fileB.mimetype || 'application/octet-stream',
      });

      const resp = await axios.post(`${AI_BASE}/compare`, fd, {
        headers: fd.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      });

      try { fs.unlinkSync(fileA.filepath); } catch {}
      try { fs.unlinkSync(fileB.filepath); } catch {}

      return res.status(resp.status).json(resp.data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'The server failed to compare the documents.';
      console.error('AI /compare error:', status, detail, error?.response?.data);

      try { if (files.fileA) fs.unlinkSync((Array.isArray(files.fileA) ? files.fileA[0] : files.fileA).filepath); } catch {}
      try { if (files.fileB) fs.unlinkSync((Array.isArray(files.fileB) ? files.fileB[0] : files.fileB).filepath); } catch {}

      return res.status(status).json({ message: detail });
    }
  });
});

/* =========================
   Start
   ========================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server is live and running on port ${PORT}`));
