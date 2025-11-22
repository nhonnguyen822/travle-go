import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useUserWebSocket = (onNotificationReceived, options = {}) => {
    const {
        enabled = true,
        autoReconnect = true,
        maxReconnectAttempts = 5,
        debug = false
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [lastActivity, setLastActivity] = useState(null);
    const [messageHistory, setMessageHistory] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const clientRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isConnectingRef = useRef(false);
    const onNotificationReceivedRef = useRef(onNotificationReceived);

    useEffect(() => {
        onNotificationReceivedRef.current = onNotificationReceived;
    }, [onNotificationReceived]);

    // Lấy thông tin customer
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserInfo({
                    id: user.id,
                    email: user.email,
                    role: user.role
                });
                if (debug) {
                    console.log('🔐 User info:', user);
                }
            }
        } catch (error) {
            console.error('Error getting customer info:', error);
        }
    }, [debug]);

    const connect = useCallback(() => {
        if (!enabled || !userInfo) {
            console.log('⏸️ User WebSocket disabled or no customer info');
            return;
        }

        if (clientRef.current?.connected || isConnectingRef.current) {
            console.log('⚠️ User WebSocket already connected/connecting');
            return;
        }

        try {
            console.log('🔄 Initializing USER WebSocket connection...');
            isConnectingRef.current = true;
            setConnectionStatus('connecting');

            const client = new Client({
                webSocketFactory: () => {
                    console.log('🔌 Creating USER SockJS connection');
                    return new SockJS('http://localhost:8080/ws');
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

                // ✅ USER-SPECIFIC HEADERS
                connectHeaders: {
                    'userId': userInfo.id?.toString(),
                    'userRole': userInfo.role,
                    'X-Client-Type': 'react-customer'
                },

                debug: debug ? (str) => console.log('🐛 USER STOMP:', str) : undefined,

                onConnect: (frame) => {
                    console.log('🎯 USER WebSocket Connected!', {
                        userId: userInfo.id,
                        command: frame.command
                    });

                    setIsConnected(true);
                    setConnectionStatus('connected');
                    reconnectAttemptsRef.current = 0;
                    isConnectingRef.current = false;
                    setLastActivity(new Date());

                    // ✅ CHỈ SUBSCRIBE USER TOPICS
                    setTimeout(() => {
                        try {
                            // 1. User personal notifications
                            const userNotificationsSub = client.subscribe(
                                `/user/queue/notifications`,
                                (message) => {
                                    handleUserMessage(message, 'USER_PERSONAL');
                                }
                            );

                            // 2. Public announcements
                            const publicAnnouncementsSub = client.subscribe(
                                '/topic/public/announcements',
                                (message) => {
                                    handleUserMessage(message, 'PUBLIC_ANNOUNCEMENTS');
                                }
                            );

                            // 3. Tour updates
                            const tourUpdatesSub = client.subscribe(
                                '/topic/public/tour-updates',
                                (message) => {
                                    handleUserMessage(message, 'TOUR_UPDATES');
                                }
                            );

                            console.log('👤 User subscriptions completed:', {
                                personal: !!userNotificationsSub,
                                announcements: !!publicAnnouncementsSub,
                                tourUpdates: !!tourUpdatesSub
                            });

                        } catch (subscriptionError) {
                            console.error('💥 User subscription failed:', subscriptionError);
                        }
                    }, 500);

                    setMessageHistory(prev => [...prev, {
                        type: 'USER_CONNECT',
                        timestamp: new Date(),
                        message: `User ${userInfo.email} connected`
                    }]);
                },

                onDisconnect: () => {
                    console.log('🔴 USER WebSocket Disconnected');
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    isConnectingRef.current = false;

                    setMessageHistory(prev => [...prev, {
                        type: 'USER_DISCONNECT',
                        timestamp: new Date(),
                        message: 'User WebSocket disconnected'
                    }]);
                },

                onStompError: (frame) => {
                    const errorMessage = frame?.headers?.message || 'User STOMP error';
                    console.error('💥 USER STOMP Error:', errorMessage);
                    setConnectionStatus('error');
                    isConnectingRef.current = false;

                    setMessageHistory(prev => [...prev, {
                        type: 'USER_ERROR',
                        timestamp: new Date(),
                        message: `STOMP Error: ${errorMessage}`
                    }]);
                }
            });

            clientRef.current = client;
            client.activate();

        } catch (error) {
            console.error('💥 Failed to initialize USER WebSocket:', error);
            isConnectingRef.current = false;
            setConnectionStatus('error');
        }
    }, [enabled, autoReconnect, maxReconnectAttempts, debug, userInfo]);

    // ✅ XỬ LÝ MESSAGE CHO USER
    const handleUserMessage = useCallback((message, messageType) => {
        console.log(`📨 Raw user message (${messageType}):`, message);
        setLastActivity(new Date());

        try {
            const notification = JSON.parse(message.body);
            console.log(`📨 Received user ${messageType}:`, notification);

            setMessageHistory(prev => [...prev, {
                type: messageType,
                timestamp: new Date(),
                message: notification,
                source: 'user'
            }]);

            if (onNotificationReceivedRef.current) {
                onNotificationReceivedRef.current({
                    ...notification,
                    _metadata: {
                        source: 'user',
                        messageType: messageType,
                        userId: userInfo?.id,
                        receivedAt: new Date().toISOString()
                    }
                });
            }

        } catch (error) {
            console.error(`❌ Error parsing user ${messageType}:`, error);
        }
    }, [userInfo]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            console.log('🧹 USER WebSocket manually disconnecting...');
            clientRef.current.deactivate();
            clientRef.current = null;
            setIsConnected(false);
            setConnectionStatus('disconnected');
            isConnectingRef.current = false;
            reconnectAttemptsRef.current = 0;
        }
    }, []);

    // ✅ USER-SPECIFIC SEND METHODS
    const sendUserNotification = useCallback((message) => {
        if (clientRef.current && clientRef.current.connected) {
            try {
                console.log('📤 User sending notification:', message);
                clientRef.current.publish({
                    destination: '/app/customer/notification',
                    body: JSON.stringify(message)
                });
                setLastActivity(new Date());

                setMessageHistory(prev => [...prev, {
                    type: 'USER_SENT_NOTIFICATION',
                    timestamp: new Date(),
                    message: message
                }]);

                return true;
            } catch (error) {
                console.error('❌ Error sending customer notification:', error);
                return false;
            }
        }
        return false;
    }, []);

    // Effect chính
    useEffect(() => {
        if (enabled && userInfo) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [enabled, userInfo, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        sendUserNotification,
        reconnect: connect,
        disconnect,
        lastActivity,
        reconnectAttempts: reconnectAttemptsRef.current,
        messageHistory,
        userInfo,
        clearMessageHistory: () => setMessageHistory([]),
        isUser: true // ✅ XÁC ĐỊNH RÕ ĐÂY LÀ USER HOOK
    };
};