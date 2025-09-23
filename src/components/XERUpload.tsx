import { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, Loader2, History } from 'lucide-react';
import { parseXERFile } from '../services/xerParser';
import { parseXMLFile } from '../services/xmlParser';

interface XERUploadProps {
  onDataProcessed: (data: any) => void;
  isBaseline?: boolean;
  label?: string;
}

export function XERUpload({ onDataProcessed, isBaseline = false, label }: XERUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!['xer', 'xml'].includes(fileExtension || '')) {
      setError('Please upload a valid .xer or P6 schema .xml file');
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setFileName(file.name);

    try {
      // Create new AbortController for this operation
      abortControllerRef.current = new AbortController();

      let data;
      if (fileExtension === 'xer') {
        data = await parseXERFile(file, (progress) => {
          setProgress(progress);
        }, isBaseline);
      } else {
        data = await parseXMLFile(file, (progress) => {
          setProgress(progress);
        });
      }
      
      onDataProcessed(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('File processing was cancelled');
      } else {
        setError('Error processing file. Please try again.');
        console.error(err);
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="mb-8">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8
          ${isDragging ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50'}
          ${isBaseline ? 'bg-secondary/5' : ''}
          transition-colors duration-300
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xer,.xml"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
          ref={fileInputRef}
        />
        
        <div className="text-center">
          <div className="mb-4">
            {isProcessing ? (
              <div className="relative">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
                </div>
              </div>
            ) : isBaseline ? (
              <History className="w-12 h-12 mx-auto text-secondary" />
            ) : (
              <Upload className="w-12 h-12 mx-auto text-primary" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            {isProcessing ? 'Processing File...' : label || 'Upload P6 Schedule'}
          </h3>
          
          {fileName ? (
            <p className="text-white/60 text-sm mb-4">
              Current file: {fileName}
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              <p className="text-white/60 text-sm">
                {isProcessing 
                  ? 'This may take a few minutes for large files...'
                  : 'Drag and drop your file here, or click to select (max 100MB)'}
              </p>
              <p className="text-white/40 text-xs">
                Supported formats: Primavera P6 XER (.xer) and P6 Schema XML (.xml - beta)
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm justify-center mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className={`${
                isBaseline 
                  ? 'bg-secondary/10 hover:bg-secondary/20 text-secondary'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              } px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <FileUp className="w-4 h-4" />
              <span>Select File</span>
            </button>

            {isProcessing && (
              <button
                type="button"
                onClick={cancelProcessing}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-full transition-all duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="mt-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isBaseline ? 'bg-secondary' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
