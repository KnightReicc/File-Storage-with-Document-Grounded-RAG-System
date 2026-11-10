"use client";

import { Suspense } from "react";
import { useFolderContents } from "@/hooks/useFolderContents";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { ItemActionsMenu } from "@/components/files/item-actions-menu";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const router = useRouter();
  const { currentFolderId, navigateToFolder, navigateBack, search, sortBy, sortOrder } = useFolderNavigation();
  const isSearching = search.length > 0;
  const { data, isPending, isError, error, isPlaceholderData } = useFolderContents({
    folder_id: currentFolderId,
    search: isSearching ? search : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{error.message}</p>;
  }

  return (
    <>
      {currentFolderId !== undefined && !isSearching && (
        <button className="text-sm text-blue-500 hover:underline mb-4 " onClick={() => navigateBack()}>
          Go back
        </button>
      )}
      {isSearching && <p className="text-sm text-muted-foreground mb-4">Results for &quot;{search}&quot;</p>}
      {data.folders.length === 0 && data.documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isSearching ? "No results found." : "This folder is empty."}</p>
      ) : (
        <ul className={`space-y-2 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
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
              className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/50 cursor-pointer"
              onClick={() => router.push(`/files/${document.id}`)}
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
