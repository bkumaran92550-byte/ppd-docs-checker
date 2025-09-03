import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DetailedDiffViewProps {
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
}

export const DetailedDiffView = ({ differences }: DetailedDiffViewProps) => {
  const renderCharacterDiff = (oldText: string, newText: string) => {
    const oldChars = oldText.split('');
    const newChars = newText.split('');
    const result = [];
    
    let i = 0, j = 0;
    
    while (i < oldChars.length || j < newChars.length) {
      if (i < oldChars.length && j < newChars.length && oldChars[i] === newChars[j]) {
        // Same character
        result.push(<span key={`same-${i}-${j}`} className="text-foreground">{oldChars[i]}</span>);
        i++;
        j++;
      } else {
        // Different characters - show removal and addition
        if (i < oldChars.length) {
          result.push(
            <span key={`removed-${i}`} className="bg-destructive/30 text-destructive-foreground line-through px-0.5 rounded">
              {oldChars[i]}
            </span>
          );
          i++;
        }
        if (j < newChars.length) {
          result.push(
            <span key={`added-${j}`} className="bg-success/30 text-success-foreground px-0.5 rounded">
              {newChars[j]}
            </span>
          );
          j++;
        }
      }
    }
    
    return result;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Detailed Changes</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {differences.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No differences found between the files.</p>
        ) : (
          differences.map((diff, index) => (
            <div key={index} className="border border-border rounded-lg p-4 bg-secondary/20">
              <div className="flex items-center gap-2 mb-3">
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
              
              {diff.type === 'modified' && diff.leftText && diff.rightText ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Before:</div>
                    <div className="font-mono text-sm p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                      {diff.leftText}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">After:</div>
                    <div className="font-mono text-sm p-2 bg-success/10 rounded border-l-2 border-success">
                      {diff.rightText}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Character-level Changes:</div>
                    <div className="font-mono text-sm p-2 bg-secondary/30 rounded">
                      {renderCharacterDiff(diff.leftText, diff.rightText)}
                    </div>
                  </div>
                </div>
              ) : diff.type === 'added' && diff.rightText ? (
                <div className="font-mono text-sm p-2 bg-success/10 rounded border-l-2 border-success">
                  <span className="text-xs text-muted-foreground block mb-1">Added content:</span>
                  {diff.rightText}
                </div>
              ) : diff.type === 'removed' && diff.leftText ? (
                <div className="font-mono text-sm p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                  <span className="text-xs text-muted-foreground block mb-1">Removed content:</span>
                  <span className="line-through">{diff.leftText}</span>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};