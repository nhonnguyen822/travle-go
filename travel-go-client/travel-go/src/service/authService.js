import axios from "axios";
import api from "../context/api";

const API_URL = "http://localhost:8080/api/auth"; // đổi URL nếu khác

export const register = async (data) => {
    try {
        console.log(data)
        const res = await axios.post(`${API_URL}/register`, data);
        return { ...res.data, success: true };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Đăng ký thất bại"
        };
    }
};

export const login = async (data) => {
    try {
        const resp = await api.post(`${API_URL}/login`, data, {
            withCredentials: true, // Bắt buộc để cookie được lưu
        });

        if (resp.data.success) {
            const me = await api.get(`${API_URL}/me`, {
                withCredentials: true,
            });

            console.log("Thông tin customer:", me.data);
            return me.data;
        } else {
            return { success: false, error: "Đăng nhập thất bại" };
        }
    } catch (error) {
        if (error.response?.status === 401) {
            return { success: false, error: "Email hoặc mật khẩu không đúng" };
        } else if (error.response?.status === 403) {
            if (error.response.data.error === "EMAIL_NOT_VERIFIED") {
                return { success: false, error: "Vui lòng kiểm tra email để xác nhận tài khoản", code: "EMAIL_NOT_VERIFIED" };
            }
            return { success: false, error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên" };

        }
        return { success: false, error: "Lỗi kết nối khi đăng nhập" };
    }
}

export const getCustomerByEmail=async (email)=> {
    try {
        const response = await api.get(`/auth/users/email/${email}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}


export const verifyEmail = async (token) => {
    try {
        const res = await axios.get(`${API_URL}/email-verification?token=${token}`);
        return { ...res.data, success: true };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Xác thực email thất bại"
        };
    }
};

export const getUserByEmail = async (email) => {
    try {
        const response = await api.get(`auth/users/email/${email}`);
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi khi lấy thông tin customer:", error);
        throw error.response?.data || error.message;
    }
};



