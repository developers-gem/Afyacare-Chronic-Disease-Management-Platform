import axios from "axios";

const api = axios.create({ baseURL: "/api" });

function getTokens() {
  return {
    accessToken: localStorage.getItem("afya_access"),
    refreshToken: localStorage.getItem("afya_refresh"),
  };
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem("afya_access", accessToken);
  if (refreshToken) localStorage.setItem("afya_refresh", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("afya_access");
  localStorage.removeItem("afya_refresh");
  localStorage.removeItem("afya_user");
}

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post("/api/auth/refresh", { refreshToken });
        setTokens({ accessToken: data.accessToken });
        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        clearTokens();
        window.location.href = "/auth";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
