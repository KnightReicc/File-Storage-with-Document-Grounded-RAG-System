"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { RenameDialog } from "./rename-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useRenameFolder } from "@/hooks/useRenameFolder";
import { useDeleteFolder } from "@/hooks/useDeleteFolder";
import { useRenameDocument } from "@/hooks/useRenameDocument";
import { useDeleteDocument } from "@/hooks/useDeleteDocument";

interface ItemActionsMenuProps {
  id: number;
  name: string;
  type: "folder" | "document";
}

export function ItemActionsMenu({ id, name, type }: ItemActionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const renameDocument = useRenameDocument();
  const deleteDocument = useDeleteDocument();

  const isRenamePending = type === "folder" ? renameFolder.isPending : renameDocument.isPending;
  const isDeletePending = type === "folder" ? deleteFolder.isPending : deleteDocument.isPending;

  const handleRename = (newName: string) => {
    const onSuccess = () => setRenameOpen(false);
    if (type === "folder") {
      renameFolder.mutate({ id, name: newName }, { onSuccess });
    } else {
      renameDocument.mutate({ id, name: newName }, { onSuccess });
    }
  };

  const handleDelete = () => {
    const onSuccess = () => setDeleteOpen(false);
    if (type === "folder") {
      deleteFolder.mutate(id, { onSuccess });
    } else {
      deleteDocument.mutate(id, { onSuccess });
    }
  };

  return (
    <div className="contents" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              console.log("rename clicked");
              setRenameOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log("rename clicked");
              setDeleteOpen(true);
            }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={name}
        isPending={isRenamePending}
        onSubmit={handleRename}
        type={type}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={name}
        isPending={isDeletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
