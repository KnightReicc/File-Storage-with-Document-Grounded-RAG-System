import { FolderContentsResponse, SortBy, SortOrder, FolderCreate, RenameRequest, FolderResponse } from "../types";
import { apiFetch } from "./client";

export interface GetFolderContentsArgs {
  folder_id?: number;
  search?: string;
  sort_by?: SortBy;
  sort_order?: SortOrder;
}

// Get the folder contents
export async function getFolderContents(args: GetFolderContentsArgs = {}): Promise<FolderContentsResponse> {
  const searchParams = new URLSearchParams();

  // Loop through the arguments, safely append the valid and defined query strings
  Object.entries(args).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const path = queryString ? `/folders/contents?${queryString}` : "/folders/contents";

  return apiFetch<FolderContentsResponse>(path, { method: "GET" });
}

// Create a folder
export async function createFolder(args: FolderCreate): Promise<FolderResponse> {
  return apiFetch<FolderResponse>("/folders/", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

// Rename a folder
export async function renameFolder(id: number, args: RenameRequest): Promise<FolderResponse> {
  return apiFetch<FolderResponse>(`/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(args),
  });
}

// Delete a folder
export async function deleteFolder(id: number): Promise<null> {
  return apiFetch<null>(`/folders/${id}`, { method: "DELETE" });
}
