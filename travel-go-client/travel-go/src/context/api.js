
import axios from "axios";

const api = axios.create({
    baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
    withCredentials: true,
});

let abortController = null;
let isSessionExpired = false; // ✅ flag để chặn request mới

export const cancelAllRequests = () => {
    if (abortController) {
        abortController.abort();
    }
};

// ✅ Hàm bật/tắt trạng thái session expired
export const setSessionExpired = (expired) => {
    isSessionExpired = expired;
};

// request interceptor
api.interceptors.request.use((config) => {
    if (isSessionExpired) {
        // ❌ Nếu session đã hết -> chặn request mới
        return Promise.reject(
            new axios.Cancel("Session expired, request blocked")
        );
    }

    if (!abortController || abortController.signal.aborted) {
        abortController = new AbortController();
    }
    config.signal = abortController.signal;
    return config;
});

export default api;