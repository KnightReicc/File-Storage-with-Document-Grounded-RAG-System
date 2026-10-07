import { register } from "@/lib/api/auth";
import { useMutation } from "@tanstack/react-query";

export function useRegister() {
  return useMutation({
    mutationFn: register,
  });
}
