"use client";

import { useState, Suspense } from "react";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { UploadDialog } from "@/components/files/upload-dialog";
import { RagPanel } from "@/components/layout/rag-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { currentFolderId } = useFolderNavigation();
  const [ragOpen, setRagOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="flex h-screen">
      <Sidebar view={view} onViewChange={setView} />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onToggleRagPanel={() => setRagOpen((prev) => !prev)} onOpenUpload={() => setIsUploadOpen(true)} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>

      <UploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} folderId={currentFolderId} />
      {ragOpen && <RagPanel />}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4">Loading application...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
