const API_URL = import.meta.env.VITE_API_URL;

export const request = async (endpoint, method = "GET", body = null) => {
  let accessToken = localStorage.getItem("accessToken");
  const options = {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  if (body) {
    if (!(body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    } else {
      options.body = body;
    }
  }

  const getSafeJson = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (e) {
      return { message: text || "Erreur inconnue" };
    }
  };

  let response = await fetch(`${API_URL}${endpoint}`, options);
  let data = await getSafeJson(response);

  if (!response.ok && data.code === "TOKEN_EXPIRED") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await getSafeJson(refreshResponse);
        localStorage.setItem("accessToken", refreshData.accessToken);
        options.headers["Authorization"] = `Bearer ${refreshData.accessToken}`;

        response = await fetch(`${API_URL}${endpoint}`, options);
        data = await getSafeJson(response);
      } else {
        handleLogout();
      }
    }
  }

  if (!response.ok) {
    const error = new Error(data.message || "Erreur serveur");
    error.response = data;
    throw error;
  }

  return data;
};

/**
 * Handles logout behavior.
 */
const handleLogout = () => {
  localStorage.clear();
  window.location.href = "/login";
};
