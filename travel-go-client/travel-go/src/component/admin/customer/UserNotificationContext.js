
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import {useUserWebSocket} from "../../../hooks/useUserWebSocket";
import * as notificationService from "../../../service/notificationService";



const UserNotificationContext = createContext();

const userNotificationReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            const newNotification = {
                ...action.payload,
                id: action.payload.id || Date.now().toString(),
                isRead: false,
                createdAt: action.payload.createdAt || new Date().toISOString()
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
            return {
                ...state,
                notifications: state.notifications.map(notif =>
                    notif.id === action.payload ? { ...notif, isRead: true } : notif
                ),
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

export const UserNotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userNotificationReducer, {
        notifications: [],
        unreadCount: 0,
        loading: false,
        soundEnabled: true,
        hasInitialLoad: false
    });

    const hasInitialLoadRef = useRef(false);
    const isFetchingRef = useRef(false);

    // ✅ WebSocket message handler - CHỈ NHẬN USER NOTIFICATIONS
    const handleWebSocketMessage = useCallback((notification) => {
        console.log('👤 UserNotificationContext received notification:', notification);

        // ✅ SECURITY: CHẶN TẤT CẢ ADMIN NOTIFICATIONS
        if (notification.targetAudience === 'ADMIN' ||
            notification.isAdminNotification ||
            notification._metadata?.source === 'admin') {
            console.log('🚫 Security: Blocked ADMIN notification in USER context');
            return;
        }

        // ✅ CHỈ NHẬN USER NOTIFICATIONS
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: notification
        });

        if (state.soundEnabled) {
            playNotificationSound();
        }
    }, [state.soundEnabled]);

    // ✅ User WebSocket hook - CHỈ DÀNH CHO USER
    const {
        isConnected,
        connectionStatus,
        reconnect,
        reconnectAttempts,
        subscribeToUserTopics,
        userInfo,
        lastActivity
    } = useUserWebSocket(handleWebSocketMessage, {
        enabled: true,
        autoReconnect: true,
        maxReconnectAttempts: 5,
        debug: false
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

    // ✅ Fetch USER notifications từ API
    const fetchNotifications = useCallback(async () => {
        if (isFetchingRef.current) {
            console.log('⏸️ Already fetching, skipping...');
            return;
        }

        console.log('🔄 Fetching USER notifications from API service...');
        isFetchingRef.current = true;
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const data = await notificationService.getUserNotifications();
            console.log('📦 USER API Service Response:', data);

            if (data.success) {
                console.log('✅ Fetched USER notifications via service:', data.notifications?.length);
                dispatch({
                    type: 'SET_NOTIFICATIONS',
                    payload: data.notifications || []
                });

                dispatch({ type: 'SET_INITIAL_LOAD', payload: true });
                hasInitialLoadRef.current = true;
            } else {
                console.error('❌ USER API service returned success: false', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching USER notifications via service:', error);
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
            console.log('✅ User marked as read via service:', notificationId);
        } catch (error) {
            console.error('❌ Error marking as read via service:', error);
        }
    }, []);

    // ✅ Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            dispatch({ type: 'MARK_ALL_AS_READ' });
            const result = await notificationService.markAllAsRead();
            console.log('✅ User marked all as read via service:', result);
        } catch (error) {
            console.error('❌ Error marking all as read via service:', error);
        }
    }, []);

    const toggleSound = useCallback(() => {
        dispatch({ type: 'SET_SOUND_ENABLED', payload: !state.soundEnabled });
    }, [state.soundEnabled]);

    // ✅ EFFECT: Fetch notifications khi mount
    useEffect(() => {
        console.log('🎯 UserNotificationProvider mounted - checking if need to fetch');

        if (!hasInitialLoadRef.current && !isFetchingRef.current) {
            console.log('🔄 Initial fetch triggered for USER notifications');
            fetchNotifications();
        } else {
            console.log('⏸️ Already loaded or fetching, skipping');
        }
    }, [fetchNotifications]);

    // ✅ EFFECT: Auto subscribe khi connected
    useEffect(() => {
        if (isConnected && subscribeToUserTopics) {
            console.log('🔗 WebSocket connected - auto subscribing to USER topics');
            subscribeToUserTopics();
        }
    }, [isConnected, subscribeToUserTopics]);

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
        lastActivity,
        userInfo,

        // Actions
        markAsRead,
        markAllAsRead,
        toggleSound,
        reconnect,
        refreshNotifications: fetchNotifications,
        subscribeToUserTopics
    };

    return (
        <UserNotificationContext.Provider value={value}>
            {children}
        </UserNotificationContext.Provider>
    );
};

export const useUserNotification = () => {
    const context = useContext(UserNotificationContext);
    if (!context) {
        throw new Error('useUserNotification must be used within a UserNotificationProvider');
    }
    return context;
};