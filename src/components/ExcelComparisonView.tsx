import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ExcelComparisonViewProps {
  differences: Array<{
    line: number;
    type: 'added' | 'removed' | 'modified';
    leftText?: string;
    rightText?: string;
  }>;
}

export const ExcelComparisonView = ({ differences }: ExcelComparisonViewProps) => {
  const parseExcelLine = (line: string) => {
    if (line.startsWith('=== WORKSHEET:')) {
      return { type: 'worksheet', content: line };
    }
    if (line.startsWith('Row ')) {
      const match = line.match(/Row (\d+): (.+)/);
      if (match) {
        const rowNum = match[1];
        const cellData = match[2].split(' | ');
        return { type: 'row', rowNum, cellData };
      }
    }
    return { type: 'other', content: line };
  };

  const parseCellData = (cellStr: string) => {
    const match = cellStr.match(/([A-Z]+\d+):(.+)/);
    if (match) {
      return { cell: match[1], value: match[2] };
    }
    return { cell: '', value: cellStr };
  };

  const renderExcelDiff = (diff: any, index: number) => {
    const leftParsed = diff.leftText ? parseExcelLine(diff.leftText) : null;
    const rightParsed = diff.rightText ? parseExcelLine(diff.rightText) : null;

    return (
      <div key={index} className="border border-border rounded-lg p-4 bg-secondary/20 space-y-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant={diff.type === 'added' ? 'default' : diff.type === 'removed' ? 'destructive' : 'secondary'}
            className={
              diff.type === 'added' 
                ? 'bg-success text-success-foreground' 
                : diff.type === 'removed' 
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-warning text-warning-foreground'
            }
          >
            {diff.type === 'added' ? 'Added' : diff.type === 'removed' ? 'Removed' : 'Modified'}
          </Badge>
          <span className="text-xs text-muted-foreground">Line {diff.line + 1}</span>
        </div>

        {/* Worksheet headers */}
        {(leftParsed?.type === 'worksheet' || rightParsed?.type === 'worksheet') && (
          <div className="space-y-2">
            {leftParsed?.type === 'worksheet' && (
              <div className="p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                <span className="text-xs text-muted-foreground">Original:</span>
                <div className="font-semibold">{leftParsed.content}</div>
              </div>
            )}
            {rightParsed?.type === 'worksheet' && (
              <div className="p-2 bg-success/10 rounded border-l-2 border-success">
                <span className="text-xs text-muted-foreground">Modified:</span>
                <div className="font-semibold">{rightParsed.content}</div>
              </div>
            )}
          </div>
        )}

        {/* Row data comparison */}
        {(leftParsed?.type === 'row' || rightParsed?.type === 'row') && (
          <div className="space-y-3">
            {leftParsed?.type === 'row' && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Original Row {leftParsed.rowNum}:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {leftParsed.cellData.map((cell: string, idx: number) => {
                    const { cell: cellRef, value } = parseCellData(cell);
                    return (
                      <div key={idx} className="p-2 bg-destructive/5 rounded border text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{cellRef}:</span>
                        <div className="font-mono break-words">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {rightParsed?.type === 'row' && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Modified Row {rightParsed.rowNum}:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rightParsed.cellData.map((cell: string, idx: number) => {
                    const { cell: cellRef, value } = parseCellData(cell);
                    return (
                      <div key={idx} className="p-2 bg-success/5 rounded border text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{cellRef}:</span>
                        <div className="font-mono break-words">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other content */}
        {(leftParsed?.type === 'other' || rightParsed?.type === 'other') && (
          <div className="space-y-2">
            {leftParsed?.type === 'other' && (
              <div className="p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                <span className="text-xs text-muted-foreground">Original:</span>
                <div className="font-mono text-sm">{leftParsed.content}</div>
              </div>
            )}
            {rightParsed?.type === 'other' && (
              <div className="p-2 bg-success/10 rounded border-l-2 border-success">
                <span className="text-xs text-muted-foreground">Modified:</span>
                <div className="font-mono text-sm">{rightParsed.content}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Excel Content Changes</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {differences.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No differences found between Excel files.</p>
        ) : (
          differences.map((diff, index) => renderExcelDiff(diff, index))
        )}
      </div>
    </Card>
  );
};
