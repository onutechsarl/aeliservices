import { useQuery, useMutation } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages get plans.
 */
export const useGetPlans = () => {
    return useQuery({
        queryKey: ["useGetPlans"],
        queryFn: () => request("/api/subscriptions/plans", "GET"),
    });
};

/**
 * Custom hook that manages get abonnement provider.
 */
export const useGetAbonnementProvider = () => {
    return useQuery({
        queryKey: ["useGetAbonnementProvider"],
        queryFn: () => request("/api/subscriptions/my", "GET"),
    });
};

/**
 * Custom hook that manages subscribe.
 */
export const useSubscribe = () => {
    return useMutation({
        mutationKey: ["useSubscribe"],
        mutationFn: (formData) => request("/api/subscriptions/subscribe", "POST", formData),
    });
};
