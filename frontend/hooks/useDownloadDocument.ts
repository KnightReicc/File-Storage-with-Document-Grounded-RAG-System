import { getDownloadUrl } from "@/lib/api/documents";
import { useMutation } from "@tanstack/react-query";

export function useDownloadDocument() {
  return useMutation({
    mutationFn: (id: number) => getDownloadUrl(id, "attachment"),
    onSuccess: (data) => window.location.assign(data.url),
  });
}
