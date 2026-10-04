import { uploadDocument } from "@/lib/api/documents";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUploadDocument(folderId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
    },
  });
}
