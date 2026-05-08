const API_URL = import.meta.env.VITE_API_URL;

/**
 * Handles request behavior.
 */
export const request = async (endpoint, method = "GET", body = null) => {
    let accessToken = localStorage.getItem('accessTokenAeliServices');

    const publicAuthEndpoints = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/verify-otp",
        "/api/auth/resend-otp",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
    ];

    const isPublicAuthEndpoint = publicAuthEndpoints.some((publicEndpoint) =>
        endpoint.startsWith(publicEndpoint)
    );

    if (!accessToken && !isPublicAuthEndpoint) {
        handleLogout();
        return;
    }

    const options = {
        method,
        headers: {},
    };

    if (accessToken) {
        options.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (body) {
        if (body instanceof FormData) {

            options.body = body;
        } else {

            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }
    }

    let response = await fetch(`${API_URL}${endpoint}`, options);
    let data = await response.json();

    if (!response.ok && data.code === "TOKEN_EXPIRED") {
        const refreshToken = localStorage.getItem('refreshTokenAeliServices');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken })
                });
                const refreshData = await refreshResponse.json();

                if (refreshResponse.ok) {
                    localStorage.setItem('accessTokenAeliServices', refreshData.accessToken);
                    options.headers["Authorization"] = `Bearer ${refreshData.accessToken}`;

                    response = await fetch(`${API_URL}${endpoint}`, options);
                    data = await response.json();
                } else {
                    handleLogout();
                }
            } catch (err) {
                handleLogout();
            }
        } else {
            handleLogout();
        }
    }

    if (!response.ok) {
        const error = new Error(data.message || "Une erreur est survenue");
        error.response = data;
        throw error;
    }

    return data;
};

/**
 * Handles handle logout behavior.
 */
const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
};
