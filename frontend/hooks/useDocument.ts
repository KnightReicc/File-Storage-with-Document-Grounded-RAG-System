import { getDocument } from "@/lib/api/documents";
import { useQuery } from "@tanstack/react-query";

export function useDocument(id: number) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
  });
}
