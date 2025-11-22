// context/AdminNotificationContext.js
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from "../hooks/useWebSocket";
import * as notificationService from "../service/notificationService";

const AdminNotificationContext = createContext();

const adminNotificationReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            const newNotification = {
                ...action.payload,
                id: action.payload.id || Date.now().toString(),
                isRead: false,
                createdAt: action.payload.createdAt || new Date().toISOString(),
                isAdminNotification: true // ✅ FLAG ADMIN
            };

            // Kiểm tra trùng lặp
            const exists = state.notifications.find(n => n.id === newNotification.id);
            if (exists) return state;

            return {
                ...state,
                notifications: [newNotification, ...state.notifications],
                unreadCount: state.unreadCount + 1
            };

        case 'MARK_AS_READ':
            const updatedNotifications = state.notifications.map(notif =>
                notif.id === action.payload ? { ...notif, isRead: true } : notif
            );

            return {
                ...state,
                notifications: updatedNotifications,
                unreadCount: Math.max(0, state.unreadCount - 1)
            };

        case 'MARK_ALL_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
                unreadCount: 0
            };

        case 'SET_NOTIFICATIONS':
            const notifications = action.payload || [];
            return {
                ...state,
                notifications: notifications,
                unreadCount: notifications.filter(n => !n.isRead).length
            };

        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };

        case 'SET_SOUND_ENABLED':
            return {
                ...state,
                soundEnabled: action.payload
            };

        case 'SET_INITIAL_LOAD':
            return {
                ...state,
                hasInitialLoad: action.payload
            };

        default:
            return state;
    }
};

export const AdminNotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(adminNotificationReducer, {
        notifications: [],
        unreadCount: 0,
        loading: false,
        soundEnabled: true,
        hasInitialLoad: false
    });

    const hasInitialLoadRef = useRef(false);
    const isFetchingRef = useRef(false);

    // ✅ WebSocket message handler - CHỈ NHẬN ADMIN NOTIFICATIONS
    const handleWebSocketMessage = useCallback((notification) => {
        console.log('⚡ AdminNotificationContext received notification:', notification);

        // ✅ SECURITY: CHỈ NHẬN ADMIN NOTIFICATIONS
        if (notification.targetAudience === 'USER') {
            console.log('🚫 Security: Blocked USER notification in ADMIN context');
            return;
        }

        // ✅ CHẤP NHẬN CÁC LOẠI NOTIFICATION SAU:
        // - ADMIN notifications
        // - SYSTEM notifications
        // - Không có targetAudience (mặc định cho admin)
        // - Có isAdminNotification flag
        const isAdminNotification =
            notification.targetAudience === 'ADMIN' ||
            notification.targetAudience === 'SYSTEM' ||
            !notification.targetAudience ||
            notification.isAdminNotification;

        if (!isAdminNotification) {
            console.log('🚫 Security: Blocked non-ADMIN notification in ADMIN context');
            return;
        }

        console.log('✅ Processing ADMIN notification:', notification);

        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                ...notification,
                isAdminNotification: true
            }
        });

        if (state.soundEnabled) {
            playNotificationSound();
        }
    }, [state.soundEnabled]);

    // ✅ WebSocket hook CHO ADMIN
    const {
        isConnected,
        connectionStatus,
        reconnect,
        reconnectAttempts,
        subscribeToUserTopics // ✅ DÙNG CHUNG HOOK VỚI USER NHƯNG FILTER Ở TRÊN
    } = useWebSocket(handleWebSocketMessage, {
        enabled: true,
        autoReconnect: true,
        maxReconnectAttempts: 5
    });

    // ✅ Sound function
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                console.log('🔕 Audio playback blocked');
            });
        } catch (error) {
            console.log('🔕 Sound not available');
        }
    };

    // ✅ Fetch ADMIN notifications từ API
    const fetchNotifications = useCallback(async () => {
        if (isFetchingRef.current) {
            console.log('⏸️ Already fetching, skipping...');
            return;
        }

        console.log('🔄 Fetching ADMIN notifications from API service...');
        isFetchingRef.current = true;
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            // ✅ DÙNG CÙNG API VỚI USER NHƯNG FILTER Ở CLIENT SIDE
            const data = await notificationService.getUserNotifications();
            console.log('📦 ADMIN API Service Response:', data);

            if (data.success) {
                // ✅ FILTER CHỈ LẤY ADMIN NOTIFICATIONS
                const adminNotifications = (data.notifications || []).filter(notification =>
                    notification.targetAudience === 'ADMIN' ||
                    notification.targetAudience === 'SYSTEM' ||
                    !notification.targetAudience ||
                    notification.isAdminNotification
                );

                console.log('✅ Fetched ADMIN notifications via service:', adminNotifications.length);

                dispatch({
                    type: 'SET_NOTIFICATIONS',
                    payload: adminNotifications
                });

                dispatch({ type: 'SET_INITIAL_LOAD', payload: true });
                hasInitialLoadRef.current = true;
            } else {
                console.error('❌ ADMIN API service returned success: false', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching ADMIN notifications via service:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            isFetchingRef.current = false;
        }
    }, []);

    // ✅ Mark as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
            await notificationService.markAsRead(notificationId);
            console.log('✅ Admin marked as read via service:', notificationId);
        } catch (error) {
            console.error('❌ Error marking as read via service:', error);
            // ✅ ROLLBACK NẾU CÓ LỖI
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
        }
    }, []);

    // ✅ Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            dispatch({ type: 'MARK_ALL_AS_READ' });
            const result = await notificationService.markAllAsRead();
            console.log('✅ Admin marked all as read via service:', result);
        } catch (error) {
            console.error('❌ Error marking all as read via service:', error);
        }
    }, []);

    const toggleSound = useCallback(() => {
        dispatch({ type: 'SET_SOUND_ENABLED', payload: !state.soundEnabled });
    }, [state.soundEnabled]);

    // ✅ EFFECT: Fetch notifications khi mount
    useEffect(() => {
        console.log('🎯 AdminNotificationProvider mounted - checking if need to fetch');

        if (!hasInitialLoadRef.current && !isFetchingRef.current) {
            console.log('🔄 Initial fetch triggered for ADMIN notifications');
            fetchNotifications();
        } else {
            console.log('⏸️ Already loaded or fetching, skipping');
        }
    }, [fetchNotifications]);

    // ✅ EFFECT: Auto subscribe khi connected
    useEffect(() => {
        if (isConnected && subscribeToUserTopics) {
            console.log('🔗 WebSocket connected - auto subscribing to topics as ADMIN');
            subscribeToUserTopics();
        }
    }, [isConnected, subscribeToUserTopics]);

    // ✅ EFFECT: Refresh notifications khi WebSocket reconnect
    useEffect(() => {
        if (isConnected && hasInitialLoadRef.current) {
            console.log('🔗 WebSocket reconnected - refreshing ADMIN notifications');

            const timer = setTimeout(() => {
                fetchNotifications();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isConnected, fetchNotifications]);

    const value = {
        // State
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        loading: state.loading,
        soundEnabled: state.soundEnabled,
        hasInitialLoad: state.hasInitialLoad,

        // WebSocket
        isConnected,
        connectionStatus,
        retryCount: reconnectAttempts,

        // Actions
        markAsRead,
        markAllAsRead,
        toggleSound,
        reconnect,
        refreshNotifications: fetchNotifications,
        subscribeToAdminTopics: subscribeToUserTopics // ✅ ALIAS CHO ADMIN
    };

    return (
        <AdminNotificationContext.Provider value={value}>
            {children}
        </AdminNotificationContext.Provider>
    );
};

export const useAdminNotification = () => {
    const context = useContext(AdminNotificationContext);
    if (!context) {
        // ✅ RETURN DEFAULT VALUES THAY VÌ THROW ERROR
        return {
            notifications: [],
            unreadCount: 0,
            loading: false,
            soundEnabled: true,
            hasInitialLoad: false,
            isConnected: false,
            connectionStatus: 'disconnected',
            retryCount: 0,
            markAsRead: () => {},
            markAllAsRead: () => {},
            toggleSound: () => {},
            reconnect: () => {},
            refreshNotifications: () => {},
            subscribeToAdminTopics: () => {}
        };
    }
    return context;
};