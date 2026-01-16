// service/stompClient.js - UPDATED VERSION
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.connectionCallbacks = [];
        this.heartbeatInterval = null;
    }

    // ========== CONNECTION METHODS ==========
    connect(token, onConnected, onError) {
        console.log('🔌 [STOMP] Connecting WebSocket with token:',
            token ? token.substring(0, 20) + '...' : 'NO TOKEN');

        // Kiểm tra nếu đã kết nối
        if (this.isConnected && this.client?.connected) {
            console.log('✅ [STOMP] Already connected, reusing connection');
            if (onConnected) onConnected();
            return;
        }

        // Clean up existing connection
        if (this.client) {
            this.disconnect();
        }

        // Tạo SockJS connection
        const socketUrl = `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:8080/ws`;
        console.log('🌐 [STOMP] Connecting to:', socketUrl);

        const socket = new SockJS(socketUrl);

        this.client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },
            debug: (str) => {
                if (str.includes('ERROR') || str.includes('error')) {
                    console.error('🔍 [STOMP DEBUG]', str);
                } else {
                    console.log('🔍 [STOMP DEBUG]', str);
                }
            },
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: (frame) => {
                console.log('✅ [STOMP] Connected successfully! Frame:', frame);
                this.isConnected = true;
                this.reconnectAttempts = 0;

                // Gửi heartbeats để giữ kết nối
                this.startHeartbeat();

                if (onConnected) onConnected(frame);

                // Gọi tất cả các callback đã đăng ký
                this.connectionCallbacks.forEach(callback => callback(true));
            },

            onStompError: (frame) => {
                console.error('❌ [STOMP] STOMP Error:', frame);
                this.isConnected = false;
                this.stopHeartbeat();
                if (onError) onError(frame);
            },

            onWebSocketClose: (event) => {
                console.log('🔌 [STOMP] WebSocket closed:', event);
                this.isConnected = false;
                this.stopHeartbeat();
                this.attemptReconnect(token, onConnected, onError);
            },

            onWebSocketError: (error) => {
                console.error('❌ [STOMP] WebSocket Error:', error);
                this.isConnected = false;
                this.stopHeartbeat();
            },

            onDisconnect: (frame) => {
                console.log('🔌 [STOMP] Disconnected:', frame);
                this.isConnected = false;
                this.stopHeartbeat();
            }
        });

        this.client.activate();

        // Thêm timeout cho kết nối
        setTimeout(() => {
            if (!this.isConnected && this.client) {
                console.warn('⚠️ [STOMP] Connection timeout');
                this.client.deactivate();
                this.attemptReconnect(token, onConnected, onError);
            }
        }, 10000);
    }

    startHeartbeat() {
        this.stopHeartbeat(); // Dừng heartbeat cũ nếu có
        this.heartbeatInterval = setInterval(() => {
            if (this.client && this.client.connected) {
                // Gửi heartbeat message đến server
                this.client.publish({
                    destination: '/app/heartbeat',
                    body: JSON.stringify({
                        type: 'heartbeat',
                        timestamp: Date.now()
                    })
                });
                console.log('❤️ [STOMP] Heartbeat sent');
            }
        }, 25000); // 25 giây
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    attemptReconnect(token, onConnected, onError) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 [STOMP] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
                if (this.client) {
                    this.client.deactivate();
                    this.client = null;
                }
                this.connect(token, onConnected, onError);
            }, 3000);
        } else {
            console.error('❌ [STOMP] Max reconnection attempts reached');
            if (onError) onError(new Error('Max reconnection attempts reached'));
        }
    }

    disconnect() {
        console.log('🔌 [STOMP] Disconnecting WebSocket...');

        this.stopHeartbeat();

        if (this.client) {
            // Hủy tất cả subscriptions
            this.subscriptions.forEach((subscription) => {
                try {
                    subscription.unsubscribe();
                } catch (e) {
                    console.warn('Error unsubscribing:', e);
                }
            });
            this.subscriptions.clear();

            // Hủy kết nối
            this.client.deactivate();
            this.client = null;
        }

        this.isConnected = false;
        this.connectionCallbacks = [];
        console.log('✅ [STOMP] WebSocket disconnected');
    }

    // ========== SUBSCRIPTION METHODS ==========
    subscribeToChatRoom(roomId, callback) {
        const destination = `/topic/chat/${roomId}`;
        console.log(`📡 [STOMP] Subscribing to chat room: ${destination}`);
        return this._subscribe(destination, callback);
    }

    subscribeToTyping(roomId, callback) {
        const destination = `/topic/typing/${roomId}`;
        console.log(`📡 [STOMP] Subscribing to typing: ${destination}`);
        return this._subscribe(destination, callback);
    }

    _subscribe(destination, callback) {
        if (!this.client || !this.isConnected) {
            console.error('❌ [STOMP] Cannot subscribe: WebSocket not connected');
            return null;
        }

        // Hủy subscription cũ nếu có
        if (this.subscriptions.has(destination)) {
            this.subscriptions.get(destination).unsubscribe();
            this.subscriptions.delete(destination);
        }

        // Tạo subscription mới
        const subscription = this.client.subscribe(destination, (message) => {
            try {
                console.log(`📥 [STOMP] Received message on ${destination}:`, message.body);
                const data = JSON.parse(message.body);
                if (callback) callback(data);
            } catch (error) {
                console.error('❌ [STOMP] Error parsing WebSocket message:', error);
            }
        });

        this.subscriptions.set(destination, subscription);
        console.log(`✅ [STOMP] Subscribed to ${destination}, ID: ${subscription.id}`);
        return subscription.id;
    }

    unsubscribe(subscriptionId) {
        if (!subscriptionId) return;

        for (const [destination, subscription] of this.subscriptions.entries()) {
            if (subscription.id === subscriptionId) {
                subscription.unsubscribe();
                this.subscriptions.delete(destination);
                console.log(`✅ [STOMP] Unsubscribed: ${destination}`);
                break;
            }
        }
    }

    // ========== SEND METHODS ==========
    sendMessage(roomId, content) {
        console.log('📤 [STOMP] Sending message to room:', roomId, 'Content:', content);

        if (!this.client || !this.isConnected) {
            console.error('❌ [STOMP] Cannot send: WebSocket not connected');
            return false;
        }

        try {
            const destination = `/app/chat.send`;
            const message = {
                roomId: roomId,
                content: content,
                timestamp: Date.now()
            };

            this.client.publish({
                destination: destination,
                body: JSON.stringify(message),
                headers: {
                    'content-type': 'application/json'
                }
            });

            console.log('✅ [STOMP] Message sent successfully to', destination);
            return true;
        } catch (error) {
            console.error('❌ [STOMP] Error sending message:', error);
            return false;
        }
    }

    sendTyping(roomId, isTyping, userName) {
        console.log('⌨️ [STOMP] Sending typing indicator:', { roomId, isTyping, userName });

        if (!this.client || !this.isConnected) {
            console.error('❌ [STOMP] Cannot send typing: WebSocket not connected');
            return false;
        }

        try {
            const destination = `/app/chat.typing`;
            const message = {
                roomId: roomId,
                isTyping: isTyping,
                userName: userName,
                timestamp: Date.now()
            };

            this.client.publish({
                destination: destination,
                body: JSON.stringify(message)
            });

            console.log('✅ [STOMP] Typing indicator sent');
            return true;
        } catch (error) {
            console.error('❌ [STOMP] Error sending typing:', error);
            return false;
        }
    }

    // ========== UTILITY METHODS ==========
    checkConnection() {
        const status = {
            isConnected: this.isConnected,
            clientExists: !!this.client,
            stompConnected: this.client?.connected || false,
            subscriptions: Array.from(this.subscriptions.keys()),
            subscriptionCount: this.subscriptions.size
        };

        console.log('🔍 [STOMP] Connection status:', status);
        return status;
    }

    addConnectionCallback(callback) {
        this.connectionCallbacks.push(callback);
    }

    removeConnectionCallback(callback) {
        this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    }
}

// Export singleton instance
const stompClient = new StompClient();
export default stompClient;