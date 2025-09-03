import Papa from 'papaparse';

export class FileProcessor {
  async compareFiles(leftFile: File, rightFile: File) {
    const leftContent = await this.processFile(leftFile);
    const rightContent = await this.processFile(rightFile);

    return this.performComparison(leftContent, rightContent);
  }

  private async processFile(file: File): Promise<string[]> {
    const extension = file.name.toLowerCase().split('.').pop();

    switch (extension) {
      case 'txt':
        return this.processTextFile(file);
      case 'csv':
        return this.processCsvFile(file);
      case 'xlsx':
      case 'xls':
        return this.processExcelFile(file);
      case 'docx':
      case 'doc':
        return this.processWordFile(file);
      case 'pdf':
        return this.processPdfFile(file);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return this.processImageFile(file);
      default:
        // Try to process as text file
        return this.processTextFile(file);
    }
  }

  private async processTextFile(file: File): Promise<string[]> {
    const text = await file.text();
    return text.split('\n');
  }

  private async processCsvFile(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          const lines = results.data.map((row: any) => 
            Array.isArray(row) ? row.join(',') : String(row)
          );
          resolve(lines);
        },
        error: (error) => reject(error),
        skipEmptyLines: true
      });
    });
  }

  private async processExcelFile(file: File): Promise<string[]> {
    // For now, treat Excel files as text (placeholder for future XLSX library integration)
    try {
      const text = await file.text();
      return ['Excel file processing not fully implemented yet.', 'File name: ' + file.name, 'Size: ' + file.size + ' bytes'];
    } catch {
      return ['Unable to process Excel file: ' + file.name];
    }
  }

  private async processWordFile(file: File): Promise<string[]> {
    // Placeholder for Word document processing
    return ['Word document processing not fully implemented yet.', 'File name: ' + file.name, 'Size: ' + file.size + ' bytes'];
  }

  private async processPdfFile(file: File): Promise<string[]> {
    // Placeholder for PDF processing
    return ['PDF processing not fully implemented yet.', 'File name: ' + file.name, 'Size: ' + file.size + ' bytes'];
  }

  private async processImageFile(file: File): Promise<string[]> {
    // For images, we'll return metadata for now
    return [
      'Image file detected: ' + file.name,
      'Size: ' + file.size + ' bytes',
      'Type: ' + file.type,
      'Last modified: ' + new Date(file.lastModified).toLocaleString(),
      'Note: Visual image comparison not yet implemented'
    ];
  }

  private performComparison(leftLines: string[], rightLines: string[]) {
    const differences: Array<{
      line: number;
      type: 'added' | 'removed' | 'modified';
      leftText?: string;
      rightText?: string;
    }> = [];

    const maxLength = Math.max(leftLines.length, rightLines.length);
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (let i = 0; i < maxLength; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';

      if (leftLine !== rightLine) {
        if (!leftLine && rightLine) {
          // Line added
          differences.push({
            line: i,
            type: 'added',
            rightText: rightLine
          });
          additions++;
        } else if (leftLine && !rightLine) {
          // Line removed
          differences.push({
            line: i,
            type: 'removed',
            leftText: leftLine
          });
          deletions++;
        } else {
          // Line modified
          differences.push({
            line: i,
            type: 'modified',
            leftText: leftLine,
            rightText: rightLine
          });
          modifications++;
        }
      }
    }

    return {
      type: 'text',
      leftContent: leftLines,
      rightContent: rightLines,
      differences,
      summary: {
        totalChanges: differences.length,
        additions,
        deletions,
        modifications
      }
    };
  }
}