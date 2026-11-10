import { getDownloadUrl } from "@/lib/api/documents";
import { useQuery } from "@tanstack/react-query";

export function useDocumentUrl(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ["documents", id, "url"],
    queryFn: () => getDownloadUrl(id, "inline"),
    // 30 min: half of the backend's 60-min URL expiry (settings.minio_url_expiration),
    // so a cached URL always has at least 30 min left. Keep these two in sync.
    staleTime: 30 * 60 * 1000,
    enabled,
  });
}
