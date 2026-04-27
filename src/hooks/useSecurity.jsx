import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * List of currently banned IPs.
 */
export const useGetIpBanned = () => {
    return useQuery({
        queryKey: ["useGetIpBanned"],
        queryFn: () => request("/api/admin/banned-ips", "GET"),
        refetchOnWindowFocus: false,
    });
};

/**
 * Ban an IP address
 */
export const useBanIps = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useBanIps"],
        mutationFn: (formData) => request("/api/admin/banned-ips", "POST", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetIpBanned"] });
        },
    });
};

/**
 * Unban an IP address
 */
export const useUnBanIps = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useUnBanIps"],
        mutationFn: (id) => request(`/api/admin/banned-ips/${id}`, "DELETE"),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetIpBanned"] });
        },
    });
};