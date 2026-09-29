export interface FolderResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  parent_folder_id: number | null;
}

export interface FolderContentsResponse {
  folders: FolderResponse[];
  documents: DocumentResponse[];
}

export interface DocumentResponse {
  id: number;
  name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  folder_id: number | null;
}

export interface DownloadURLResponse {
  url: string;
}

export interface FolderCreate {
  name: string;
  parent_folder_id?: number | null;
}

export interface RenameRequest {
  name: string;
}

export type SortBy = "date" | "name" | "size";
export type SortOrder = "asc" | "desc";
export type Disposition = "inline" | "attachment";
