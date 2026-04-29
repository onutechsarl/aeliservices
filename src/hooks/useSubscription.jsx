import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the payments workflow.
 */
export const usePayments = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["usePayments", page, limit],
    queryFn: () => request(`/api/admin/payments?page=${page}&limit=${limit}`, "GET"),
    keepPreviousData: true,
  });
};
