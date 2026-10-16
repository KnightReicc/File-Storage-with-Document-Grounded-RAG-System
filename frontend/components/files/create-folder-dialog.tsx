"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateFolder } from "@/hooks/useCreateFolder";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolderId: number | undefined;
}

export function CreateFolderDialog({ open, onOpenChange, parentFolderId }: CreateFolderDialogProps) {
  const { mutate, isPending, isError, error, reset } = useCreateFolder();
  const [name, setName] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  // Start every opening with an empty field (same render-time pattern as RenameDialog)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    mutate({ name: trimmed, parent_folder_id: parentFolderId }, { onSuccess: () => handleOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            maxLength={255}
            autoFocus
          />

          {isError && <p className="text-sm text-destructive">{error.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || name.trim().length === 0}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
