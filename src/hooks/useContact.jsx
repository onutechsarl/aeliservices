import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages contact.
 */
export const useContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useContact"],
        mutationFn: (formData) => request("/api/contacts", "POST", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetContactSend"] });
        },
    });
};

/**
 * Custom hook that manages get stat daily.
 */
export const useGetStatDaily = () => {
    return useQuery({
        queryKey: ["useGetStatDaily"],
        queryFn: () => request(`/api/contacts/stats/daily`, "GET"),
    });
};

/**
 * Custom hook that manages get contact send.
 */
export const useGetContactSend = () => {
    return useQuery({
        queryKey: ["useGetContactSend"],
        queryFn: () => request(`/api/contacts/sent`, "GET"),
    });
};

/**
 * Custom hook that manages get received contact.
 */
export const useGetReceivedContact = () => {
    return useQuery({
        queryKey: ["useGetReceivedContact"],
        queryFn: () => request(`/api/contacts/received`, "GET"),
    });
};

/**
 * Custom hook that manages update status message.
 */
export const useUpdateStatusMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useUpdateStatusMessage"],
        mutationFn: ({ id, formData }) => request(`/api/contacts/${id}/status`, "PUT", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetReceivedContact"] });
        },
    });
};

/**
 * Custom hook that manages unlock message.
 */
export const useUnlockMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useUnlockMessage"],
        mutationFn: ({ id, formData }) => request(`/api/contacts/${id}/unlock`, "POST", formData),
    });
};
