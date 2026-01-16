import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatAPI from "../../service/ChatAPI";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCustomerByEmail } from "../../service/authService";
import { X, Minimize2, Send, MessageCircle, Loader2, ChevronDown } from 'lucide-react';

const GREEN_1 = "from-green-500 to-green-600";
const GREEN_2 = "from-green-600 to-green-700";

const ChatBox = ({
                     onClose,
                     isMinimized = false,
                     onToggleMinimize,
                     position = 'bottom-right'
                 }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [unreadCount, setUnreadCount] = useState(0);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [pendingMessages, setPendingMessages] = useState(new Set());

    const { user: authUser, isAuthenticated } = useAuth();
    const messagesEndRef = useRef(null);
    const stompClientRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const autoScrollTimeoutRef = useRef(null);
    const userScrollTimeoutRef = useRef(null);
    const dateKeyCounter = useRef(new Map());
    const processedMessageIds = useRef(new Set());

    // Fetch user với ID
    useEffect(() => {
        if (!isAuthenticated || !authUser?.email) return;

        const fetchUser = async () => {
            try {
                const data = await getCustomerByEmail(authUser.email);
                if (data) {
                    setCurrentUser({
                        ...authUser,
                        id: data.id,
                        role: "USER", // Luôn là USER cho ChatBox
                        name: data.name || authUser.name,
                        email: data.email
                    });
                } else {
                    setCurrentUser(authUser);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setCurrentUser(authUser);
            }
        };

        fetchUser();
    }, [isAuthenticated, authUser]);

    // Init room + load messages - CHỈ SỬ DỤNG getCustomerMessages
    useEffect(() => {
        if (!currentUser) return;

        const initChat = async () => {
            setIsLoading(true);
            try {
                const res = await chatAPI.startOrGetChat();
                if (!res.success || !res.room) {
                    throw new Error('Không thể khởi tạo chat');
                }

                setRoomId(res.room.id);

                // Load messages - CHỈ SỬ DỤNG getCustomerMessages cho user
                const response = await chatAPI.getCustomerMessages(res.room.id);

                if (response?.data) {
                    const formatted = response.data.map(msg => {
                        const senderId = msg.senderId || msg.sender?.id;
                        const isMy = senderId?.toString() === currentUser.id?.toString();

                        return {
                            id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            content: msg.content,
                            timestamp: msg.timestamp || msg.createdAt,
                            senderId,
                            displayName: isMy
                                ? "Tôi"
                                : msg.senderRole === "ADMIN"
                                    ? "TravelGo Support"
                                    : msg.senderName || "Người dùng",
                            isMyMessage: isMy
                        };
                    });

                    setMessages(formatted);
                    setShouldAutoScroll(true);

                    formatted.forEach(msg => {
                        if (msg.id) {
                            processedMessageIds.current.add(msg.id);
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading chat:', error);
                setConnectionStatus('error');
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
    }, [currentUser]);

    // WebSocket connection
    useEffect(() => {
        if (!roomId || !currentUser) return;

        const socketUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8080/ws'
            : `https://${window.location.hostname}/ws`;

        const socket = new SockJS(socketUrl);
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                'X-User-Id': currentUser.id,
                'X-User-Name': currentUser.name,
                'X-Room-Id': roomId,
                'X-User-Email': currentUser.email,
                'X-User-Role': currentUser.role
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('✅ WebSocket connected to room:', roomId);
                setConnectionStatus('connected');

                client.subscribe(`/topic/chat/${roomId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        const senderId = data.senderId;
                        const isMy = senderId?.toString() === currentUser.id?.toString();

                        if (data.id && processedMessageIds.current.has(data.id)) {
                            console.log('Tin nhắn đã được xử lý, bỏ qua:', data.id);
                            return;
                        }

                        const newMsg = {
                            id: data.id || `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            content: data.content,
                            timestamp: data.timestamp || new Date(),
                            senderId,
                            isMyMessage: isMy,
                            displayName: isMy
                                ? "Tôi"
                                : data.senderRole === "ADMIN"
                                    ? "TravelGo Support"
                                    : data.senderName || "Người dùng"
                        };

                        if (newMsg.id) {
                            processedMessageIds.current.add(newMsg.id);
                        }

                        if (isMy) {
                            setPendingMessages(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(data.tempId);
                                return newSet;
                            });
                        }

                        setMessages(prev => [...prev, newMsg]);

                        if (!isMinimized && (isMy || !isUserScrolling)) {
                            setShouldAutoScroll(true);
                        }

                        if (isMinimized && !isMy) {
                            setUnreadCount(prev => prev + 1);
                        }
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                });

                client.subscribe(`/user/topic/errors`, (message) => {
                    console.error('WebSocket error:', JSON.parse(message.body));
                });
            },

            onDisconnect: () => {
                console.log('❌ WebSocket disconnected');
                setConnectionStatus('disconnected');
            },

            onStompError: (frame) => {
                console.error('WebSocket STOMP error:', frame);
                setConnectionStatus('error');
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (client.connected) {
                client.deactivate();
            }
            clearAllTimeouts();
            processedMessageIds.current.clear();
        };
    }, [roomId, currentUser, isMinimized, isUserScrolling]);

    // Clear all timeouts
    const clearAllTimeouts = () => {
        if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
        }
        if (userScrollTimeoutRef.current) {
            clearTimeout(userScrollTimeoutRef.current);
        }
    };

    // Hàm scroll đến tin nhắn mới nhất với smooth behavior
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (messagesEndRef.current && messagesContainerRef.current && !isMinimized) {
            messagesEndRef.current.scrollIntoView({
                behavior: behavior,
                block: 'end'
            });
        }
    }, [isMinimized]);

    // Auto scroll khi có tin nhắn mới hoặc mở chat
    useEffect(() => {
        if (!isMinimized && shouldAutoScroll) {
            clearAllTimeouts();

            autoScrollTimeoutRef.current = setTimeout(() => {
                scrollToBottom('instant');
                setShouldAutoScroll(false);
                setIsUserScrolling(false);
                setShowScrollToBottom(false);
            }, 50);
        }

        return () => {
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }
        };
    }, [messages, isMinimized, shouldAutoScroll, scrollToBottom]);

    // Khi mở chat từ minimized, auto scroll xuống cuối
    useEffect(() => {
        if (!isMinimized && messages.length > 0) {
            setShouldAutoScroll(true);
        }
    }, [isMinimized, messages.length]);

    // Reset unread count when opening chat
    useEffect(() => {
        if (!isMinimized) {
            setUnreadCount(0);
        }
    }, [isMinimized]);

    // Kiểm tra vị trí scroll để hiển thị nút "scroll to bottom"
    const checkScrollPosition = useCallback(() => {
        if (!messagesContainerRef.current || isMinimized) return;

        const container = messagesContainerRef.current;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        setShowScrollToBottom(!isAtBottom && messages.length > 3);
    }, [isMinimized, messages.length]);

    // Handle user scroll - khi user tự scroll thì tắt auto scroll
    const handleMessagesScroll = useCallback(() => {
        if (!messagesContainerRef.current || isMinimized) return;

        const container = messagesContainerRef.current;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        if (!isAtBottom) {
            setIsUserScrolling(true);
            setShouldAutoScroll(false);
        } else {
            setIsUserScrolling(false);
        }

        checkScrollPosition();

        if (userScrollTimeoutRef.current) {
            clearTimeout(userScrollTimeoutRef.current);
        }

        userScrollTimeoutRef.current = setTimeout(() => {
            if (isAtBottom) {
                setIsUserScrolling(false);
            }
        }, 500);
    }, [isMinimized, checkScrollPosition]);

    // Thêm event listener cho scroll container
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleMessagesScroll);
            return () => {
                container.removeEventListener('scroll', handleMessagesScroll);
            };
        }
    }, [handleMessagesScroll]);

    // Kiểm tra scroll position khi messages thay đổi
    useEffect(() => {
        if (!isMinimized) {
            checkScrollPosition();
        }
    }, [messages, isMinimized, checkScrollPosition]);

    // Send message - KHÔNG HIỂN THỊ TEMP MESSAGE
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || !stompClientRef.current?.connected || isSending) return;

        setIsSending(true);
        try {
            const messageId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            setPendingMessages(prev => new Set([...prev, messageId]));
            setInput('');
            setShouldAutoScroll(true);
            setIsUserScrolling(false);

            stompClientRef.current.publish({
                destination: `/app/chat.send.${roomId}`,
                body: JSON.stringify({
                    content: text,
                    roomId,
                    senderId: currentUser.id,
                    senderEmail: currentUser.email,
                    senderName: currentUser.name,
                    senderRole: currentUser.role,
                    timestamp: new Date().toISOString(),
                    tempId: messageId
                })
            });

            setTimeout(() => {
                if (pendingMessages.has(messageId)) {
                    setPendingMessages(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(messageId);
                        return newSet;
                    });

                    setMessages(prev => [...prev, {
                        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        content: '❌ Gửi tin nhắn thất bại. Vui lòng thử lại.',
                        timestamp: new Date(),
                        isMyMessage: false,
                        displayName: 'Hệ thống',
                        isError: true
                    }]);
                    setShouldAutoScroll(true);
                }
            }, 3000);

            setTimeout(() => inputRef.current?.focus(), 50);
        } catch (error) {
            console.error('Error sending message:', error);

            setPendingMessages(prev => {
                const newSet = new Set(prev);
                newSet.forEach(id => newSet.delete(id));
                return newSet;
            });

            setMessages(prev => [...prev, {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: '❌ Gửi tin nhắn thất bại. Vui lòng thử lại.',
                timestamp: new Date(),
                isMyMessage: false,
                displayName: 'Hệ thống',
                isError: true
            }]);
            setShouldAutoScroll(true);
        } finally {
            setIsSending(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format time
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "Vừa xong";
        }
    };

    // Format date for grouping
    const formatDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return "Hôm nay";
            } else if (date.toDateString() === yesterday.toDateString()) {
                return "Hôm qua";
            } else {
                return date.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });
            }
        } catch {
            return "";
        }
    };

    // Get unique date key
    const getDateKey = (date) => {
        if (!dateKeyCounter.current.has(date)) {
            dateKeyCounter.current.set(date, 0);
        }
        const count = dateKeyCounter.current.get(date) + 1;
        dateKeyCounter.current.set(date, count);
        return `date_${date}_${count}`;
    };

    // Group messages by date
    const groupedMessages = () => {
        dateKeyCounter.current.clear();

        const groups = [];
        let currentDate = null;

        messages.forEach(msg => {
            const msgDate = formatDate(msg.timestamp);

            if (msgDate !== currentDate) {
                groups.push({
                    type: 'date',
                    date: msgDate,
                    id: getDateKey(msgDate)
                });
                currentDate = msgDate;
            }

            groups.push(msg);
        });

        return groups;
    };

    // Connection status indicator
    const renderConnectionStatus = () => {
        const statusConfig = {
            connecting: { text: "Đang kết nối...", color: "bg-yellow-500" },
            connected: { text: "Đã kết nối", color: "bg-green-500" },
            disconnected: { text: "Mất kết nối", color: "bg-red-500" },
            error: { text: "Lỗi kết nối", color: "bg-red-500" }
        };

        const config = statusConfig[connectionStatus] || statusConfig.error;

        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></div>
                <span className="text-xs opacity-90">{config.text}</span>
            </div>
        );
    };

    const messagesContainerStyle = {
        paddingBottom: '80px'
    };

    // If minimized, show floating button
    if (isMinimized) {
        return (
            <button
                onClick={onToggleMinimize}
                className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'} 
                    w-14 h-14 bg-gradient-to-r ${GREEN_1} text-white rounded-full shadow-xl 
                    hover:shadow-2xl flex items-center justify-center z-50 transition-all 
                    duration-300 hover:scale-110 active:scale-95`}
                title="Mở chat hỗ trợ"
                aria-label="Mở chat hỗ trợ"
            >
                <MessageCircle size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                        font-bold rounded-full w-6 h-6 flex items-center justify-center
                        animate-pulse shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        );
    }

    // Main chat UI
    return (
        <div className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'} 
            w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 
            overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300`}>

            {/* HEADER */}
            <div className={`bg-gradient-to-r ${GREEN_1} text-white px-5 py-4 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <MessageCircle size={20} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">TravelGo Support</h1>
                        {renderConnectionStatus()}
                    </div>
                </div>

                {/* CONTROL BUTTONS */}
                <div className="flex items-center gap-2">
                    {onToggleMinimize && (
                        <button
                            onClick={onToggleMinimize}
                            className="p-2 hover:bg-green-700/30 rounded-lg transition-colors
                                hover:scale-105 active:scale-95"
                            title="Thu nhỏ"
                            aria-label="Thu nhỏ chat"
                        >
                            <Minimize2 size={18} />
                        </button>
                    )}

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-green-700/30 rounded-lg transition-colors
                                hover:scale-105 active:scale-95"
                            title="Đóng chat"
                            aria-label="Đóng chat"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* MESSAGES CONTAINER */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4"
                style={messagesContainerStyle}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                            <div className="absolute inset-0 border-2 border-green-200 rounded-full animate-ping"></div>
                        </div>
                        <p className="mt-4 text-gray-600 font-medium">Đang tải tin nhắn...</p>
                        <p className="text-sm text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50
                            rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={36} className="text-green-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-500">Chưa có tin nhắn nào</p>
                        <p className="text-sm text-center mt-2 max-w-xs">
                            Hãy bắt đầu cuộc trò chuyện với đội ngũ hỗ trợ của chúng tôi!
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-green-600 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Đội ngũ hỗ trợ luôn sẵn sàng 24/7</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {groupedMessages().map((item) => {
                            if (item.type === 'date') {
                                return (
                                    <div key={item.id} className="flex justify-center">
                                        <div className="bg-gradient-to-r from-gray-100 to-gray-50
                                            text-gray-600 text-xs px-4 py-2 rounded-full
                                            border border-gray-200 shadow-sm">
                                            {item.date}
                                        </div>
                                    </div>
                                );
                            }

                            const msg = item;
                            const messageKey = msg.id || `msg_${msg.timestamp}_${Math.random().toString(36).substr(2, 9)}`;

                            return msg.isMyMessage ? (
                                <div key={messageKey} className="flex justify-end animate-in fade-in duration-200">
                                    <div className={`max-w-[80%] bg-gradient-to-r ${GREEN_2} 
                                        text-white rounded-2xl rounded-br-none px-4 py-3 
                                        shadow-lg transition-transform hover:scale-[1.02]`}>
                                        <div className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </div>
                                        <div className="flex justify-between items-center text-xs opacity-90 mt-2">
                                            <span className="font-medium">Tôi</span>
                                            <span>{formatTime(msg.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={messageKey} className="flex justify-start animate-in fade-in duration-200">
                                    <div className="max-w-[80%] bg-white border border-gray-200
                                        rounded-2xl rounded-tl-none px-4 py-3 shadow-lg
                                        transition-transform hover:scale-[1.02]">
                                        <div className="font-medium text-sm text-green-700
                                            flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full
                                                animate-pulse"></div>
                                            {msg.displayName}
                                        </div>
                                        <div className={`text-sm mt-2 text-gray-800 whitespace-pre-wrap break-words
                                            ${msg.isError ? 'text-red-600 italic' : ''}`}>
                                            {msg.content}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 text-right">
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Nút scroll to bottom */}
                {showScrollToBottom && (
                    <button
                        onClick={() => setShouldAutoScroll(true)}
                        className="fixed bottom-28 right-8 bg-gradient-to-r from-green-500 to-green-600
                            text-white p-2.5 rounded-full shadow-lg hover:shadow-xl
                            hover:scale-110 active:scale-95 transition-all duration-200
                            z-10 animate-in slide-in-from-bottom-4"
                        title="Xuống tin nhắn mới nhất"
                        aria-label="Xuống tin nhắn mới nhất"
                    >
                        <ChevronDown size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                                font-bold rounded-full w-5 h-5 flex items-center justify-center
                                animate-pulse shadow">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Hiển thị trạng thái đang gửi tin nhắn */}
                {isSending && (
                    <div key={`sending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`} className="flex justify-end animate-in fade-in duration-200">
                        <div className="max-w-[80%] bg-gradient-to-r from-gray-200 to-gray-300
                            text-gray-700 rounded-2xl rounded-br-none px-4 py-3
                            shadow-lg transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-sm italic">Đang gửi...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập tin nhắn của bạn..."
                            rows="2"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3
                                pr-12 resize-none focus:outline-none focus:ring-2
                                focus:ring-green-500 focus:border-transparent
                                disabled:bg-gray-100 disabled:cursor-not-allowed
                                transition-all duration-200"
                            disabled={connectionStatus !== 'connected' || isSending}
                            aria-label="Nhập tin nhắn"
                        />
                        <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                            {input.length > 0 && `${input.length}/1000`}
                        </div>
                    </div>
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || connectionStatus !== 'connected' || isSending}
                        className={`self-end px-4 py-3 rounded-xl text-white font-medium 
                            transition-all duration-200 flex items-center justify-center
                            ${input.trim() && connectionStatus === 'connected' && !isSending
                            ? `bg-gradient-to-r ${GREEN_1} hover:shadow-lg 
                                   hover:scale-105 active:scale-95`
                            : "bg-gray-300 cursor-not-allowed"
                        }`}
                        title={connectionStatus !== 'connected'
                            ? "Đang mất kết nối"
                            : isSending
                                ? "Đang gửi..."
                                : "Gửi tin nhắn"}
                        aria-label="Gửi tin nhắn"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;