import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  GitCompare,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { getDocuments } from "../services/api";
import type { Document } from "../services/api";
import { usePreferences } from "../PreferencesContext";

const translations = {
  en: {
    back: "Back",
    myDocs: "My Documents",
    subtitle: "Manage and review your analyzed legal documents",
    newAnalysis: "New Analysis",
    searchPlaceholder: "Search documents...",
    all: "All",
    recent: "Recent",
    highRisk: "High Risk",
    processing: "Processing",
    analyzing: "Analyzing",
    failed: "Failed",
    complete: "Complete",
    noDocs: "No documents found",
    tryAdjust: "Try adjusting your search terms.",
    appearHere: "Your analyzed documents will appear here.",
  },
  hi: {
    back: "वापस",
    myDocs: "मेरे दस्तावेज़",
    subtitle: "अपने विश्लेषित कानूनी दस्तावेज़ प्रबंधित करें और देखें",
    newAnalysis: "नया विश्लेषण",
    searchPlaceholder: "दस्तावेज़ खोजें...",
    all: "सभी",
    recent: "हाल के",
    highRisk: "उच्च जोखिम",
    processing: "प्रोसेसिंग",
    analyzing: "विश्लेषण जारी",
    failed: "असफल",
    complete: "पूर्ण",
    noDocs: "कोई दस्तावेज़ नहीं मिला",
    tryAdjust: "खोज शब्दों को बदलकर देखें।",
    appearHere: "आपके विश्लेषित दस्तावेज़ यहाँ दिखाई देंगे।",
  },
  pa: {
    back: "ਵਾਪਸ",
    myDocs: "ਮੇਰੇ ਦਸਤਾਵੇਜ਼",
    subtitle: "ਆਪਣੇ ਵਿਸ਼ਲੇਸ਼ਿਤ ਕਾਨੂਨੀ ਦਸਤਾਵੇਜ਼ ਸੰਭਾਲੋ ਤੇ ਵੇਖੋ",
    newAnalysis: "ਨਵਾਂ ਵਿਸ਼ਲੇਸ਼ਣ",
    searchPlaceholder: "ਦਸਤਾਵੇਜ਼ ਖੋਜੋ...",
    all: "ਸਾਰੇ",
    recent: "ਹਾਲੀਆ",
    highRisk: "ਉੱਚ ਖਤਰਾ",
    processing: "ਪ੍ਰੋਸੈਸਿੰਗ",
    analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਜਾਰੀ",
    failed: "ਅਸਫਲ",
    complete: "ਪੂਰਾ",
    noDocs: "ਕੋਈ ਦਸਤਾਵੇਜ਼ ਨਹੀਂ ਮਿਲਿਆ",
    tryAdjust: "ਖੋਜ ਸ਼ਬਦ ਬਦਲ ਕੇ ਦੇਖੋ।",
    appearHere: "ਤੁਹਾਡੇ ਵਿਸ਼ਲੇਸ਼ਿਤ ਦਸਤਾਵੇਜ਼ ਇੱਥੇ ਨਜ਼ਰ ਆਉਣਗੇ।",
  },
};
type LangKey = keyof typeof translations;

interface DocumentHistoryProps {
  onBack: () => void;
  onViewDocument: (doc: Document) => void;
  onNewAnalysis: () => void;
}

export function DocumentHistory({ onBack, onViewDocument, onNewAnalysis }: DocumentHistoryProps) {
  const { language } = usePreferences();
  const t = translations[(language as LangKey) ?? "en"];

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "recent" | "high-risk" | "analyzing">("all");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedDocuments = await getDocuments();
        setDocuments(fetchedDocuments);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Could not load your document history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return documents.filter((doc) => {
      const tags = doc.tags ?? [];
      const title = (doc.title ?? "").toLowerCase();
      const matchesSearch =
        title.includes(q) || tags.some((t) => (t ?? "").toLowerCase().includes(q));

      const uploadedAt = new Date(doc.uploadDate ?? 0);
      const isRecent = !isNaN(+uploadedAt) && uploadedAt > sevenDaysAgo;

      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "high-risk" && doc.riskLevel === "high") ||
        (selectedFilter === "analyzing" && doc.status === "analyzing") ||
        (selectedFilter === "recent" && isRecent);

      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, selectedFilter]);

  // inside DocumentHistory.tsx
const getRiskBadge = (riskLevel: Document['riskLevel']) => {
  if (!riskLevel) return <Badge variant="outline">N/A</Badge>;
  const cfg = {
    low:   { class: "bg-green-100 text-green-800", icon: CheckCircle },
    medium:{ class: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
    high:  { class: "bg-red-100 text-red-800", icon: AlertTriangle }
  }[riskLevel];
  const Icon = cfg.icon;
  return <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${cfg.class}`}>
    <Icon className="h-3 w-3 mr-1" /> {riskLevel} Risk
  </span>;
};


  const getStatusBadge = (status: Document['status']) => {
    if (status === "analyzing") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          {t.analyzing}
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t.failed}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t.complete}
      </Badge>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Loading Documents...</h3>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">An Error Occurred</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{getRiskBadge(doc.riskLevel)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {doc.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{doc.tags.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{doc.size}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button aria-label="View" variant="ghost" size="sm" onClick={() => onViewDocument(doc)} disabled={doc.status !== "analyzed"}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button aria-label="Compare" variant="ghost" size="sm">
                          <GitCompare className="h-4 w-4" />
                        </Button>
                        <Button aria-label="Download" variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t.noDocs}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t.tryAdjust : t.appearHere}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> {t.back}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.myDocs}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          <Button onClick={onNewAnalysis}>
            <FileText className="h-4 w-4 mr-2" /> {t.newAnalysis}
          </Button>
        </div>
      </header>

      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button variant={selectedFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("all")}>{t.all}</Button>
              <Button variant={selectedFilter === "recent" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("recent")}>{t.recent}</Button>
              <Button variant={selectedFilter === "high-risk" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("high-risk")}>{t.highRisk}</Button>
              <Button variant={selectedFilter === "analyzing" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("analyzing")}>{t.processing}</Button>
            </div>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
