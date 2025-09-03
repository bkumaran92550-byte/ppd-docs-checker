import { ArrowLeft, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailedDiffView } from "./DetailedDiffView";
import { useState } from "react";

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

  const exportResults = () => {
    const exportData = {
      summary: result.summary,
      differences: result.differences,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderWordDiffs = (wordDiffs: Array<{type: 'added' | 'removed' | 'unchanged'; text: string}>) => {
    return wordDiffs.map((diff, index) => (
      <span
        key={index}
        className={
          diff.type === 'added'
            ? "bg-success/30 text-success-foreground px-1 rounded"
            : diff.type === 'removed'
            ? "bg-destructive/30 text-destructive-foreground px-1 rounded line-through"
            : ""
        }
      >
        {diff.text}
      </span>
    ));
  };

  const renderLine = (content: string, index: number, side: 'left' | 'right') => {
    const difference = result.differences.find(d => d.line === index);
    let className = "p-3 border-l-4 ";

    if (difference) {
      switch (difference.type) {
        case 'added':
          className += side === 'right' ? "border-success bg-success/5" : "border-transparent bg-muted/30";
          break;
        case 'removed':
          className += side === 'left' ? "border-destructive bg-destructive/5" : "border-transparent bg-muted/30";
          break;
        case 'modified':
          className += "border-warning bg-warning/5";
          break;
        default:
          className += "border-transparent";
      }
    } else {
      className += "border-transparent";
    }

    return (
      <div key={index} className={className}>
        <div className="flex items-start gap-4">
          <span className="text-xs text-muted-foreground mt-1 w-8 flex-shrink-0">{index + 1}</span>
          <div className="font-mono text-sm flex-1 break-words">
            {difference && difference.type === 'modified' && difference.wordDiffs ? (
              renderWordDiffs(difference.wordDiffs)
            ) : (
              <span>{content}</span>
            )}
          </div>
        </div>
        {difference && difference.type === 'modified' && (
          <div className="mt-2 text-xs text-muted-foreground ml-12">
            {side === 'left' ? "Original" : "Modified"} • {difference.type}
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
            {showDetailedView ? "Side-by-Side View" : "Detailed Changes"}
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

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-card border-border shadow-card">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Comparison Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-foreground">{result.summary.totalChanges}</div>
            <div className="text-sm text-muted-foreground">Total Changes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{result.summary.additions}</div>
            <div className="text-sm text-muted-foreground">Additions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">{result.summary.deletions}</div>
            <div className="text-sm text-muted-foreground">Deletions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning">{result.summary.modifications}</div>
            <div className="text-sm text-muted-foreground">Modifications</div>
          </div>
        </div>
      </Card>

      {/* Comparison View */}
      {showDetailedView ? (
        <DetailedDiffView differences={result.differences} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border shadow-card overflow-hidden">
            <div className="p-4 bg-secondary/50 border-b border-border">
              <h4 className="font-semibold text-foreground">Original File</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {result.leftContent.map((line, index) => 
                renderLine(line, index, 'left')
              )}
            </div>
          </Card>

          <Card className="bg-gradient-card border-border shadow-card overflow-hidden">
            <div className="p-4 bg-secondary/50 border-b border-border">
              <h4 className="font-semibold text-foreground">Modified File</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {result.rightContent.map((line, index) => 
                renderLine(line, index, 'right')
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card className="p-4 bg-gradient-card border-border shadow-card">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-success bg-success/10"></div>
            <span className="text-muted-foreground">Added Lines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-destructive bg-destructive/10"></div>
            <span className="text-muted-foreground">Removed Lines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-warning bg-warning/10"></div>
            <span className="text-muted-foreground">Modified Lines</span>
          </div>
        </div>
      </Card>
    </div>
  );
};