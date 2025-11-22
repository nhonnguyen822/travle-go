import api from "../context/api";

export const getUserNotifications = async () => {
    try {
        const response = await api.get("/notifications");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const getUnreadCount = async () => {
    try {
        const response = await api.get("/notifications/unread-count");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const markAsRead = async (id) => {
    try {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const markAllAsRead = async () => {
    try {
        const response = await api.put("/notifications/read-all");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

// ✅ THÊM: Tạo notification mới (nếu cần)
export const createNotification = async (notificationData) => {
    try {
        const response = await api.post("/notifications", notificationData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

// ✅ THÊM: Lấy notifications với phân trang (nếu cần)
export const getNotificationsWithPagination = async (page = 0, size = 20) => {
    try {
        const response = await api.get("/notifications", {
            params: {
                page,
                size
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}