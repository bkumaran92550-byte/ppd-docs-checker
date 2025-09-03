import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const allSheetData: string[] = [];
      
      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Add sheet header
        allSheetData.push(`=== WORKSHEET: ${sheetName} ===`);
        
        // Convert sheet to JSON to get structured data
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '', 
          raw: false 
        }) as any[][];
        
        if (jsonData.length === 0) {
          allSheetData.push('(Empty worksheet)');
          allSheetData.push('');
          return;
        }
        
        // Process each row
        jsonData.forEach((row, rowIndex) => {
          if (Array.isArray(row)) {
            // Create a formatted row showing cell positions and values
            const formattedCells = row.map((cell, colIndex) => {
              const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
              const cellValue = cell === null || cell === undefined ? '' : String(cell);
              return cellValue ? `${cellRef}:${cellValue}` : '';
            }).filter(cell => cell !== '');
            
            if (formattedCells.length > 0) {
              allSheetData.push(`Row ${rowIndex + 1}: ${formattedCells.join(' | ')}`);
            }
          }
        });
        
        // Add some spacing between sheets
        if (sheetIndex < workbook.SheetNames.length - 1) {
          allSheetData.push('');
        }
      });
      
      return allSheetData;
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return [
        'Error processing Excel file: ' + (error as Error).message,
        'File name: ' + file.name,
        'Size: ' + file.size + ' bytes'
      ];
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
      wordDiffs?: Array<{
        type: 'added' | 'removed' | 'unchanged';
        text: string;
      }>;
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
          // Line modified - perform word-level diff
          const wordDiffs = this.getWordLevelDiff(leftLine, rightLine);
          differences.push({
            line: i,
            type: 'modified',
            leftText: leftLine,
            rightText: rightLine,
            wordDiffs
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

  private getWordLevelDiff(leftText: string, rightText: string) {
    const leftWords = leftText.split(/(\s+)/);
    const rightWords = rightText.split(/(\s+)/);
    const diffs: Array<{
      type: 'added' | 'removed' | 'unchanged';
      text: string;
    }> = [];

    // Simple word-by-word comparison
    const maxWords = Math.max(leftWords.length, rightWords.length);
    
    for (let i = 0; i < maxWords; i++) {
      const leftWord = leftWords[i] || '';
      const rightWord = rightWords[i] || '';

      if (leftWord === rightWord) {
        if (leftWord) {
          diffs.push({ type: 'unchanged', text: leftWord });
        }
      } else {
        if (leftWord) {
          diffs.push({ type: 'removed', text: leftWord });
        }
        if (rightWord) {
          diffs.push({ type: 'added', text: rightWord });
        }
      }
    }

    return diffs;
  }
}