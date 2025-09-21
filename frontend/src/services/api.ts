import axios from 'axios';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface Document {
  id: string;
  title: string;
  uploadDate: string;
  status: 'analyzed' | 'analyzing' | 'failed';
  riskLevel: 'high' | 'medium' | 'low' | null;
  tags: string[];
  size: string;
  type: string; // display label: "PDF", "DOCX", "TXT"
}

export interface Obligation { text: string; clause: string; }
export interface Risk { text: string; clause: string; severity: 'high' | 'medium' | 'low'; }
export interface Clause { name: string; status: 'standard' | 'unusual' | 'restrictive'; description: string; }

export interface Highlight {
  kind: 'obligation' | 'risk' | 'clause';
  clause?: string;
  text: string;
  rangeStart: number;
  rangeEnd: number;
}

export interface AnalysisReport {
  summary: string;
  obligations: Obligation[];
  risks: Risk[];
  clauses: Clause[];
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  size: string;
  type: 'pdf' | 'docx' | 'txt';
  pages: number;
  analyzedText: string;
  pageOffsets: number[];
  highlights: Highlight[];
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

/** Version Compare types */
export interface Change {
  type: 'added' | 'modified' | 'removed';
  section: string;
  description: string;
  impact: string;
}

export interface ComparisonReport {
  versionA: { title: string; content: string };
  versionB: { title: string; content: string };
  changes: Change[];
}

const apiClient = axios.create({
  baseURL: '/api',
});

// ---------- AUTH ----------
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const r = await apiClient.post('/auth/login', { email, password });
  if (r.data.token) {
    localStorage.setItem('lexiclaire-token', r.data.token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
  }
  return r.data;
};

export const registerUser = async (userData: RegistrationData): Promise<AuthResponse> => {
  const r = await apiClient.post('/auth/register', userData);
  if (r.data.token) {
    localStorage.setItem('lexiclaire-token', r.data.token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
  }
  return r.data;
};

// ---------- ANALYZE ----------
export const analyzeDocument = async (file: File): Promise<AnalysisReport> => {
  const formData = new FormData();
  // Backend accepts "document" (primary) and "file" (fallback).
  formData.append('document', file);

  try {
    const r = await apiClient.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const report: AnalysisReport = r.data;

    // Persist a light entry for "My Documents" (localStorage for now)
    const item: Document = {
      id: `${Date.now()}-${file.name}`,
      title: file.name,
      uploadDate: new Date().toISOString(),
      status: 'analyzed',
      riskLevel: report.riskLevel,
      tags: report.tags,
      size: report.size,
      type: report.type.toUpperCase(),
    };
    const raw = localStorage.getItem('lexi-history') || '[]';
    const arr: Document[] = JSON.parse(raw);
    localStorage.setItem('lexi-history', JSON.stringify([item, ...arr].slice(0, 200)));

    return report;
  } catch (err: any) {
    // Friendly, actionable errors
    const status = err?.response?.status;
    const msg = status === 429
      ? "Quota exceeded on the AI provider. Please check billing/quota or switch model."
      : (err?.response?.data?.detail || "The AI model failed to process the document.");
    // Re-throw in a consistent shape used by UI
    throw { response: { data: { message: msg } } };
  }
};

// ---------- CHAT ----------
export const askChat = async (
  question: string,
  history: ChatMessage[],
  documentId: string,
  analyzedText: string
): Promise<ChatMessage> => {
  const r = await apiClient.post('/chat', { question, history, documentId, analyzedText });
  return r.data;
};

// ---------- HISTORY ----------
// services/api.ts
export const getDocuments = async (): Promise<Document[]> => {
  const r = await apiClient.get('/documents');
  return r.data as Document[];
};


// ---------- VERSION COMPARE ----------
export const compareDocuments = async (fileA: File, fileB: File): Promise<ComparisonReport> => {
  const formData = new FormData();
  formData.append('fileA', fileA);
  formData.append('fileB', fileB);

  try {
    const r = await apiClient.post('/compare', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data as ComparisonReport;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = status === 404
      ? "Compare endpoint is not available on the backend."
      : (err?.response?.data?.detail || "The comparison service failed.");
    throw { response: { data: { message: msg } } };
  }
};
