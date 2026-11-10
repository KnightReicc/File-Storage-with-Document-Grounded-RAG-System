"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/useDocument";
import { useDocumentUrl } from "@/hooks/useDocumentUrl";
import { useDownloadDocument } from "@/hooks/useDownloadDocument";

type PreviewKind = "frame" | "image";

// Allowlist: anything not listed (Office files, text/html, ...) gets the "download instead" fallback.
function getPreviewKind(mimeType: string): PreviewKind | null {
  if (mimeType === "application/pdf" || mimeType === "text/plain") return "frame";
  if (mimeType.startsWith("image/")) return "image";
  return null;
}

function DocumentViewer({ id }: { id: number }) {
  const documentQuery = useDocument(id);
  const download = useDownloadDocument();

  const kind = documentQuery.data ? getPreviewKind(documentQuery.data.mime_type) : null;
  const urlQuery = useDocumentUrl(id, kind !== null);

  if (documentQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (documentQuery.isError) {
    return <p className="text-sm text-destructive">{documentQuery.error.message}</p>;
  }

  const doc = documentQuery.data;
  const backHref = doc.folder_id !== null ? `/?folder_id=${doc.folder_id}` : "/";

  return (
    <div className="flex h-full min-h-120 flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to files
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{doc.name}</h1>
        <Button size="sm" className="gap-2" disabled={download.isPending} onClick={() => download.mutate(id)}>
          <Download className="h-4 w-4" />
          {download.isPending ? "Preparing..." : "Download"}
        </Button>
      </div>

      {download.isError && <p className="text-sm text-destructive">{download.error.message}</p>}

      {kind === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-10 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preview isn&apos;t available for this file type.</p>
          <p className="text-xs text-muted-foreground">Use Download to open it on your computer.</p>
        </div>
      ) : urlQuery.isError ? (
        <p className="text-sm text-destructive">{urlQuery.error.message}</p>
      ) : !urlQuery.data ? (
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      ) : kind === "image" ? (
        <div className="flex flex-1 items-center justify-center overflow-auto rounded-md border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlQuery.data.url} alt={doc.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <iframe src={urlQuery.data.url} title={doc.name} className="w-full flex-1 rounded-md border" />
      )}
    </div>
  );
}

export default function DocumentViewerPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <p className="text-sm text-muted-foreground">Document not found.</p>;
  }

  return <DocumentViewer id={id} />;
}
