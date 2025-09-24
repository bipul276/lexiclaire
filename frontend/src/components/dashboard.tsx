// frontend/src/components/dashboard.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Loader2,
  Upload,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Send,
  User,
  Settings as SettingsIcon,
  GitCompare,
  History,
  Menu,
  X,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { LexiclaireLogo } from "./lexiclaire-logo";
import { analyzeDocument, askChat, wakeAI } from "../services/api";
import type {
  AnalysisReport,
  ChatMessage,
  Obligation,
  Risk,
  Clause,
} from "../services/api";
import { useAuth } from "../AuthContext";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { usePreferences } from "../PreferencesContext";

// --- pdf.js (Vite-friendly) ---
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerSrc;

type LangKey = "en" | "hi" | "pa";

const translations = {
  en: {
    documentAnalysis: "Document Analysis",
    uploadYourDoc: "Upload your document",
    clickToSelect: "Click to select a file.",
    chooseFile: "Choose File",
    analyzing: "Analyzing...",
    warmingUp: "Waking the AI service...",
    mayTakeMoment: "This may take a moment, especially if the server was asleep.",
    analysisFailed: "Analysis Failed",
    tryAnotherFile: "Try Another File",
    retry: "Retry",
    wakeAndRetry: "Wake & Retry",
    documentPreview: "Document Preview",
    summary: "Summary",
    chat: "AI Chat",
    clauses: "Clauses",
    obligations: "Obligations",
    risks: "Risks",
    askAnything: "Ask anything about your document",
    backToHome: "Back to Home",
    newAnalysis: "New Analysis",
    myDocuments: "My Documents",
    versionCompare: "Version Compare",
    settings: "Settings",
    darkMode: "Dark Mode",
    highContrast: "Contrast",
    fontSize: "Font Size",
    language: "Language",
    current: "Current",
    notPreviewable:
      "Preview not available for this file type. You can still view the analysis on the right.",
    elapsed: "Elapsed",
  },
  hi: {
    documentAnalysis: "दस्तावेज़ विश्लेषण",
    uploadYourDoc: "अपना दस्तावेज़ अपलोड करें",
    clickToSelect: "फ़ाइल चुनने के लिए क्लिक करें।",
    chooseFile: "फ़ाइल चुनें",
    analyzing: "विश्लेषण हो रहा है...",
    warmingUp: "एआई सेवा को जगाया जा रहा है...",
    mayTakeMoment: "यदि सर्वर स्लीप में था तो इसमें थोड़ा समय लग सकता है।",
    analysisFailed: "विश्लेषण असफल",
    tryAnotherFile: "दूसरी फ़ाइल आज़माएँ",
    retry: "पुनः प्रयास",
    wakeAndRetry: "जगाएँ और पुनः प्रयास करें",
    documentPreview: "दस्तावेज़ पूर्वावलोकन",
    summary: "सारांश",
    chat: "एआई चैट",
    clauses: "धाराएँ",
    obligations: "उत्तरदायित्व",
    risks: "जोखिम",
    askAnything: "दस्तावेज़ से जुड़ा कोई भी सवाल पूछें",
    backToHome: "होम पर वापस",
    newAnalysis: "नया विश्लेषण",
    myDocuments: "मेरे दस्तावेज़",
    versionCompare: "संस्करण तुलना",
    settings: "सेटिंग्स",
    darkMode: "डार्क मोड",
    highContrast: "कॉन्ट्रास्ट",
    fontSize: "फ़ॉन्ट आकार",
    language: "भाषा",
    current: "वर्तमान",
    notPreviewable:
      "इस फ़ाइल के लिए पूर्वावलोकन उपलब्ध नहीं है। आप दाईं ओर विश्लेषण देख सकते हैं।",
    elapsed: "बीता समय",
  },
  pa: {
    documentAnalysis: "ਦਸਤਾਵੇਜ਼ ਵਿਸ਼ਲੇਸ਼ਣ",
    uploadYourDoc: "ਆਪਣਾ ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ ਕਰੋ",
    clickToSelect: "ਫ਼ਾਇਲ ਚੁਣਨ ਲਈ ਕਲਿੱਕ ਕਰੋ।",
    chooseFile: "ਫ਼ਾਇਲ ਚੁਣੋ",
    analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਚੱਲ ਰਿਹਾ ਹੈ...",
    warmingUp: "ਏਆਈ ਸਰਵਿਸ ਨੂੰ ਜਗਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...",
    mayTakeMoment: "ਜੇ ਸਰਵਰ ਸੌਂ ਰਿਹਾ ਸੀ ਤਾਂ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ।",
    analysisFailed: "ਵਿਸ਼ਲੇਸ਼ਣ ਫੇਲ੍ਹ",
    tryAnotherFile: "ਹੋਰ ਫ਼ਾਇਲ ਅਜ਼ਮਾਓ",
    retry: "ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    wakeAndRetry: "ਜਗਾਓ ਅਤੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    documentPreview: "ਦਸਤਾਵੇਜ਼ ਝਲਕ",
    summary: "ਸੰਖੇਪ",
    chat: "ਏਆਈ ਚੈਟ",
    clauses: "ਧਾਰਾਵਾਂ",
    obligations: "ਜ਼ਿੰਮੇਵਾਰੀਆਂ",
    risks: "ਖਤਰੇ",
    askAnything: "ਦਸਤਾਵੇਜ਼ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ",
    backToHome: "ਘਰ ਵਾਪਸ",
    newAnalysis: "ਨਵਾਂ ਵਿਸ਼ਲੇਸ਼ਣ",
    myDocuments: "ਮੇਰੇ ਦਸਤਾਵੇਜ਼",
    versionCompare: "ਵਰਜਨ ਤੁਲਨਾ",
    settings: "ਸੈਟਿੰਗਾਂ",
    darkMode: "ਡਾਰਕ ਮੋਡ",
    highContrast: "ਕਾਨਟ੍ਰਾਸਟ",
    fontSize: "ਫੋਂਟ ਆਕਾਰ",
    language: "ਭਾਸ਼ਾ",
    current: "ਮੌਜੂਦਾ",
    notPreviewable:
      "ਇਸ ਫਾਇਲ ਕਿਸਮ ਲਈ ਝਲਕ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਤੁਸੀਂ ਸੱਜੇ ਪਾਸੇ ਵਿਸ਼ਲੇਸ਼ਣ ਦੇਖ ਸਕਦੇ ਹੋ।",
    elapsed: "ਬੀਤਿਆ ਸਮਾਂ",
  },
};

interface DashboardProps {
  onBackToLanding: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToCompare?: () => void;
}

export function Dashboard({
  onBackToLanding,
  onNavigateToHistory,
  onNavigateToCompare,
}: DashboardProps) {
  const { user } = useAuth();
  const {
    darkMode,
    setDarkMode,
    contrast,
    setContrast,
    fontSize,
    setFontSize,
    language,
    setLanguage,
  } = usePreferences();

  const t = translations[(language as LangKey) ?? "en"];

  // upload & analysis
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [documentText, setDocumentText] = useState<string>("");

  // slow-backend friendly state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWarming, setIsWarming] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // ui
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // pdf container
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const lastRenderKeyRef = useRef<string>("");

  const userName = user ? `${user.firstName} ${user.lastName}` : "Guest User";
  const isDocumentLoaded = !!analysisReport;
  const documentTitle = documentFile?.name || t.documentAnalysis;
  const pdfSupported = useMemo(() => analysisReport?.type === "pdf", [analysisReport]);

  // elapsed timer
  useEffect(() => {
    if (!isLoading && !isWarming) {
      setElapsedSec(0);
      return;
    }
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLoading, isWarming]);

  const triggerFileSelect = () => fileInputRef.current?.click();

  // upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f: File | undefined = e.target.files?.[0] ?? undefined;
    if (!f) return;
    setDocumentFile(f);
    setAnalysisReport(null);
    setChatMessages([]);
    setError(null);
    setActiveTab("summary");

    if (f.name.toLowerCase().endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) =>
        setDocumentText((ev.target?.result as string) || "");
      reader.readAsText(f);
    } else if (f.name.toLowerCase().endsWith(".docx")) {
      setDocumentText("(DOCX preview not available; use right panel for analysis.)");
    } else {
      setDocumentText("");
    }
    void handleAnalysis(f);
  };

  // core analyze with nice UX for sleepy backend
  const handleAnalysis = async (file: File) => {
    setIsLoading(true);
    setIsWarming(false);
    setError(null);

    try {
      const report = await analyzeDocument(file);
      setAnalysisReport(report);
      if (report.type === "pdf") {
        await renderPdfWithHighlights(file, report);
        lastRenderKeyRef.current = `${file.name}:${file.size}:${report.pages}`;
      }
    } catch (err: unknown) {
      // If it smells like cold start, offer Wake & Retry, else show a normal retry.
      const status: number = (err as any)?.response?.status ?? 0;
      const detail: string =
        (err as any)?.response?.data?.detail ||
        (err as any)?.response?.data?.message ||
        "The AI model failed to process the document.";
      setError(detail);

      // If gateway/cold-start-ish, toggle “warming” hint
      if ([0, 502, 503, 504, 522, 524, 408].includes(status)) {
        setIsWarming(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!documentFile) return;
    setError(null);
    setIsLoading(true);
    setIsWarming(false);
    try {
      const report = await analyzeDocument(documentFile);
      setAnalysisReport(report);
      if (report.type === "pdf") {
        await renderPdfWithHighlights(documentFile, report);
      }
    } catch (err: unknown) {
      const detail: string =
        (err as any)?.response?.data?.detail ||
        (err as any)?.response?.data?.message ||
        "Retry failed.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWakeAndRetry = async () => {
    if (!documentFile) return;
    setIsWarming(true);
    setError(null);
    try {
      await wakeAI(); // best-effort ping
      await handleRetry();
    } finally {
      setIsWarming(false);
    }
  };

  // chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !analysisReport) return;
    const userMessage: ChatMessage = { type: "user", content: chatInput };
    setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const documentId = documentFile?.name || "unknown-document";
      const aiResponse = await askChat(
        userMessage.content,
        [...chatMessages, userMessage],
        documentId,
        analysisReport.analyzedText
      );
      setChatMessages((prev: ChatMessage[]) => [...prev, aiResponse]);
    } catch (_err: unknown) {
      setChatMessages((prev: ChatMessage[]) => [
        ...prev,
        { type: "ai", content: "Sorry, I couldn't get a response. Please try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- render pdf + highlights (responsive & rerender on resize) ---
  const renderPdfWithHighlights = async (file: File, report: AnalysisReport) => {
    if (!pdfContainerRef.current) return;
    pdfContainerRef.current.innerHTML = "";

    try {
      const buf = await file.arrayBuffer();
      const pdf = await getDocument({ data: buf }).promise;

      const container = pdfContainerRef.current!;
      const baseWidthRaw: number =
        container.clientWidth && container.clientWidth > 0 ? container.clientWidth : 640;
      const baseWidth = Math.min(baseWidthRaw, 1200);

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const unscaled = page.getViewport({ scale: 1 });
        const scale = baseWidth / unscaled.width;
        const viewport = page.getViewport({ scale });

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = `${viewport.width}px`;
        wrapper.style.height = `${viewport.height}px`;
        wrapper.style.marginBottom = "16px";
        pdfContainerRef.current.appendChild(wrapper);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        wrapper.appendChild(canvas);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.right = "0";
        overlay.style.bottom = "0";
        overlay.style.pointerEvents = "none";
        wrapper.appendChild(overlay);

        const start = report.pageOffsets?.[pageNum - 1] ?? 0;
        const end = report.pageOffsets?.[pageNum] ?? report.analyzedText.length;

        (report.highlights ?? [])
          .filter((h) => h.rangeStart >= start && h.rangeStart < end)
          .forEach((h) => {
            const rel = (h.rangeStart - start) / Math.max(1, end - start);
            const y = rel * viewport.height;

            const mark = document.createElement("div");
            mark.style.position = "absolute";
            mark.style.left = "12px";
            mark.style.right = "12px";
            mark.style.top = Math.max(4, y - 10) + "px";
            mark.style.height = "24px";
            mark.style.borderRadius = "6px";
            mark.style.opacity = "0.25";
            mark.style.pointerEvents = "none";
            mark.style.background =
              h.kind === "risk" ? "#ef4444" : h.kind === "obligation" ? "#10b981" : "#3b82f6";
            overlay.appendChild(mark);
          });
      }
    } catch (e) {
      // Typed message for TS satisfaction (no implicit any param named msg anywhere)
      console.error("PDF render failed:", e);
      const msg = document.createElement("p");
      msg.className = "text-sm";
      msg.textContent =
        "Preview not available due to a PDF rendering error. You can still use the analysis on the right.";
      pdfContainerRef.current?.appendChild(msg);
    }
  };

  // Rerender on window resize / layout toggles (debounced)
  useEffect(() => {
    if (!pdfSupported || !documentFile || !analysisReport) return;

    const debounce = (fn: () => void, ms: number) => {
      let t: number | undefined;
      return () => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(fn, ms);
      };
    };

    const doRender: () => void = debounce(() => {
      void renderPdfWithHighlights(documentFile, analysisReport);
    }, 200);

    const raf = requestAnimationFrame(() => void renderPdfWithHighlights(documentFile, analysisReport));
    window.addEventListener("resize", doRender);
    doRender();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", doRender);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfSupported, documentFile, analysisReport, sidebarOpen, activeTab]);

  // --- risk pill ---
  const RiskChip = ({ level }: { level: "low" | "medium" | "high" }) => {
    const cfg =
      {
        low: { class: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4 mr-1" /> },
        medium: { class: "bg-yellow-100 text-yellow-800", icon: <AlertTriangle className="h-4 w-4 mr-1" /> },
        high: { class: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4 mr-1" /> },
      }[level];
    return (
      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${cfg.class}`}>
        {cfg.icon}
        {level.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt"
      />

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <LexiclaireLogo size={32} textClassName="text-xl" />
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          <Button variant="default" className="w-full justify-start" onClick={triggerFileSelect}>
            <Upload className="h-4 w-4 mr-2" /> {t.newAnalysis}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onNavigateToHistory}>
            <History className="h-4 w-4 mr-2" /> {t.myDocuments}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onNavigateToCompare}>
            <GitCompare className="h-4 w-4 mr-2" /> {t.versionCompare}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon className="h-4 w-4 mr-2" /> {t.settings}
          </Button>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">{documentTitle}</h1>
              {analysisReport && <RiskChip level={analysisReport.riskLevel} />}
            </div>
            <Button variant="outline" onClick={onBackToLanding}>
              {t.backToHome}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {!isDocumentLoaded ? (
            <div className="h-full flex items-center justify-center p-8">
              <Card className="w-full max-w-2xl">
                <CardContent className="p-12 text-center">
                  {isLoading || isWarming ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
                      <h2 className="text-foreground">
                        {isWarming ? t.warmingUp : t.analyzing}
                      </h2>
                      <p className="text-muted-foreground mt-2">
                        {t.elapsed}: {elapsedSec}s
                      </p>
                      <p className="text-muted-foreground mt-4">{t.mayTakeMoment}</p>
                      {error && (
                        <p className="text-muted-foreground mt-4">{error}</p>
                      )}
                    </>
                  ) : error ? (
                    <>
                      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-6" />
                      <h2 className="text-destructive">{t.analysisFailed}</h2>
                      <p className="text-muted-foreground mt-4">{error}</p>
                      <div className="flex items-center justify-center gap-3 mt-8">
                        <Button size="lg" onClick={handleRetry} className="px-6">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t.retry}
                        </Button>
                        <Button size="lg" variant="secondary" onClick={handleWakeAndRetry} className="px-6">
                          <Rocket className="h-4 w-4 mr-2" />
                          {t.wakeAndRetry}
                        </Button>
                        <Button size="lg" onClick={triggerFileSelect} className="px-6">
                          {t.tryAnotherFile}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-24 w-24 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Upload className="h-12 w-12 text-primary" />
                      </div>
                      <h2 className="mb-4 text-foreground">{t.uploadYourDoc}</h2>
                      <p className="text-muted-foreground mb-8">{t.clickToSelect}</p>
                      <Button size="lg" onClick={triggerFileSelect} className="px-8">
                        {t.chooseFile}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            analysisReport && (
              <div className="h-full flex flex-col lg:flex-row">
                {/* Preview */}
                <div className="flex-1 lg:border-r border-border">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">{t.documentPreview}</h3>
                  </div>
                  <ScrollArea className="h-[calc(100vh-120px)] p-6">
                    {pdfSupported ? (
                      <div ref={pdfContainerRef} />
                    ) : (
                      <div>
                        <p className="text-muted-foreground mb-4">{t.notPreviewable}</p>
                        <pre className="whitespace-pre-wrap font-mono text-sm">{documentText}</pre>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Insights */}
                <div className="w-full lg:w-2/5 flex flex-col">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="border-b border-border px-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary">{t.summary}</TabsTrigger>
                        <TabsTrigger value="chat">{t.chat}</TabsTrigger>
                        <TabsTrigger value="clauses">{t.clauses}</TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {/* Summary */}
                      <TabsContent value="summary" className="h-full m-0 p-0">
                        <ScrollArea className="h-full p-6 space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">{t.summary}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground">{analysisReport.summary}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> {t.obligations}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {analysisReport.obligations.map((ob: Obligation, idx: number) => (
                                <div key={idx} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="h-2 w-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm">{ob.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{ob.clause}</p>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> {t.risks}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {analysisReport.risks.map((risk: Risk, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start space-x-3 p-3 bg-destructive/5 border-destructive/20 rounded-lg"
                                >
                                  <div
                                    className={`h-2 w-2 rounded-full mt-2 ${
                                      risk.severity === "high"
                                        ? "bg-destructive"
                                        : risk.severity === "medium"
                                        ? "bg-orange-500"
                                        : "bg-yellow-400"
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm">{risk.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{risk.clause}</p>
                                  </div>
                                  <Badge
                                    variant={risk.severity === "high" ? "destructive" : "secondary"}
                                    className="text-xs capitalize"
                                  >
                                    {risk.severity}
                                  </Badge>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </ScrollArea>
                      </TabsContent>

                      {/* Chat */}
                      <TabsContent value="chat" className="h-full m-0 p-0 flex flex-col">
                        <ScrollArea className="flex-1 p-6 space-y-4">
                          {chatMessages.length === 0 && (
                            <div className="text-center py-8">
                              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p>{t.askAnything}</p>
                            </div>
                          )}
                          {chatMessages.map((msg: ChatMessage, idx: number) => (
                            <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                          {isChatLoading && (
                            <div className="flex justify-start">
                              <div className="p-3 rounded-lg bg-muted">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                        <div className="border-t p-4">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Ask..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && void handleSendMessage()}
                            />
                            <Button size="sm" onClick={() => void handleSendMessage()} disabled={isChatLoading}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Clauses */}
                      <TabsContent value="clauses" className="h-full m-0 p-0">
                        <ScrollArea className="h-full p-6 space-y-4">
                          {analysisReport.clauses.map((clause: Clause, idx: number) => (
                            <Card key={idx}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{clause.name}</h4>
                                  <Badge
                                    variant={clause.status === "standard" ? "default" : "destructive"}
                                    className="capitalize"
                                  >
                                    {clause.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{clause.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t.settings}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">{t.darkMode}</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t.highContrast}</Label>
                <span className="text-sm text-muted-foreground">
                  {t.current}: {contrast}%
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={140}
                step={10}
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="lexi-range w-full"
                style={{ ["--range-fill" as any]: `${((contrast - 100) / 40) * 100}%` }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t.fontSize}</Label>
                <span className="text-sm text-muted-foreground">
                  {t.current}: {fontSize}px
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={22}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="lexi-range w-full"
                style={{ ["--range-fill" as any]: `${((fontSize - 12) / 10) * 100}%` }}
              />
            </div>

            <div>
              <Label>{t.language}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as LangKey)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t.language} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
