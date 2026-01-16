import axios from 'axios';
import api from "../context/api";

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const contactAPI = {
    // Get contacts with pagination and filters
    getContacts: async (params = {}) => {
        try {
            const response = await axios.get(`${API_BASE}/admin/contacts`, {
                params,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get single contact
    getContactById: async (id) => {
        try {
            const response = await api.get(`/admin/contacts/${id}`,
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark as responded
    markAsResponded: async (id, data) => {
        console.log(data)
        try {
            const response = await api.patch(`/admin/contacts/${id}/respond`, data,
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Add note
    addNote: async (id, data) => {
        try {
            const response = await api.post(`/admin/contacts/${id}/notes`, data, {

            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getLatestNote: async (id) => {
        try {
            const response = await api.get(`/admin/contacts/${id}/note`);
            return response.data;
        } catch (error) {
            // Nếu không có ghi chú (404), trả về null thay vì throw error
            if (error.response?.status === 404) {
                return { success: true, data: null };
            }
            throw error.response?.data || error;
        }
    },

    // Delete contact
    deleteContact: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE}/admin/contacts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default contactAPI;