// src/services/contactService.js
import api from "../context/api";
import axios from "axios";

export const contactService = {
    // Tạo liên hệ mới
    createContact: async (contactData) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/contacts`, contactData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy danh sách liên hệ (admin)
    getAllContacts: async (params = {}) => {
        try {
            const response = await api.get('/admin/contacts', { params });
            console.log(response.data)
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Tìm kiếm liên hệ
    searchContacts: async (searchParams) => {
        try {
            const response = await api.get('/admin/contacts/search', {
                params: searchParams
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy chi tiết liên hệ
    getContactById: async (id) => {
        try {
            const response = await api.get(`/admin/contacts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Cập nhật trạng thái liên hệ
    updateContactStatus: async (id, status) => {
        try {
            const response = await api.patch(`/admin/contacts/${id}/status`, null, {
                params: { status }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Xóa liên hệ
    deleteContact: async (id) => {
        try {
            await api.delete(`/admin/contacts/${id}`);
            return true;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lấy thống kê liên hệ
    getContactStats: async () => {
        try {
            const response = await api.get('/admin/contacts/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};