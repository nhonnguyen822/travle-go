import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useWebSocket = (onNotificationReceived, options = {}) => {
    const {
        enabled = true,
        autoReconnect = true,
        maxReconnectAttempts = 5
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [lastActivity, setLastActivity] = useState(null);
    const [messageHistory, setMessageHistory] = useState([]);
    const clientRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isConnectingRef = useRef(false);

    // Dùng ref để lưu callback
    const onNotificationReceivedRef = useRef(onNotificationReceived);

    useEffect(() => {
        onNotificationReceivedRef.current = onNotificationReceived;
    }, [onNotificationReceived]);


    const getUserInfo = useCallback(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role
                };
            }
        } catch (error) {
            console.error('Error getting customer info:', error);
        }
        return null;
    }, []);

    const connect = useCallback(() => {
        if (!enabled) {
            console.log('⏸️ WebSocket disabled');
            return;
        }

        if (clientRef.current?.connected) {
            console.log('⚠️ WebSocket already connected');
            return;
        }

        if (isConnectingRef.current) {
            console.log('⚠️ WebSocket already connecting');
            return;
        }

        try {
            console.log('🔄 Initializing WebSocket connection...');
            isConnectingRef.current = true;
            setConnectionStatus('connecting');

            const userInfo = getUserInfo();
            console.log('🔐 User info:', userInfo);

            const client = new Client({
                webSocketFactory: () => {
                    console.log('🔌 Creating SockJS connection to: http://localhost:8080/ws');
                    return new SockJS('http://localhost:8080/ws');
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

                // ✅ THÊM HEADERS để debug
                connectHeaders: userInfo ? {
                    'userId': userInfo.id?.toString(),
                    'userRole': userInfo.role,
                    'X-Client-Type': 'react-admin'
                } : {
                    'X-Client-Type': 'react-admin'
                },

                // ✅ BẬT DEBUG MODE
                debug: function (str) {
                    console.log('🐛 STOMP Debug:', str);
                },

                onConnect: (frame) => {
                    console.log('🎯 WebSocket Connected successfully!', {
                        command: frame.command,
                        headers: frame.headers
                    });
                    setIsConnected(true);
                    setConnectionStatus('connected');
                    reconnectAttemptsRef.current = 0;
                    isConnectingRef.current = false;
                    setLastActivity(new Date());

                    // ✅ THÊM MESSAGE VÀO HISTORY
                    setMessageHistory(prev => [...prev, {
                        type: 'CONNECT',
                        timestamp: new Date(),
                        message: 'Connected to WebSocket'
                    }]);

                    setTimeout(() => {
                        try {
                            // ✅ SUBSCRIBE ADMIN NOTIFICATIONS
                            const adminSub = client.subscribe('/topic/admin/notifications', (message) => {
                                console.log('📨 Raw admin message:', message);
                                setLastActivity(new Date());

                                try {
                                    const notification = JSON.parse(message.body);
                                    console.log('📨 Received admin notification:', notification);

                                    // Lưu lịch sử
                                    setMessageHistory(prev => [...prev, {
                                        type: 'ADMIN_MESSAGE',
                                        timestamp: new Date(),
                                        message: notification
                                    }]);

                                    if (onNotificationReceivedRef.current) {
                                        onNotificationReceivedRef.current(notification);
                                    }

                                    console.log("✅ Nhận thông báo admin thành công");
                                } catch (error) {
                                    console.error('❌ Error parsing admin notification:', error);
                                }
                            });

                            console.log('✅ Subscribed to /topic/admin/notifications');

                            if (userInfo && userInfo.id) {
                                const userDestination = `/user/queue/notifications`;

                                const userSub = client.subscribe(userDestination, (message) => {
                                    console.log('📨 Raw customer message:', message);
                                    setLastActivity(new Date());

                                    try {
                                        const notification = JSON.parse(message.body);
                                        console.log('📨 Received customer notification:', notification);

                                        setMessageHistory(prev => [...prev, {
                                            type: 'USER_MESSAGE',
                                            timestamp: new Date(),
                                            message: notification
                                        }]);

                                        if (onNotificationReceivedRef.current) {
                                            onNotificationReceivedRef.current(notification);
                                        }
                                    } catch (error) {
                                        console.error('❌ Error parsing customer notification:', error);
                                    }
                                });

                                console.log("✅ Subscribed to /customer/queue/notifications");
                            }

                            console.log('🎉 All subscriptions completed!');

                        } catch (subscriptionError) {
                            console.error('💥 Subscription failed:', subscriptionError);
                        }
                    }, 1000);
                },

                onDisconnect: () => {
                    console.log('🔴 WebSocket Disconnected');
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    isConnectingRef.current = false;

                    // ✅ THÊM VÀO HISTORY
                    setMessageHistory(prev => [...prev, {
                        type: 'DISCONNECT',
                        timestamp: new Date(),
                        message: 'Disconnected from WebSocket'
                    }]);
                },

                onStompError: (frame) => {
                    const errorMessage = frame?.headers?.message || frame?.body || 'Unknown STOMP error';
                    console.error('💥 STOMP Error:', errorMessage);
                    console.error('💥 STOMP Error Details:', frame);

                    setConnectionStatus('error');
                    isConnectingRef.current = false;

                    // ✅ THÊM VÀO HISTORY
                    setMessageHistory(prev => [...prev, {
                        type: 'ERROR',
                        timestamp: new Date(),
                        message: `STOMP Error: ${errorMessage}`
                    }]);

                    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectAttemptsRef.current++;
                        console.log(`🔄 Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
                    }
                },

                onWebSocketError: (error) => {
                    console.error('💥 WebSocket Error:', error);
                    setConnectionStatus('error');
                    isConnectingRef.current = false;

                    // ✅ THÊM VÀO HISTORY
                    setMessageHistory(prev => [...prev, {
                        type: 'ERROR',
                        timestamp: new Date(),
                        message: `WebSocket Error: ${error.message}`
                    }]);

                    if (autoReconnect) {
                        reconnectAttemptsRef.current++;
                        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                            console.log('🛑 Max reconnection attempts reached');
                        }
                    }
                },

                onWebSocketClose: (event) => {
                    console.log('🔌 WebSocket Closed:', {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    });
                    setConnectionStatus('closed');
                    isConnectingRef.current = false;

                    // ✅ THÊM VÀO HISTORY
                    setMessageHistory(prev => [...prev, {
                        type: 'CLOSED',
                        timestamp: new Date(),
                        message: `WebSocket Closed: ${event.code} - ${event.reason}`
                    }]);
                }
            });

            clientRef.current = client;
            console.log('🚀 Activating WebSocket client...');
            client.activate();

        } catch (error) {
            console.error('💥 Failed to initialize WebSocket:', error);
            isConnectingRef.current = false;
            setConnectionStatus('error');

            // ✅ THÊM VÀO HISTORY
            setMessageHistory(prev => [...prev, {
                type: 'ERROR',
                timestamp: new Date(),
                message: `Initialization Error: ${error.message}`
            }]);
        }
    }, [enabled, autoReconnect, maxReconnectAttempts, getUserInfo]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            console.log('🧹 WebSocket manually disconnecting...');
            clientRef.current.deactivate();
            clientRef.current = null;
            setIsConnected(false);
            setConnectionStatus('disconnected');
            isConnectingRef.current = false;
            reconnectAttemptsRef.current = 0;
        }
    }, []);

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && clientRef.current.connected) {
            try {
                console.log('📤 Sending message to:', destination, body);
                clientRef.current.publish({
                    destination,
                    body: JSON.stringify(body)
                });
                setLastActivity(new Date());

                // ✅ THÊM VÀO HISTORY
                setMessageHistory(prev => [...prev, {
                    type: 'SENT_MESSAGE',
                    timestamp: new Date(),
                    message: { destination, body }
                }]);

                return true;
            } catch (error) {
                console.error('❌ Error sending message:', error);
                return false;
            }
        }
        console.warn('⚠️ Cannot send message - WebSocket not connected');
        return false;
    }, []);


    // Effect chính
    useEffect(() => {
        console.log('🔧 WebSocket Effect - Enabled:', enabled);

        if (enabled) {
            console.log('🚀 Setting up WebSocket...');
            connect();
        } else {
            console.log('⏸️ Disabling WebSocket...');
            disconnect();
        }

        return () => {
            console.log('🧹 Cleaning up WebSocket...');
            disconnect();
        };
    }, [enabled, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        sendMessage,
        reconnect: connect,
        disconnect,
        lastActivity,
        reconnectAttempts: reconnectAttemptsRef.current,
        messageHistory,
        clearMessageHistory: () => setMessageHistory([])
    };
};