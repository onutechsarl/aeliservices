import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the get users workflow.
 */
export const useGetUsers = (page, status) => {
  return useQuery({
    queryKey: ["useGetUsers", page, status],
    queryFn: () => {
      let url = `/api/admin/users?page=${page}`;
      if (status && status !== "Tout") {
        const statusValue = status === "Actifs" ? "active" : "inactive";
        url += `&status=${statusValue}`;
      }
      return request(url, "GET");
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
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
