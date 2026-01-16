// service/ChatAPI.js - CLEANED VERSION
import api from "../context/api";

class ChatAPI {
    // ========== CUSTOMER METHODS ==========
    async startOrGetChat() {
        try {
            console.log('📞 Calling /api/chat/start-or-get');
            const response = await api.post('/chat/start-or-get');
            console.log('✅ startOrGetChat response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error starting/loading chat:', error);
            console.error('Error response:', error.response?.data);
            throw error;
        }
    }

    async getCustomerMessages(roomId) {
        try {
            console.log(`📞 Calling /chat/customer/messages/${roomId}`);
            const response = await api.get(`/chat/customer/messages/${roomId}`);
            return response;
        } catch (error) {
            console.error('❌ Error fetching customer messages:', error);
            throw error;
        }
    }

    // ========== ADMIN METHODS ==========
    async getAllRooms() {
        try {
            console.log('📞 Calling /chat/admin/rooms');
            const response = await api.get('chat/admin/rooms');
            console.log('✅ getAllRooms response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ Error fetching all rooms:', error);
            throw error;
        }
    }

    async getMyRooms() {
        try {
            console.log('📞 Calling /chat/admin/my-rooms');
            const response = await api.get('/chat/admin/my-rooms');
            console.log('✅ getMyRooms response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ Error fetching my rooms:', error);
            throw error;
        }
    }

    async getAdminMessages(roomId) {
        try {
            console.log(`📞 Calling /chat/admin/messages/${roomId}`);
            const response = await api.get(`/chat/admin/messages/${roomId}`);
            console.log('✅ getAdminMessages response:', response.data);
            return response;
        } catch (error) {
            console.error('❌ Error fetching admin messages:', error);
            throw error;
        }
    }

    // ========== COMMON METHODS ==========
    async sendMessage(content) {
        try {
            const response = await api.post('/chat/send', { content });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async markAsRead(roomId) {
        try {
            await api.post(`/chat/${roomId}/read`);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }


}

export default new ChatAPI();