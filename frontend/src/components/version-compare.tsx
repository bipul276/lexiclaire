import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { ArrowLeft, GitCompare, Plus, Minus, FileText, Upload, Loader2, AlertTriangle } from "lucide-react";
import { compareDocuments } from "../services/api";
import type { ComparisonReport } from "../services/api";

interface VersionCompareProps {
  onBack: () => void;
}

export function VersionCompare({ onBack }: VersionCompareProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<number | null>(null);

  const fileAInputRef = useRef<HTMLInputElement>(null);
  const fileBInputRef = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      setError("Please select both document versions to compare.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport(null);
    try {
      const comparisonReport = await compareDocuments(fileA, fileB);
      setReport(comparisonReport);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "An unknown error occurred during comparison.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderUploadUI = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Compare Document Versions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 p-8">
          {/* File A Upload */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <input type="file" ref={fileAInputRef} onChange={(e) => setFileA(e.target.files?.[0] || null)} className="hidden" />
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Original Document (Version 1)</h3>
            <Button variant="outline" onClick={() => fileAInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {fileA ? "Change File" : "Upload File"}
            </Button>
            {fileA && <p className="text-sm text-muted-foreground mt-3 truncate max-w-xs">{fileA.name}</p>}
          </div>
          {/* File B Upload */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <input type="file" ref={fileBInputRef} onChange={(e) => setFileB(e.target.files?.[0] || null)} className="hidden" />
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Updated Document (Version 2)</h3>
            <Button variant="outline" onClick={() => fileBInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {fileB ? "Change File" : "Upload File"}
            </Button>
            {fileB && <p className="text-sm text-muted-foreground mt-3 truncate max-w-xs">{fileB.name}</p>}
          </div>
          <div className="md:col-span-2 text-center mt-4">
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}
            <Button size="lg" onClick={handleCompare} disabled={!fileA || !fileB || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Comparing..." : "Compare Documents"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComparisonUI = () => report && (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex">
        <div className="flex-1 border-r border-border">
          <div className="p-4 border-b border-border bg-red-50 dark:bg-red-950">
            <h3 className="font-semibold text-foreground flex items-center"><FileText className="h-4 w-4 mr-2" />{report.versionA.title}</h3>
            <p className="text-sm text-muted-foreground">Original Version</p>
          </div>
          <ScrollArea className="h-[calc(100vh-120px)] p-6">
            <pre className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap">{report.versionA.content}</pre>
          </ScrollArea>
        </div>
        <div className="flex-1">
          <div className="p-4 border-b border-border bg-green-50 dark:bg-green-950">
            <h3 className="font-semibold text-foreground flex items-center"><FileText className="h-4 w-4 mr-2" />{report.versionB.title}</h3>
            <p className="text-sm text-muted-foreground">Updated Version</p>
          </div>
          <ScrollArea className="h-[calc(100vh-120px)] p-6">
            <pre className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap">{report.versionB.content}</pre>
          </ScrollArea>
        </div>
      </div>
      <div className="w-96 border-l border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Changes Summary</h3>
          <p className="text-sm text-muted-foreground">{report.changes.length} changes detected</p>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)] p-4">
          <div className="space-y-4">
            {report.changes.map((change, idx) => (
              <Card key={idx} className={`cursor-pointer transition-colors ${selectedChange === idx ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`} onClick={() => setSelectedChange(selectedChange === idx ? null : idx)}>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{change.section}</CardTitle>
                    <Badge variant={change.type === 'added' ? 'default' : 'secondary'} className={`capitalize ${change.type === 'added' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {change.type === 'added' ? <Plus className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      {change.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground mb-2">{change.description}</p>
                  {selectedChange === idx && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-foreground mb-1">Impact:</p>
                      <p className="text-xs text-muted-foreground">{change.impact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
            <div className="flex items-center space-x-2"><GitCompare className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold text-foreground">Version Comparison</h1></div>
          </div>
          {report && <div className="flex items-center space-x-2"><Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><Minus className="h-3 w-3 mr-1" /> Removed</Badge><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Plus className="h-3 w-3 mr-1" /> Added</Badge></div>}
        </div>
      </header>
      {!report && !isLoading ? renderUploadUI() : null}
      {isLoading && <div className="flex-1 flex items-center justify-center"><div className="text-center space-y-2"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Comparing documents...</p></div></div>}
      {report && renderComparisonUI()}
    </div>
  );
}