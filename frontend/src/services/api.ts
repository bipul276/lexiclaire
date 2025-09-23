// frontend/src/services/api.ts
import axios, { AxiosRequestConfig } from "axios";

/* =========================
 *        Interfaces
 * ========================= */
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
  status: "analyzed" | "analyzing" | "failed";
  riskLevel: "high" | "medium" | "low" | null;
  tags: string[];
  size: string;
  type: string; // display label: "PDF", "DOCX", "TXT"
}

export interface Obligation {
  text: string;
  clause: string;
}
export interface Risk {
  text: string;
  clause: string;
  severity: "high" | "medium" | "low";
}
export interface Clause {
  name: string;
  status: "standard" | "unusual" | "restrictive";
  description: string;
}

export interface Highlight {
  kind: "obligation" | "risk" | "clause";
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
  riskLevel: "low" | "medium" | "high";
  tags: string[];
  size: string;
  type: "pdf" | "docx" | "txt";
  pages: number;
  analyzedText: string;
  pageOffsets: number[];
  highlights: Highlight[];
}

export interface ChatMessage {
  type: "user" | "ai";
  content: string;
}

/** Version Compare types */
export interface Change {
  type: "added" | "modified" | "removed";
  section: string;
  description: string;
  impact: string;
}

export interface ComparisonReport {
  versionA: { title: string; content: string };
  versionB: { title: string; content: string };
  changes: Change[];
}

/* =========================
 *     Axios Client Setup
 * ========================= */
function cleanBase(raw?: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();

  // If someone pasted "VITE_API_BASE = https://host/api"
  const urlMatch = s.match(/https?:\/\/[^\s"']+/i);
  if (urlMatch) s = urlMatch[0];

  // Remove trailing slash(es)
  s = s.replace(/\/+$/, "");
  return s;
}

const inferBase = () => {
  const envRaw = import.meta.env?.VITE_API_BASE as string | undefined;
  const env = cleanBase(envRaw);
  if (env) return env; // respect provided base, already trimmed

  // Dev fallback
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001/api";
  }

  // Reverse-proxy path (Vercel rewrite to /api/*)
  return "/api";
};

const apiBase = inferBase();

const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 30000, // default; endpoints override below
});

// Restore token on load
const savedToken = localStorage.getItem("lexiclaire-token");
if (savedToken) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

// Helpful exports for auth management
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("lexiclaire-token", token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("lexiclaire-token");
    delete apiClient.defaults.headers.common["Authorization"];
  }
}
export function logout() {
  setAuthToken(null);
}

// Normalize errors so UI can read .detail OR .message
const normalizeError = (err: any, fallback = "Request failed.") => {
  const status = err?.response?.status ?? 0;
  const detail =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback;
  return { response: { status, data: { detail, message: detail } } };
};

// Transient/infra failures worth a retry
const isTransient = (err: any) => {
  const status = err?.response?.status;
  const code = (err?.code || "").toUpperCase();
  return (
    [502, 503, 504, 522, 524, 408].includes(status) ||
    ["ECONNABORTED", "ECONNRESET", "ETIMEDOUT"].includes(code)
  );
};

async function requestWithRetry<T>(
  fn: () => Promise<T>,
  { retries = 1, backoffMs = 2000 }: { retries?: number; backoffMs?: number } = {}
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0 && isTransient(e)) {
      await new Promise((r) => setTimeout(r, backoffMs));
      return requestWithRetry(fn, { retries: retries - 1, backoffMs });
    }
    throw e;
  }
}

/* =========================
 *          Auth
 * ========================= */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const r = await apiClient.post("/auth/login", { email, password }, { timeout: 30000 });
    if (r.data?.token) setAuthToken(r.data.token);
    return r.data;
  } catch (err: any) {
    throw normalizeError(err, "Login failed.");
  }
};

export const registerUser = async (
  userData: RegistrationData
): Promise<AuthResponse> => {
  try {
    const r = await apiClient.post("/auth/register", userData, { timeout: 30000 });
    if (r.data?.token) setAuthToken(r.data.token);
    return r.data;
  } catch (err: any) {
    throw normalizeError(err, "Registration failed.");
  }
};

/* =========================
 *        Analyze
 * ========================= */
export const analyzeDocument = async (file: File): Promise<AnalysisReport> => {
  const formData = new FormData();
  // Backend accepts "document" (primary) and "file" (fallback in FastAPI)
  formData.append("document", file);

  const config: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
    maxBodyLength: Infinity, // allow large PDFs
    timeout: 120000, // allow cold starts / long parses
  };

  try {
    const r = await requestWithRetry(
      () => apiClient.post("/analyze", formData, config),
      { retries: 1, backoffMs: 2500 }
    );

    const report: AnalysisReport = (r as any).data;

    // Persist a light entry for "My Documents" (local cache)
    const item: Document = {
      id: `${Date.now()}-${file.name}`,
      title: file.name,
      uploadDate: new Date().toISOString(),
      status: "analyzed",
      riskLevel: report.riskLevel,
      tags: report.tags,
      size: report.size,
      type: report.type.toUpperCase(),
    };
    const raw = localStorage.getItem("lexi-history") || "[]";
    const arr: Document[] = JSON.parse(raw);
    localStorage.setItem("lexi-history", JSON.stringify([item, ...arr].slice(0, 200)));

    return report;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg =
      status && [502, 503, 504, 522, 524, 408].includes(status)
        ? "Our AI service is waking up. Please try again in a few seconds."
        : err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "The AI service failed to analyze the document. Please try again.";
    throw normalizeError({ response: { status, data: { detail: msg } } }, msg);
  }
};

/* =========================
 *          Chat
 * ========================= */
export const askChat = async (
  question: string,
  history: ChatMessage[],
  documentId: string,
  analyzedText: string
): Promise<ChatMessage> => {
  try {
    const r = await apiClient.post(
      "/chat",
      { question, history, documentId, analyzedText },
      { timeout: 60000 }
    );
    return r.data as ChatMessage;
  } catch (err: any) {
    throw normalizeError(err, "Chat request failed.");
  }
};

/* =========================
 *        History
 * ========================= */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const r = await apiClient.get("/documents", { timeout: 30000 });
    return r.data as Document[];
  } catch (err: any) {
    // Fallback to local cache so the page still works offline/when DB is slow
    try {
      const raw = localStorage.getItem("lexi-history") || "[]";
      return JSON.parse(raw) as Document[];
    } catch {
      throw normalizeError(err, "Failed to fetch documents.");
    }
  }
};

/* =========================
 *     Version Compare
 * ========================= */
export const compareDocuments = async (
  fileA: File,
  fileB: File
): Promise<ComparisonReport> => {
  const formData = new FormData();
  formData.append("fileA", fileA);
  formData.append("fileB", fileB);

  const config: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
    maxBodyLength: Infinity,
    timeout: 120000,
  };

  try {
    const r = await requestWithRetry(
      () => apiClient.post("/compare", formData, config),
      { retries: 1, backoffMs: 2500 }
    );
    return r.data as ComparisonReport;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg =
      status === 404
        ? "Compare endpoint is not available on the backend."
        : status && [502, 503, 504, 522, 524, 408].includes(status)
        ? "Our compare service is warming up. Please try again shortly."
        : err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "The comparison service failed.";
    throw normalizeError({ response: { status, data: { detail: msg } } }, msg);
  }
};
