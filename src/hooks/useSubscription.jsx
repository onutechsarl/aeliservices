import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the payments workflow.
 */
export const usePayments = () => {
  return useQuery({
    queryKey: ["usePayments"],
    queryFn: () => request("/api/admin/payments", "GET"),
    refetchOnWindowFocus: false,
  });
};
