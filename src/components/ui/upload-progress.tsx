import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  isUploading: boolean;
  error?: string;
  onCancel?: () => void;
  fileName?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  isUploading,
  error,
  onCancel,
  fileName
}) => {
  if (!isUploading && !error && progress === 0) return null;

  return (
    <div className="upload-progress-container p-4 border border-border rounded-lg bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : progress === 100 ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span className="text-sm font-medium">
            {fileName && `${fileName} - `}
            {error ? 'Upload Failed' : progress === 100 ? 'Upload Complete' : 'Uploading...'}
          </span>
        </div>
        
        {onCancel && isUploading && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      {!error && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>
              {progress < 100 ? 'Please wait...' : 'Done!'}
            </span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};