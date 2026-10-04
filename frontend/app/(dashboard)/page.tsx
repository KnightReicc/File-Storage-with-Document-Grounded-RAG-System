"use client";

import { Suspense } from "react";
import { useFolderContents } from "@/hooks/useFolderContents";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";

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
              key={folder.id}
              className="text-sm font-medium cursor-pointer hover:underline"
              onClick={() => navigateToFolder(folder.id)}
            >
              📁 {folder.name}
            </li>
          ))}
          {data.documents.map((document) => (
            <li key={document.id} className="text-sm">
              📄 {document.name}
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
