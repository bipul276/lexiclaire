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
app.post('/api/analyze', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(500).json({ message: 'Error parsing the file upload.' });
    }

    try {
      const file = Array.isArray(files.document) ? files.document[0] : files.document;
      if (!file) return res.status(400).json({ message: 'No document file was uploaded.' });

      const fileStream = fs.createReadStream(file.filepath);
      const formData = new FormData();

      // FastAPI supports both "document" and "file". We'll send "document".
      formData.append('document', fileStream, {
        filename: file.originalFilename || 'document',
        contentType: file.mimetype || 'application/octet-stream',
      });

      console.log(`Forwarding analysis request to: ${AI_BASE}/analyze`);

      const ai = await axios.post(`${AI_BASE}/analyze`, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      });

      // Persist a document record
      try {
        await Document.create({
          title: file.originalFilename || 'document',
          status: 'analyzed',
          riskLevel: ai.data?.riskLevel ?? null,
          tags: Array.isArray(ai.data?.tags) ? ai.data.tags.slice(0, 10) : [],
          size: ai.data?.size || `${Math.round((file.size || 0) / 1024)} KB`,
          type: ai.data?.type || 'txt',
        });
      } catch (dbErr) {
        console.warn('Could not save document entry:', dbErr?.message || dbErr);
      }

      // Cleanup temp file
      try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

      res.status(200).json(ai.data);
    } catch (error) {
      console.error('Error calling AI service:', error?.response?.data || error.message);

      // Best effort: record failed status with minimal info
      try {
        const f = files.document && (Array.isArray(files.document) ? files.document[0] : files.document);
        if (f) {
          await Document.create({
            title: f.originalFilename || 'document',
            status: 'failed',
            riskLevel: null,
            tags: [],
            size: `${Math.round((f.size || 0) / 1024)} KB`,
            type: 'unknown',
          });
        }
      } catch { /* ignore */ }

      res.status(500).json({ message: 'The AI service failed to analyze the document. Please try again.' });
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

// --- Compare (forward to AI service) ---
app.post('/api/compare', (req, res) => {
  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form data for comparison:", err);
      return res.status(500).json({ message: 'Error parsing the file uploads.' });
    }

    try {
      const fileA = files.fileA?.[0];
      const fileB = files.fileB?.[0];
      if (!fileA || !fileB) {
        return res.status(400).json({ message: 'Both document versions are required for comparison.' });
      }

      const aiServiceUrl = process.env.AI_SERVICE_URL;
      if (!aiServiceUrl) {
        console.error("AI_SERVICE_URL is not defined in .env");
        return res.status(500).json({ message: 'Server configuration error.' });
      }

      const fd = new FormData();
      fd.append('fileA', fs.createReadStream(fileA.filepath), {
        filename: fileA.originalFilename || 'fileA',
        contentType: fileA.mimetype,
      });
      fd.append('fileB', fs.createReadStream(fileB.filepath), {
        filename: fileB.originalFilename || 'fileB',
        contentType: fileB.mimetype,
      });

      const resp = await axios.post(`${aiServiceUrl}/compare`, fd, {
        headers: fd.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Clean temp files
      try { fs.unlinkSync(fileA.filepath); } catch {}
      try { fs.unlinkSync(fileB.filepath); } catch {}

      return res.status(200).json(resp.data);
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'The server failed to compare the documents.';
      console.error("Compare error:", detail);

      // Clean temp files
      try { if (files.fileA?.[0]) fs.unlinkSync(files.fileA[0].filepath); } catch {}
      try { if (files.fileB?.[0]) fs.unlinkSync(files.fileB[0].filepath); } catch {}

      return res.status(error?.response?.status || 500).json({ message: detail });
    }
  });
});


/* =========================
   Start
   ========================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server is live and running on port ${PORT}`));
