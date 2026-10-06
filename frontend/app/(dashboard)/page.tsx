"use client";

import { Suspense } from "react";
import { useFolderContents } from "@/hooks/useFolderContents";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { ItemActionsMenu } from "@/components/files/item-actions-menu";

function DashboardContent() {
  const { currentFolderId, navigateToFolder, navigateBack } = useFolderNavigation();
  const { data, isPending, isError, error } = useFolderContents({ folder_id: currentFolderId });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{error.message}</p>;
  }

  return (
    <>
      {currentFolderId !== undefined && (
        <button className="text-sm text-blue-500 hover:underline mb-4 " onClick={() => navigateBack()}>
          Go back
        </button>
      )}
      {data.folders.length === 0 && data.documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">This folder is empty.</p>
      ) : (
        <ul className="space-y-2">
          {data.folders.map((folder) => (
            <li
              key={`folder-${folder.id}`}
              className="flex items-center justify-between rounded px-2 py-1 text-sm font-medium cursor-pointer hover:bg-muted/50"
              onClick={() => navigateToFolder(folder.id)}
            >
              <span className="hover:underline">📁 {folder.name}</span>
              <ItemActionsMenu id={folder.id} type="folder" name={folder.name} />
            </li>
          ))}
          {data.documents.map((document) => (
            <li
              key={`document-${document.id}`}
              className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/50"
            >
              <span>📄 {document.name}</span>
              <ItemActionsMenu id={document.id} type="document" name={document.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
