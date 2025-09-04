import { ArrowLeft, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DetailedDiffView } from "./DetailedDiffView";
import { ExcelComparisonView } from "./ExcelComparisonView";
import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

interface ComparisonViewProps {
  result: {
    type: string;
    leftContent: string[];
    rightContent: string[];
    differences: Array<{
      line: number;
      type: 'added' | 'removed' | 'modified';
      leftText?: string;
      rightText?: string;
      wordDiffs?: Array<{
        type: 'added' | 'removed' | 'unchanged';
        text: string;
      }>;
    }>;
    summary: {
      totalChanges: number;
      additions: number;
      deletions: number;
      modifications: number;
    };
  };
  onReset: () => void;
}

export const ComparisonView = ({ result, onReset }: ComparisonViewProps) => {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const middleScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const [middleHeight, setMiddleHeight] = useState(0);

  useEffect(() => {
    const computeHeights = () => {
      const leftH = leftScrollRef.current?.scrollHeight || 0;
      const rightH = rightScrollRef.current?.scrollHeight || 0;
      setMiddleHeight(Math.max(leftH, rightH));
    };
    computeHeights();
    const id = setInterval(computeHeights, 500);
    return () => clearInterval(id);
  }, []);

  // Check if this is Excel content
  const isExcelComparison = result.leftContent.some(line => 
    line.includes('=== WORKSHEET:') || line.includes('Row ')
  ) || result.rightContent.some(line => 
    line.includes('=== WORKSHEET:') || line.includes('Row ')
  );

  const exportResults = () => {
    const timestamp = new Date().toISOString();

    if (isExcelComparison) {
      // Build an Excel workbook with Summary, Original, Modified, and Differences
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ["PPD DOCS CHECKER Report"],
        ["Generated", timestamp],
        ["Total Changes", result.summary.totalChanges],
        ["Additions", result.summary.additions],
        ["Deletions", result.summary.deletions],
        ["Modifications", result.summary.modifications],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Original file content
      const originalData = [["Line", "Content"], ...result.leftContent.map((line, index) => [index + 1, line])];
      const wsOriginal = XLSX.utils.aoa_to_sheet(originalData);
      XLSX.utils.book_append_sheet(wb, wsOriginal, 'Original File');

      // Modified file content
      const modifiedData = [["Line", "Content"], ...result.rightContent.map((line, index) => [index + 1, line])];
      const wsModified = XLSX.utils.aoa_to_sheet(modifiedData);
      XLSX.utils.book_append_sheet(wb, wsModified, 'Modified File');

      // Differences with detailed info
      const diffHeader = ["Line", "Type", "Original Text", "Modified Text"];
      const diffRows = result.differences.map((d) => [
        d.line + 1,
        d.type,
        d.leftText || '',
        d.rightText || ''
      ]);
      const wsDiff = XLSX.utils.aoa_to_sheet([diffHeader, ...diffRows]);
      XLSX.utils.book_append_sheet(wb, wsDiff, 'Differences');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ppd-docs-checker-report-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // For text/CSV files, export with full content
    const exportData = {
      summary: result.summary,
      originalFile: result.leftContent,
      modifiedFile: result.rightContent,
      differences: result.differences,
      timestamp,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ppd-docs-checker-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Synchronized scrolling handler
  const handleScroll = useCallback((source: 'left' | 'right' | 'middle') => (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current) return;
    const scrollTop = e.currentTarget.scrollTop;
    isSyncingRef.current = true;

    const syncTargets: Array<React.RefObject<HTMLDivElement>> = [];
    if (source !== 'left') syncTargets.push(leftScrollRef);
    if (source !== 'right') syncTargets.push(rightScrollRef);
    if (source !== 'middle') syncTargets.push(middleScrollRef);

    syncTargets.forEach(ref => {
      if (ref.current) ref.current.scrollTop = scrollTop;
    });

    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  // Filter to only show lines with differences
  const getDifferenceLines = () => {
    const differenceSet = new Set(result.differences.map(d => d.line));
    const maxLines = Math.max(result.leftContent.length, result.rightContent.length);
    const filteredLines = [] as Array<{ index: number; leftContent: string; rightContent: string }>;
    
    for (let i = 0; i < maxLines; i++) {
      if (differenceSet.has(i)) {
        filteredLines.push({
          index: i,
          leftContent: result.leftContent[i] || '',
          rightContent: result.rightContent[i] || ''
        });
      }
    }
    
    return filteredLines;
  };

  const renderWordDiffs = (wordDiffs: Array<{type: 'added' | 'removed' | 'unchanged'; text: string}>, showCorrections: boolean = false) => {
    return wordDiffs.map((diff, index) => (
      <span
        key={index}
        className={
          showCorrections ? (
            diff.type === 'added'
              ? "bg-success/30 text-success-foreground px-1 rounded"
              : diff.type === 'removed'
              ? "bg-destructive/30 text-destructive-foreground px-1 rounded line-through"
              : ""
          ) : ""
        }
      >
        {diff.text}
      </span>
    ));
  };

  const renderLine = (content: string, actualIndex: number, side: 'left' | 'right', displayIndex: number) => {
    const difference = result.differences.find(d => d.line === actualIndex);
    let className = side === 'right' ? "p-3 border-l-4 " : "p-3";

    if (difference && side === 'right') {
      switch (difference.type) {
        case 'added':
          className += "border-success bg-success/5";
          break;
        case 'removed':
          className += "border-destructive bg-destructive/5";
          break;
        case 'modified':
          className += "border-warning bg-warning/5";
          break;
        default:
          className += "border-transparent";
      }
    }

    return (
      <div key={actualIndex} className={className}>
        <div className="flex items-start gap-4">
          <span className="text-xs text-muted-foreground mt-1 w-8 flex-shrink-0">{actualIndex + 1}</span>
          <div className="font-mono text-sm flex-1 break-words">
            {difference && difference.type === 'modified' && difference.wordDiffs && side === 'right' ? (
              renderWordDiffs(difference.wordDiffs, true)
            ) : (
              <span>{content}</span>
            )}
          </div>
        </div>
        {difference && difference.type === 'modified' && side === 'right' && (
          <div className="mt-2 text-xs text-muted-foreground ml-12">
            Modified • {difference.type}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button 
          variant="outline" 
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </Button>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowDetailedView(!showDetailedView)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showDetailedView 
              ? "Side-by-Side View" 
              : isExcelComparison 
                ? "Excel Details" 
                : "Detailed Changes"}
          </Button>
          <Button 
            onClick={exportResults}
            className="flex items-center gap-2 bg-gradient-primary"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-gradient-card border-border shadow-card">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Comparison Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-foreground">{result.summary.totalChanges}</div>
            <div className="text-sm text-muted-foreground">Total Changes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-success">{result.summary.additions}</div>
            <div className="text-sm text-muted-foreground">Additions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-destructive">{result.summary.deletions}</div>
            <div className="text-sm text-muted-foreground">Deletions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-warning">{result.summary.modifications}</div>
            <div className="text-sm text-muted-foreground">Modifications</div>
          </div>
        </div>
      </Card>

      {/* Comparison View */}
      {showDetailedView ? (
        isExcelComparison ? (
          <ExcelComparisonView differences={result.differences} />
        ) : (
          <DetailedDiffView differences={result.differences} />
        )
      ) : (
        <div className="flex gap-0 border border-border rounded-lg overflow-hidden bg-gradient-card shadow-card">
          <Card className="border-0 rounded-none border-r border-border flex-1">
            <div className="p-4 bg-secondary/30 border-b border-border">
              <h4 className="font-semibold text-foreground">Original File</h4>
              {isExcelComparison && (
                <p className="text-xs text-muted-foreground mt-1">Excel worksheets and cell data</p>
              )}
            </div>
            <div className="h-96 overflow-hidden">
              <div 
                className="h-full overflow-hidden"
                ref={leftScrollRef}
              >
                {getDifferenceLines().map(({ index, leftContent }, displayIndex) => 
                  renderLine(leftContent, index, 'left', displayIndex)
                )}
              </div>
            </div>
          </Card>

          {/* Middle scrollbar controls both sides */}
          <div className="w-6 bg-muted border-x border-border flex-shrink-0">
            <div
              className="h-96 overflow-y-scroll scrollbar-thin"
              onScroll={handleScroll('middle')}
              ref={middleScrollRef}
            >
              <div style={{ height: middleHeight || 1 }} />
            </div>
          </div>

          <Card className="border-0 rounded-none flex-1">
            <div className="p-4 bg-secondary/30 border-b border-border">
              <h4 className="font-semibold text-foreground">Modified File</h4>
              {isExcelComparison && (
                <p className="text-xs text-muted-foreground mt-1">Excel worksheets and cell data</p>
              )}
            </div>
            <div className="h-96 overflow-hidden">
              <div 
                className="h-full overflow-hidden"
                ref={rightScrollRef}
              >
                {getDifferenceLines().map(({ index, rightContent }, displayIndex) => 
                  renderLine(rightContent, index, 'right', displayIndex)
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-gradient-card border-border shadow-card">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-success bg-success/10"></div>
            <span className="text-muted-foreground">Added Lines (shown on right only)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-destructive bg-destructive/10"></div>
            <span className="text-muted-foreground">Removed Lines (shown on right only)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-warning bg-warning/10"></div>
            <span className="text-muted-foreground">Modified Lines (shown on right only)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};