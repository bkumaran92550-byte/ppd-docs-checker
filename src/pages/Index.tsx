import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ComparisonView } from "@/components/ComparisonView";
import { FileProcessor } from "@/lib/fileProcessor";
import { toast } from "sonner";

const Index = () => {
  const [files, setFiles] = useState<{ left: File | null; right: File | null }>({
    left: null,
    right: null,
  });
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleFileUpload = (file: File, side: "left" | "right") => {
    setFiles(prev => ({ ...prev, [side]: file }));
    setComparisonResult(null); // Reset comparison when new files are uploaded
    toast.success(`File uploaded to ${side} panel`);
  };

  const handleCompare = async () => {
    if (!files.left || !files.right) {
      toast.error("Please upload files to both panels before comparing");
      return;
    }

    setIsComparing(true);
    try {
      const processor = new FileProcessor();
      const result = await processor.compareFiles(files.left, files.right);
      setComparisonResult(result);
      toast.success("Files compared successfully!");
    } catch (error) {
      toast.error("Error comparing files: " + (error as Error).message);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PPD DOCS CHECKER
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!comparisonResult ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <FileUpload
                title="Original File"
                subtitle="Upload the first file for comparison"
                onFileUpload={(file) => handleFileUpload(file, "left")}
                file={files.left}
              />
              <FileUpload
                title="Modified File"
                subtitle="Upload the second file for comparison"
                onFileUpload={(file) => handleFileUpload(file, "right")}
                file={files.right}
              />
            </div>

            {/* Compare Button */}
            {(files.left || files.right) && (
              <div className="flex justify-center">
                <button
                  onClick={handleCompare}
                  disabled={!files.left || !files.right || isComparing}
                  className="px-8 py-4 bg-gradient-primary text-primary-foreground font-semibold rounded-lg shadow-glow transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isComparing ? "Comparing..." : "Compare Files"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <ComparisonView 
            result={comparisonResult}
            onReset={() => {
              setComparisonResult(null);
              setFiles({ left: null, right: null });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Index;