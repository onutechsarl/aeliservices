import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the providers workflow.
 */
export const useProviders = () => {
  return useQuery({
    queryKey: ["useProviders"],
    queryFn: () => request("/api/providers", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the provider applications workflow.
 */
export const useProviderApplications = () => {
  return useQuery({
    queryKey: ["useProviderApplications"],
    queryFn: () => request("/api/admin/provider-applications", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the provider applications detail workflow.
 */
export const useProviderApplicationsDetail = (id) => {
  return useQuery({
    queryKey: ["useProviderApplicationsDetail", id],
    queryFn: () => request(`/api/admin/provider-applications/${id}`, "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the provider pending workflow.
 */
export const useProviderPending = () => {
  return useQuery({
    queryKey: ["useProviderApplicationsDetail"],
    queryFn: () => request("/api/admin/providers/under-review", "GET"),
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook that manages the providers creation workflow.
 */
export const useProvidersCreation = () => {
  return useMutation({
    mutationKey: ["useProvidersCreation"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/provider-applications/${id}/review`, "PUT", formData),
  });
};

/**
 * Custom hook that manages the review provider documents workflow.
 */
export const useReviewProviderDocuments = () => {
  return useMutation({
    mutationKey: ["useReviewProviderDocuments"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/providers/${id}/review-documents`, "PUT", formData),
  });
};

/**
 * Custom hook that manages the deactivate account provider workflow.
 */
export const useDeactivateAccountProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["useDeactivateAccountProvider"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/providers/${id}/status`, "PUT", formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["useGetProviderList"] });
      queryClient.invalidateQueries({ queryKey: ["useProviderApplications"] });
    },
  });
};

/**
 * Custom hook that manages the get provider list workflow.
 */
export const useGetProviderList = (params = {}) => {
  const queryString = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== ""),
    ),
  ).toString();

  return useQuery({
    queryKey: ["useGetProviderList", params],
    queryFn: () => request(`/api/admin/providers?${queryString}`, "GET"),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
