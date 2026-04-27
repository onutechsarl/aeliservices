import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the get banners workflow.
 */
export const useGetBanners = () => {
  return useQuery({
    queryKey: ["useGetBanners"],
    queryFn: () => request("/api/admin/banners/admin", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the get public banners workflow.
 */
export const useGetPublicBanners = () => {
  return useQuery({
    queryKey: ["useGetPublicBanners"],
    queryFn: () => request("/api/banners", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the create banner workflow.
 */
export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["useCreateBanner"],
    mutationFn: (formData) => request("/api/admin/banners", "POST", formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["useGetBanners"] });
      queryClient.invalidateQueries({ queryKey: ["useGetPublicBanners"] });
    },
  });
};

/**
 * Custom hook that manages the update banner workflow.
 */
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["useUpdateBanner"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/banners/${id}`, "PUT", formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["useGetBanners"] });
      queryClient.invalidateQueries({ queryKey: ["useGetPublicBanners"] });
    },
  });
};

/**
 * Custom hook that manages the delete banner workflow.
 */
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["useDeleteBanner"],
    mutationFn: ({ id }) => request(`/api/admin/banners/${id}`, "DELETE"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["useGetBanners"] });
      queryClient.invalidateQueries({ queryKey: ["useGetPublicBanners"] });
    },
  });
};
