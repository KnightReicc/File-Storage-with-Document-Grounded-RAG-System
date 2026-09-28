"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { RagPanel } from "@/components/layout/rag-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [ragOpen, setRagOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar view={view} onViewChange={setView} />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onToggleRagPanel={() => setRagOpen((prev) => !prev)} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>

      {ragOpen && <RagPanel />}
    </div>
  );
}
