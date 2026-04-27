import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the get users workflow.
 */
export const useGetUsers = () => {
  return useQuery({
    queryKey: ["useGetUsers"],
    queryFn: () => request("/api/admin/users", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the deactivate account workflow.
 */
export const useDeactivateAccount = () => {
  return useMutation({
    mutationKey: ["useDeactivateAccount"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/users/${id}/status`, "PUT", formData),
  });
};
