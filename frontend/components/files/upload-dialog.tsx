"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUploadDocument } from "@/hooks/useUploadDocument";
import { Upload } from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: number | undefined;
}

export function UploadDialog({ open, onOpenChange, folderId }: UploadDialogProps) {
  const { mutate, isPending, isError, error } = useUploadDocument(folderId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      mutate(file, {
        onSuccess: () => onOpenChange(false),
      });
    },
    [mutate, onOpenChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isPending,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        {isError && <p className="text-sm text-destructive">{error.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
