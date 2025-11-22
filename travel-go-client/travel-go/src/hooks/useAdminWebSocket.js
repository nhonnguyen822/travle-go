import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useAdminWebSocket = (onNotificationReceived, options = {}) => {
    const {
        enabled = true,
        autoReconnect = true,
        maxReconnectAttempts = 5,
        debug = true
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [lastActivity, setLastActivity] = useState(null);
    const [messageHistory, setMessageHistory] = useState([]);
    const clientRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isConnectingRef = useRef(false);
    const onNotificationReceivedRef = useRef(onNotificationReceived);

    useEffect(() => {
        onNotificationReceivedRef.current = onNotificationReceived;
    }, [onNotificationReceived]);

    const connect = useCallback(() => {
        if (!enabled) {
            console.log('⏸️ Admin WebSocket disabled');
            return;
        }

        if (clientRef.current?.connected || isConnectingRef.current) {
            console.log('⚠️ Admin WebSocket already connected/connecting');
            return;
        }

        try {
            console.log('🔄 Initializing ADMIN WebSocket connection...');
            isConnectingRef.current = true;
            setConnectionStatus('connecting');

            const client = new Client({
                webSocketFactory: () => {
                    console.log('🔌 Creating ADMIN SockJS connection');
                    return new SockJS('http://localhost:8080/ws');
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

                // ✅ ADMIN-SPECIFIC HEADERS
                connectHeaders: {
                    'X-Client-Type': 'react-admin',
                    'X-User-Role': 'ADMIN'
                },

                debug: debug ? (str) => console.log('🐛 ADMIN STOMP:', str) : undefined,

                onConnect: (frame) => {
                    console.log('🎯 ADMIN WebSocket Connected!', {
                        command: frame.command,
                        headers: frame.headers
                    });

                    setIsConnected(true);
                    setConnectionStatus('connected');
                    reconnectAttemptsRef.current = 0;
                    isConnectingRef.current = false;
                    setLastActivity(new Date());

                    // ✅ CHỈ SUBSCRIBE ADMIN TOPICS
                    setTimeout(() => {
                        try {
                            // 1. Admin notifications
                            const adminNotificationsSub = client.subscribe(
                                '/topic/admin/notifications',
                                (message) => {
                                    handleAdminMessage(message, 'ADMIN_NOTIFICATIONS');
                                }
                            );

                            // 2. Admin statistics
                            const adminStatsSub = client.subscribe(
                                '/topic/admin/statistics',
                                (message) => {
                                    handleAdminMessage(message, 'ADMIN_STATISTICS');
                                }
                            );

                            // 3. Admin alerts
                            const adminAlertsSub = client.subscribe(
                                '/topic/admin/alerts',
                                (message) => {
                                    handleAdminMessage(message, 'ADMIN_ALERTS');
                                }
                            );

                            // 4. Admin broadcasts
                            const adminBroadcastsSub = client.subscribe(
                                '/topic/admin/broadcasts',
                                (message) => {
                                    handleAdminMessage(message, 'ADMIN_BROADCASTS');
                                }
                            );

                            console.log('👑 Admin subscriptions completed:', {
                                notifications: !!adminNotificationsSub,
                                statistics: !!adminStatsSub,
                                alerts: !!adminAlertsSub,
                                broadcasts: !!adminBroadcastsSub
                            });

                        } catch (subscriptionError) {
                            console.error('💥 Admin subscription failed:', subscriptionError);
                        }
                    }, 500);

                    // ✅ LƯU LỊCH SỬ KẾT NỐI
                    setMessageHistory(prev => [...prev, {
                        type: 'ADMIN_CONNECT',
                        timestamp: new Date(),
                        message: 'Admin WebSocket connected'
                    }]);
                },

                onDisconnect: () => {
                    console.log('🔴 ADMIN WebSocket Disconnected');
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    isConnectingRef.current = false;

                    setMessageHistory(prev => [...prev, {
                        type: 'ADMIN_DISCONNECT',
                        timestamp: new Date(),
                        message: 'Admin WebSocket disconnected'
                    }]);
                },

                onStompError: (frame) => {
                    const errorMessage = frame?.headers?.message || 'Admin STOMP error';
                    console.error('💥 ADMIN STOMP Error:', errorMessage);
                    setConnectionStatus('error');
                    isConnectingRef.current = false;

                    setMessageHistory(prev => [...prev, {
                        type: 'ADMIN_ERROR',
                        timestamp: new Date(),
                        message: `STOMP Error: ${errorMessage}`
                    }]);

                    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectAttemptsRef.current++;
                        console.log(`🔄 Admin reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
                    }
                },

                onWebSocketError: (error) => {
                    console.error('💥 ADMIN WebSocket Error:', error);
                    setConnectionStatus('error');
                    isConnectingRef.current = false;

                    setMessageHistory(prev => [...prev, {
                        type: 'ADMIN_ERROR',
                        timestamp: new Date(),
                        message: `WebSocket Error: ${error.message}`
                    }]);
                }
            });

            clientRef.current = client;
            client.activate();

        } catch (error) {
            console.error('💥 Failed to initialize ADMIN WebSocket:', error);
            isConnectingRef.current = false;
            setConnectionStatus('error');
        }
    }, [enabled, autoReconnect, maxReconnectAttempts, debug]);

    // ✅ XỬ LÝ MESSAGE CHO ADMIN
    const handleAdminMessage = useCallback((message, topicType) => {
        console.log(`📨 Raw admin message from ${topicType}:`, message);
        setLastActivity(new Date());

        try {
            const notification = JSON.parse(message.body);
            console.log(`📨 Received admin ${topicType}:`, notification);

            // Lưu lịch sử với topic type
            setMessageHistory(prev => [...prev, {
                type: `ADMIN_${topicType}`,
                timestamp: new Date(),
                message: notification,
                topic: topicType
            }]);

            // Gọi callback với thông tin topic
            if (onNotificationReceivedRef.current) {
                onNotificationReceivedRef.current({
                    ...notification,
                    _metadata: {
                        source: 'admin',
                        topicType: topicType,
                        receivedAt: new Date().toISOString()
                    }
                });
            }

            console.log(`✅ Nhận ${topicType} thành công`);

        } catch (error) {
            console.error(`❌ Error parsing admin ${topicType}:`, error);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            console.log('🧹 ADMIN WebSocket manually disconnecting...');
            clientRef.current.deactivate();
            clientRef.current = null;
            setIsConnected(false);
            setConnectionStatus('disconnected');
            isConnectingRef.current = false;
            reconnectAttemptsRef.current = 0;
        }
    }, []);

    // ✅ ADMIN-SPECIFIC SEND METHODS
    const sendAdminBroadcast = useCallback((message) => {
        if (clientRef.current && clientRef.current.connected) {
            try {
                console.log('📤 Admin sending broadcast:', message);
                clientRef.current.publish({
                    destination: '/app/admin/broadcast',
                    body: JSON.stringify({
                        ...message,
                        sentBy: 'admin',
                        timestamp: new Date().toISOString()
                    })
                });
                setLastActivity(new Date());

                setMessageHistory(prev => [...prev, {
                    type: 'ADMIN_SENT_BROADCAST',
                    timestamp: new Date(),
                    message: message
                }]);

                return true;
            } catch (error) {
                console.error('❌ Error sending admin broadcast:', error);
                return false;
            }
        }
        return false;
    }, []);

    const sendAdminAlert = useCallback((alert) => {
        if (clientRef.current && clientRef.current.connected) {
            try {
                console.log('📤 Admin sending alert:', alert);
                clientRef.current.publish({
                    destination: '/app/admin/alert',
                    body: JSON.stringify(alert)
                });
                setLastActivity(new Date());

                setMessageHistory(prev => [...prev, {
                    type: 'ADMIN_SENT_ALERT',
                    timestamp: new Date(),
                    message: alert
                }]);

                return true;
            } catch (error) {
                console.error('❌ Error sending admin alert:', error);
                return false;
            }
        }
        return false;
    }, []);

    // Effect chính
    useEffect(() => {
        if (enabled) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [enabled, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        sendAdminBroadcast,
        sendAdminAlert,
        reconnect: connect,
        disconnect,
        lastActivity,
        reconnectAttempts: reconnectAttemptsRef.current,
        messageHistory,
        clearMessageHistory: () => setMessageHistory([]),
        isAdmin: true // ✅ XÁC ĐỊNH RÕ ĐÂY LÀ ADMIN HOOK
    };
};