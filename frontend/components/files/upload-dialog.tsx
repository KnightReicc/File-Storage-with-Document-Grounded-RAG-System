"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUploadDocument } from "@/hooks/useUploadDocument";
import { Upload } from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: number | undefined;
}

export function UploadDialog({ open, onOpenChange, folderId }: UploadDialogProps) {
  const { mutate, isPending, isError, error, reset } = useUploadDocument(folderId);
  const [dropError, setDropError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        reset(); // don't show a stale upload error next to this message
        setDropError("Please upload one file at a time.");
        return;
      }
      setDropError(null);

      const file = acceptedFiles[0];
      if (!file) return;

      mutate(file, { onSuccess: () => onOpenChange(false) });
    },
    [mutate, onOpenChange, reset],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setDropError(null);
    }
    onOpenChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isPending,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-muted" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {isPending ? (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm">Drop the file here</p>
          ) : (
            <p className="text-sm text-muted-foreground">Drag a file here, or click to browse</p>
          )}
        </div>

        {dropError && <p className="text-sm text-destructive">{dropError}</p>}
        {isError && <p className="text-sm text-destructive">{error.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
