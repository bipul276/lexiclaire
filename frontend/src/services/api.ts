// frontend/src/services/api.ts
import axios from "axios";

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
const inferBase = () => {
  // Priority: explicit env → dev default → reverse-proxy path
  const env = import.meta.env?.VITE_API_BASE as string | undefined;
  if (env && env.trim()) return env.replace(/\/+$/, ""); // remove trailing slash
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001/api";
  }
  return "/api";
};

const apiBase = inferBase();

const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 30000,
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

/* =========================
 *          Auth
 * ========================= */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const r = await apiClient.post("/auth/login", { email, password });
  if (r.data?.token) setAuthToken(r.data.token);
  return r.data;
};

export const registerUser = async (
  userData: RegistrationData
): Promise<AuthResponse> => {
  const r = await apiClient.post("/auth/register", userData);
  if (r.data?.token) setAuthToken(r.data.token);
  return r.data;
};

/* =========================
 *        Analyze
 * ========================= */
export const analyzeDocument = async (file: File): Promise<AnalysisReport> => {
  const formData = new FormData();
  // Backend accepts "document" (primary) and "file" (fallback in FastAPI)
  formData.append("document", file);

  try {
    const r = await apiClient.post("/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: 10 * 1024 * 1024,
    });

    const report: AnalysisReport = r.data;

    // Persist a light entry for "My Documents"
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
    localStorage.setItem(
      "lexi-history",
      JSON.stringify([item, ...arr].slice(0, 200))
    );

    return report;
  } catch (err: any) {
  const status = err?.response?.status;
  const msg =
    status && [502,503,504,522,524].includes(status)
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
    const r = await apiClient.post("/chat", {
      question,
      history,
      documentId,
      analyzedText,
    });
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
    const r = await apiClient.get("/documents");
    return r.data as Document[];
  } catch (err: any) {
    throw normalizeError(err, "Failed to fetch documents.");
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

  try {
    const r = await apiClient.post("/compare", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: 10 * 1024 * 1024,
    });
    return r.data as ComparisonReport;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg =
      status === 404
        ? "Compare endpoint is not available on the backend."
        : err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "The comparison service failed.";
    throw normalizeError({ response: { status, data: { detail: msg } } }, msg);
  }
};
