import { useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

// Liste complète des bannières
export const useGetBanners = () => {
    return useQuery({
        queryKey: ["useGetBanners"],
        queryFn: () => request("/api/banners", "GET"),
        refetchOnWindowFocus: false,
    });
};