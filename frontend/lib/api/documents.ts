import { DocumentResponse, Disposition, DownloadURLResponse, RenameRequest } from "../types";
import { apiFetch } from "./client";

// Must match backend/core/config.py Settings.max_upload_size_mb value
const MAX_UPLOAD_SIZE_MB = 25;

// Upload a document
export async function uploadDocument(file_obj: File, folderId?: number): Promise<DocumentResponse> {
  const formData = new FormData();

  // Enforce file size limit
  if (file_obj.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_SIZE_MB} MB limit.`);
  }

  formData.append("file_obj", file_obj);
  if (folderId !== undefined) {
    formData.append("folder_id", String(folderId));
  }

  return apiFetch<DocumentResponse>("/documents/", { method: "POST", body: formData });
}

// Get download URL based on disposition
export async function getDownloadUrl(id: number, disposition: Disposition): Promise<DownloadURLResponse> {
  const searchParams = new URLSearchParams();

  // Append disposition
  if (disposition) {
    searchParams.append("disposition", disposition);
  }

  return apiFetch<DownloadURLResponse>(`/documents/${id}/download?${searchParams.toString()}`, { method: "GET" });
}

// Rename a document
export async function renameDocument(id: number, args: RenameRequest): Promise<DocumentResponse> {
  return apiFetch<DocumentResponse>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(args) });
}

// Delete a document
export async function deleteDocument(id: number): Promise<null> {
  return apiFetch<null>(`/documents/${id}`, { method: "DELETE" });
}
